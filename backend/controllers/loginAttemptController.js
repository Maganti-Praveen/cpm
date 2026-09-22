import prisma from "../config/prisma.js";

// GET /api/login-attempts
// Fetches paginated login attempts with optional filters for search (by email or IP) and status
export const getLoginAttempts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
    const status = req.query.status || "All";

    // Build filter conditions
    const where = {
      isDeleted: false
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status !== "All") {
      where.status = status.toUpperCase(); // SUCCESS or FAILED
    }

    // Query databases
    const [attempts, total] = await Promise.all([
      prisma.loginAttempt.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
      }),
      prisma.loginAttempt.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: attempts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/login-attempts/stats
// Fetches aggregation metrics for successful vs failed login attempts (excluding soft-deleted rows)
export const getLoginStats = async (req, res) => {
  try {
    const [total, success, failed] = await Promise.all([
      prisma.loginAttempt.count({ where: { isDeleted: false } }),
      prisma.loginAttempt.count({ where: { status: "SUCCESS", isDeleted: false } }),
      prisma.loginAttempt.count({ where: { status: "FAILED", isDeleted: false } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        success,
        failed,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/login-attempts
// Clears all login audit records
export const clearLoginAttempts = async (req, res) => {
  try {
    await prisma.loginAttempt.updateMany({
      data: { isDeleted: true }
    });
    res.status(200).json({ success: true, message: "Successfully cleared all login audit logs." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/login-attempts/unlock
// Deletes failed login attempt records for a specific email or IP to reset its lockout block status
export const unlockAccount = async (req, res) => {
  try {
    const { email, ipAddress } = req.body;
    if (!email && !ipAddress) {
      return res.status(400).json({ success: false, message: "Email or IP Address is required to unlock." });
    }

    // Instead of deleting failed attempts, log a new SUCCESS attempt indicating Admin Reset/Unlock.
    // This breaks the consecutive failures count check and preserves history.
    await prisma.loginAttempt.create({
      data: {
        email: email ? email.trim().toLowerCase() : "",
        ipAddress: ipAddress ? ipAddress.trim() : "",
        status: "SUCCESS",
        message: "Account unlocked by Admin"
      }
    });

    res.status(200).json({
      success: true,
      message: `Successfully unlocked and reset rate limits for ${email || ipAddress}.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/login-attempts/:id
// Soft deletes a specific login attempt record by ID (hiding it from the UI but keeping rate limit locks)
export const deleteLoginAttempt = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid attempt ID." });
    }

    await prisma.loginAttempt.update({
      where: { id },
      data: { isDeleted: true }
    });

    res.status(200).json({ success: true, message: "Successfully deleted the login attempt record." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/login-attempts/locked
// Identifies all currently locked-out emails and IP addresses based on recent consecutive failures
export const getLockedAccounts = async (req, res) => {
  try {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Fetch FAILED and SUCCESS attempts from the last 30 minutes (to check current blocks)
    // We order by timestamp desc to get consecutive failures starting from the most recent
    const recentAttempts = await prisma.loginAttempt.findMany({
      where: {
        timestamp: {
          gte: thirtyMinutesAgo
        }
      },
      orderBy: { timestamp: "desc" }
    });

    // Group attempts by Email and by IP
    const emailAttemptsMap = {};
    const ipAttemptsMap = {};

    for (const att of recentAttempts) {
      if (att.email) {
        if (!emailAttemptsMap[att.email]) emailAttemptsMap[att.email] = [];
        emailAttemptsMap[att.email].push(att);
      }
      if (att.ipAddress) {
        if (!ipAttemptsMap[att.ipAddress]) ipAttemptsMap[att.ipAddress] = [];
        ipAttemptsMap[att.ipAddress].push(att);
      }
    }

    const lockedList = [];

    // Helper to evaluate block status from attempt log list
    const evaluateBlock = (identifier, attempts, type) => {
      let failures = 0;
      let lastAttempt = null;
      for (const att of attempts) {
        if (att.status === "SUCCESS") break;
        failures++;
        if (!lastAttempt) lastAttempt = att;
      }

      if (failures === 0 || !lastAttempt) return;

      const attemptTime = lastAttempt.timestamp.getTime();

      // Check 30-minute block (5 fails)
      if (failures >= 5) {
        const cooldownEnd = attemptTime + 30 * 60 * 1000;
        if (now.getTime() < cooldownEnd) {
          lockedList.push({
            type,
            target: identifier,
            consecutiveFailures: failures,
            lockType: "30 Minutes",
            lastAttempt: lastAttempt.timestamp,
            remaining: Math.ceil((cooldownEnd - now.getTime()) / 1000)
          });
          return;
        }
      }

      // Check 1-minute block (3 fails)
      if (failures >= 3) {
        const cooldownEnd = attemptTime + 1 * 60 * 1000;
        if (now.getTime() < cooldownEnd) {
          lockedList.push({
            type,
            target: identifier,
            consecutiveFailures: failures,
            lockType: "1 Minute",
            lastAttempt: lastAttempt.timestamp,
            remaining: Math.ceil((cooldownEnd - now.getTime()) / 1000)
          });
        }
      }
    };

    // Evaluate all emails
    for (const email of Object.keys(emailAttemptsMap)) {
      evaluateBlock(email, emailAttemptsMap[email], "Email");
    }

    // Evaluate all IPs
    for (const ip of Object.keys(ipAttemptsMap)) {
      evaluateBlock(ip, ipAttemptsMap[ip], "IP Address");
    }

    res.status(200).json({
      success: true,
      data: lockedList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
