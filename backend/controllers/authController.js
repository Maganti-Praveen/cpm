// Controller logic for managing auth operations.
// Processes incoming requests, performs validation, and communicates with services.

import * as authService from "../services/authService.js";
import generateToken, { generateRefreshToken } from "../utils/generateToken.js";
import jwt from "jsonwebtoken";
import { dispatch, sendDirectEmail } from "../services/email/emailDispatcher.js";
import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { getCache, setCache, invalidateUsers, invalidateClients } from "../utils/cache.js";
import crypto from "crypto";
import { parsePermissions } from "../utils/permissionParser.js";

// Helper to get company name dynamically from site settings
async function getDynamicCompanyName() {
  try {
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { singletonId: 1 }
    });
    if (siteSettings && siteSettings.siteTitle) {
      return siteSettings.siteTitle.replace(/\s+(CRP|Portal|CRM|System|Solutions)\b/gi, "").trim();
    }
  } catch (e) {
    console.warn("Failed to load company name in authController:", e.message);
  }
  return "Sai IT Services";
}

/**
 * Registers a new user (Staff, Client, or Admin).
 * Enforces role-based registration restrictions and triggers welcome email templates.
 * 
 * @route POST /api/auth/register
 * @param {Object} req - Express request object.
 * @param {Object} req.body - User registration payload.
 * @param {string} req.body.email - Email address of the user.
 * @param {string} req.body.fullName - Full name of the user.
 * @param {string} [req.body.password] - Custom password. If omitted, a secure temporary password is auto-generated.
 * @param {string} req.body.role - Target role ('ADMIN', 'STAFF', 'CLIENT').
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export const register = async (req, res) => {
  try {
    // Permission check for registration
    const isMainAdmin = req.user.role === "ADMIN" && req.user.isSuperAdmin === true;
    if (!isMainAdmin) {
      const userPermissions = parsePermissions(req.user);

      const roleToRegister = req.body.role || "CLIENT";
      if (roleToRegister === "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Super Admin privilege required.",
        });
      }
      if (roleToRegister === "STAFF" && !(userPermissions.staff === true || userPermissions.staff === "true")) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Required permission: staff",
        });
      }
      if (roleToRegister === "CLIENT" && !(userPermissions.clients === true || userPermissions.clients === "true")) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Required permission: clients",
        });
      }
    }

    // Generate secure temporary password if not provided
    const tempPassword = req.body.password || `Pass@${crypto.randomBytes(4).toString("hex")}!`;
    req.body.password = tempPassword;

    const user = await authService.registerUser(req.body);

    // Dispatch welcome email (non-blocking, won't crash registration)
    try {
      let templateSlug = "client-welcome";
      let nameKey = "clientName";
      const variables = {
        email: user.email,
        loginUrl: process.env.FRONTEND_URL || "http://localhost:5173",
        companyName: "Sai IT Services",
        temporaryPassword: tempPassword
      };

      if (user.role === "STAFF") {
        templateSlug = "staff-welcome";
        nameKey = "staffName";
        variables[nameKey] = user.fullName;
      } else if (user.role === "ADMIN") {
        templateSlug = "subadmin-welcome";
        nameKey = "adminName";
        variables[nameKey] = user.fullName;
        
        let permissionsStr = "None";
        if (user.permissions && typeof user.permissions === 'object') {
          const perms = user.permissions;
          const activePages = Object.keys(perms).filter(k => perms[k] === true || perms[k] === 'true');
          if (activePages.length > 0) {
            permissionsStr = activePages.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ");
          }
        } else if (user.permissions) {
          permissionsStr = String(user.permissions);
        }
        variables.permissionsList = permissionsStr;
      } else {
        templateSlug = "client-welcome";
        nameKey = "clientName";
        variables[nameKey] = user.fullName;
      }

      dispatch(templateSlug, user.email, variables);
    } catch (_) { /* email failure is non-critical */ }

    if (user && user.role === "CLIENT") {
      await invalidateClients();
    }
    await invalidateUsers();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        temporaryPassword: tempPassword
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Persistent VerificationSession model is used instead of in-memory Maps.

// Function to handle login operations
// Helper to calculate rate-limiting block status
async function checkBlockStatus(email, ipAddress) {
  const attempts = await prisma.loginAttempt.findMany({
    where: {
      OR: [
        { email },
        { ipAddress }
      ]
    },
    orderBy: { timestamp: "desc" },
    take: 10
  });

  if (attempts.length === 0) return { blocked: false };

  // Calculate consecutive failures for IP
  let ipFailures = 0;
  let lastIpAttempt = null;
  for (const att of attempts) {
    if (att.ipAddress === ipAddress) {
      if (att.status === "SUCCESS") break;
      ipFailures++;
      if (!lastIpAttempt) lastIpAttempt = att;
    }
  }

  // Calculate consecutive failures for Email
  let emailFailures = 0;
  let lastEmailAttempt = null;
  for (const att of attempts) {
    if (att.email === email) {
      if (att.status === "SUCCESS") break;
      emailFailures++;
      if (!lastEmailAttempt) lastEmailAttempt = att;
    }
  }

  const now = new Date();

  // Check 30-minute block (5 failures)
  if (ipFailures >= 5 && lastIpAttempt) {
    const cooldownEnd = new Date(lastIpAttempt.timestamp.getTime() + 30 * 60 * 1000);
    if (now < cooldownEnd) {
      return { blocked: true, type: "IP", duration: 30, remaining: Math.ceil((cooldownEnd - now) / 1000) };
    }
  }
  if (emailFailures >= 5 && lastEmailAttempt) {
    const cooldownEnd = new Date(lastEmailAttempt.timestamp.getTime() + 30 * 60 * 1000);
    if (now < cooldownEnd) {
      return { blocked: true, type: "EMAIL", duration: 30, remaining: Math.ceil((cooldownEnd - now) / 1000) };
    }
  }

  // Check 1-minute block (exactly 3 failures)
  if (ipFailures === 3 && lastIpAttempt) {
    const cooldownEnd = new Date(lastIpAttempt.timestamp.getTime() + 1 * 60 * 1000);
    if (now < cooldownEnd) {
      return { blocked: true, type: "IP", duration: 1, remaining: Math.ceil((cooldownEnd - now) / 1000) };
    }
  }
  if (emailFailures === 3 && lastEmailAttempt) {
    const cooldownEnd = new Date(lastEmailAttempt.timestamp.getTime() + 1 * 60 * 1000);
    if (now < cooldownEnd) {
      return { blocked: true, type: "EMAIL", duration: 1, remaining: Math.ceil((cooldownEnd - now) / 1000) };
    }
  }

  return { blocked: false };
}

/**
 * Authenticates user credentials, handles rate limiting, evaluates global and user-specific 2FA requirements,
 * and sets cookies for session management.
 * 
 * @route POST /api/auth/login
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Login credentials.
 * @param {string} req.body.email - Email of the user.
 * @param {string} req.body.password - Password.
 * @param {string} [req.body.role] - Expected role of the user logging in.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export const login = async (req, res) => {
  const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
  req.body.email = email;
  let ipAddress = "";
  if (req.headers["x-forwarded-for"]) {
    ipAddress = req.headers["x-forwarded-for"].split(",")[0].trim();
  } else {
    ipAddress = req.ip || req.socket.remoteAddress || "";
  }
  if (ipAddress.startsWith("::ffff:")) {
    ipAddress = ipAddress.substring(7);
  }

  try {
    const block = await checkBlockStatus(email, ipAddress);
    if (block.blocked) {
      const msg = block.duration === 30
        ? `Too many failed login attempts. This ${block.type.toLowerCase()} is temporarily blocked. Please try again in ${Math.ceil(block.remaining / 60)} minutes.`
        : `Too many failed login attempts. Please try again in ${block.remaining} seconds.`;
      return res.status(400).json({ success: false, message: msg });
    }

    const user = await authService.loginUser(req.body);

    const expectedRole = req.body.role;
    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Invalid portal credentials."
      });
    }

    // check if 2FA is required — either per-user flag or global role toggle
    let requires2FA = user.twoFactorEnabled;
    if (!requires2FA) {
      const secSettings = await prisma.securitySettings.findUnique({ where: { singletonId: 1 } });
      if (secSettings) {
        const roleToggleMap = { ADMIN: "admin2FAEnabled", STAFF: "staff2FAEnabled", CLIENT: "client2FAEnabled" };
        const toggleKey = roleToggleMap[user.role];
        if (toggleKey && secSettings[toggleKey]) {
          requires2FA = true;
        }
      }
    }

    if (requires2FA) {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

      // Store in database verificationSession
      await prisma.verificationSession.upsert({
        where: { email: user.email },
        update: {
          code,
          type: "2FA",
          expiresAt: new Date(expiresAt),
          attempts: 0,
          verified: false,
          userId: user.id,
        },
        create: {
          email: user.email,
          code,
          type: "2FA",
          expiresAt: new Date(expiresAt),
          attempts: 0,
          verified: false,
          userId: user.id,
        },
      });

      // Send direct email with the OTP code
      const companyName = await getDynamicCompanyName();
      const subject = `Your ${companyName} Verification Code`;
      const html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">${companyName} Portal Verification</h2>
          <p>Hello <strong>${user.fullName}</strong>,</p>
          <p>You are attempting to log in to the ${companyName} portal. Please use the following 6-digit One-Time Password (OTP) to complete your verification:</p>
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0f172a; margin: 20px 0;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #64748b;">This verification code is valid for 5 minutes. If you did not request this code, please secure your account immediately.</p>
        </div>
      `;

      // Send the direct email, then log result
      sendDirectEmail(user.email, subject, html)
        .then(() => {
          prisma.emailLog.create({
            data: { recipient: user.email, template: "two-factor-auth", subject, status: "sent" },
          }).catch((logErr) => console.error("[2FA] Failed to write log:", logErr.message));
        })
        .catch((err) => {
          console.error("2FA sendDirectEmail failed:", err.message);
          prisma.emailLog.create({
            data: { recipient: user.email, template: "two-factor-auth", subject, status: "failed", error: err.message },
          }).catch((logErr) => console.error("[2FA] Failed to write log:", logErr.message));
        });

      return res.status(200).json({
        success: true,
        twoFactorRequired: true,
        email: user.email,
        message: "Two-factor authentication code sent to email."
      });
    }

    // Log SUCCESS login attempt and update user's lastLogin timestamp
    await Promise.all([
      prisma.loginAttempt.create({
        data: {
          email,
          ipAddress,
          status: "SUCCESS"
        }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      })
    ]).catch(err => console.error("Failed to log success login attempt or update lastLogin:", err.message));

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        adminRole: user.adminRole || null,
        permissions: user.permissions || null,
        isFirstLogin: user.isFirstLogin,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLogin: new Date(),
        themeId: user.themeId,
        theme: user.theme,
        token,
      },
    });
  } catch (error) {
    // Log FAILED login attempt
    await prisma.loginAttempt.create({
      data: {
        email,
        ipAddress,
        status: "FAILED",
        message: error.message
      }
    }).catch(err => console.error("Failed to log failed login attempt:", err.message));

    // Check consecutive failure count to see if we should trigger email alert
    try {
      if (email) {
        const attempts = await prisma.loginAttempt.findMany({
          where: { email },
          orderBy: { timestamp: "desc" },
          take: 10
        });
        let failures = 0;
        for (const att of attempts) {
          if (att.status === "SUCCESS") break;
          failures++;
        }
        if (failures === 5) {
          // Send suspicious login alert email via the customizable templates system
          const targetUser = await prisma.user.findUnique({ where: { email } });
          if (targetUser) {
            dispatch("suspicious-login", email, {
              userName: targetUser.fullName,
              ipAddress: ipAddress
            }).catch((err) => {
              console.error("[Security Alert] Template dispatch failed:", err.message);
            });
          }
        }
      }
    } catch (countErr) {
      console.error("Error checking consecutive failures count:", countErr.message);
    }

    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verifies a user's 2FA OTP code, updates login status, and returns session tokens.
 * 
 * @route POST /api/auth/verify-2fa
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Verification request payload.
 * @param {string} req.body.email - Email address of the user.
 * @param {string} req.body.code - 6-digit verification code.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export const verify2FA = async (req, res) => {
  try {
    const { email: rawEmail, code: inputCode, otp } = req.body;
    const code = inputCode || otp;
    const email = rawEmail ? rawEmail.trim().toLowerCase() : "";

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required."
      });
    }

    const entry = await prisma.verificationSession.findUnique({
      where: { email }
    });
    if (!entry || entry.type !== "2FA") {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification session."
      });
    }

    if (Date.now() > entry.expiresAt.getTime()) {
      await prisma.verificationSession.delete({ where: { email } }).catch(() => {});
      return res.status(400).json({
        success: false,
        message: "Verification code has expired."
      });
    }

    if (entry.code !== code) {
      const attempts = entry.attempts + 1;
      if (attempts >= 3) {
        await prisma.verificationSession.delete({ where: { email } }).catch(() => {});
        return res.status(400).json({
          success: false,
          message: "Too many incorrect verification attempts. Please log in again."
        });
      }
      await prisma.verificationSession.update({
        where: { email },
        data: { attempts }
      });
      return res.status(400).json({
        success: false,
        message: `Incorrect code. ${3 - attempts} attempts remaining.`
      });
    }

    // Success! Fetch user and issue token
    const user = await prisma.user.findUnique({
      where: { id: entry.userId },
      include: { theme: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // Clear verification session & update user's lastLogin
    const [updatedUser] = await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
        include: { theme: true }
      }),
      prisma.loginAttempt.create({
        data: {
          email,
          ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
          status: "SUCCESS"
        }
      }),
      prisma.verificationSession.delete({ where: { email } }).catch(() => {})
    ]).catch(err => {
      console.error("[2FA] Failed to update lastLogin or log attempt:", err.message);
      return [user];
    });

    const activeUser = updatedUser || user;
    const token = generateToken(activeUser);
    const refreshToken = generateRefreshToken(activeUser);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Two-factor authentication verified.",
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        adminRole: user.adminRole || null,
        permissions: user.permissions || null,
        isFirstLogin: user.isFirstLogin,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLogin: activeUser.lastLogin || new Date(),
        themeId: user.themeId,
        theme: user.theme,
        token,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Resends a 2FA verification code via email.
 * 
 * @route POST /api/auth/resend-2fa
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Payload containing user email.
 * @param {string} req.body.email - Email of the user requesting code.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export const resend2FA = async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    const email = rawEmail ? rawEmail.trim().toLowerCase() : "";

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required."
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found."
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    await prisma.verificationSession.upsert({
      where: { email: user.email },
      update: {
        code,
        type: "2FA",
        expiresAt: new Date(expiresAt),
        attempts: 0,
        verified: false,
        userId: user.id,
      },
      create: {
        email: user.email,
        code,
        type: "2FA",
        expiresAt: new Date(expiresAt),
        attempts: 0,
        verified: false,
        userId: user.id,
      },
    });

    const companyName = await getDynamicCompanyName();
    const subject = `Your ${companyName} Verification Code`;
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">${companyName} Portal Verification</h2>
        <p>Hello <strong>${user.fullName}</strong>,</p>
        <p>You requested a new 6-digit One-Time Password (OTP) to complete your portal login verification:</p>
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0f172a; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #64748b;">This verification code is valid for 5 minutes. If you did not request this code, please secure your account immediately.</p>
      </div>
    `;

    sendDirectEmail(user.email, subject, html)
      .then(() => {
        prisma.emailLog.create({
          data: { recipient: user.email, template: "two-factor-auth", subject, status: "sent" },
        }).catch((logErr) => console.error("[2FA] Failed to write log:", logErr.message));
      })
      .catch((err) => {
        console.error("2FA sendDirectEmail failed:", err.message);
      });

    return res.status(200).json({
      success: true,
      message: "New verification code sent to your email."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Fetches the currently logged-in user's profile details.
 * 
 * @route GET /api/auth/profile
 * @param {Object} req - Express request object.
 * @param {Object} req.user - Populated user object from auth middleware.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        isSuperAdmin: req.user.isSuperAdmin,
        adminRole: req.user.adminRole || null,
        permissions: req.user.permissions || null,
        isFirstLogin: req.user.isFirstLogin,
        twoFactorEnabled: req.user.twoFactorEnabled,
        avatar: req.user.avatar,
        themeId: req.user.themeId,
        theme: req.user.theme,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Updates details on the logged-in user's profile.
 * 
 * @route PUT /api/auth/profile
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Updated profile fields (fullName, phone, etc.).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || !fullName.trim()) {
        return res.status(400).json({ success: false, message: "Full name cannot be empty." });
      }
    }

    if (phone !== undefined && phone !== null && String(phone).trim() !== "") {
      const phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
      if (!phoneRegex.test(String(phone).trim())) {
        return res.status(400).json({ success: false, message: "Invalid phone number format." });
      }
    }

    const user = await authService.updateProfile(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        adminRole: user.adminRole || null,
        permissions: user.permissions || null,
        twoFactorEnabled: user.twoFactorEnabled,
        avatar: user.avatar,
        themeId: user.themeId,
        theme: user.theme,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Retrieves a list of users filtered by role.
 * 
 * @route GET /api/auth/users
 * @param {Object} req - Express request object.
 * @param {Object} req.query - Query filters (role, page, limit).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export const getUsers = async (req, res) => {
  try {
    const isMainAdmin = req.user.role === "ADMIN" && req.user.isSuperAdmin === true;
    if (!isMainAdmin) {
      const userPermissions = parsePermissions(req.user);

      const requestedRole = req.query.role;
      if (!requestedRole) {
        return res.status(403).json({ success: false, message: "Access denied. Super Admin privilege required." });
      }
      if (requestedRole === "ADMIN") {
        return res.status(403).json({ success: false, message: "Access denied. Only super-admins can view or manage other administrators." });
      }
      if (requestedRole === "STAFF" && !(userPermissions.staff === true || userPermissions.staff === "true")) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: staff" });
      }
      if (requestedRole === "CLIENT" && !(userPermissions.clients === true || userPermissions.clients === "true")) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: clients" });
      }
    }

    const roleFilter = req.query.role || "all";
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    const cacheKey = `users:list:${roleFilter}:p${page || "all"}:l${limit || "all"}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    let users;
    let total;

    const whereClause = req.query.role && req.query.role !== "all" ? { role: req.query.role } : {};

    if (page && limit) {
      const skip = (page - 1) * limit;
      [users, total] = await Promise.all([
        authService.getAllUsers({ ...req.query, skip, take: limit }),
        prisma.user.count({ where: whereClause })
      ]);
    } else {
      users = await authService.getAllUsers(req.query);
      total = users.length;
    }

    const mappedData = users.map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      company: u.company,
      phone: u.phone,
      status: u.status,
      avatar: u.avatar,
      adminRole: u.adminRole || null,
      permissions: u.permissions || null,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin || null,
      suspensionReason: u.suspensionReason || null,
      suspendedAt: u.suspendedAt || null,
      unsuspendedAt: u.unsuspendedAt || null,
    }));

    const responseData = {
      success: true,
      data: mappedData,
      pagination: {
        page: page || 1,
        limit: limit || total,
        total,
        pages: limit ? Math.ceil(total / limit) : 1
      }
    };

    await setCache(cacheKey, responseData, 3600);

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Function to handle updateUser operations
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMainAdmin = req.user.role === "ADMIN" && req.user.isSuperAdmin === true;
    if (!isMainAdmin) {
      const userPermissions = parsePermissions(req.user);

      if (existingUser.role === "ADMIN" || req.body.role === "ADMIN") {
        return res.status(403).json({ success: false, message: "Access denied. Only super-admins can manage other administrators." });
      }
      if (existingUser.role === "STAFF" && !(userPermissions.staff === true || userPermissions.staff === "true")) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: staff" });
      }
      if (existingUser.role === "CLIENT" && !(userPermissions.clients === true || userPermissions.clients === "true")) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: clients" });
      }
    }

    const user = await authService.updateUserById(id, req.body);

    // Send email notifications if status changed to/from Suspended
    if (existingUser && user && existingUser.status !== user.status) {
      if (user.status === "Suspended") {
        try {
          await dispatch("account-suspended", user.email, {
            userName: user.fullName,
            suspensionReason: user.suspensionReason || "No reason provided",
            companyName: "Sai IT Services",
          });
        } catch (err) {
          console.error("[UpdateUser] Failed to dispatch account suspended email:", err.message);
        }
      } else if (existingUser.status === "Suspended" && user.status === "Active") {
        try {
          await dispatch("account-reactivated", user.email, {
            userName: user.fullName,
            companyName: "Sai IT Services",
          });
        } catch (err) {
          console.error("[UpdateUser] Failed to dispatch account reactivated email:", err.message);
        }
      }
    }

    // Calculate actual diff for the audit log
    if (existingUser) {
      const auditDetails = {};
      const fields = ['fullName', 'email', 'phone', 'status', 'role', 'company', 'adminRole', 'permissions'];
      for (const field of fields) {
        if (req.body[field] !== undefined) {
          let isChanged = false;
          if (field === 'permissions') {
            isChanged = JSON.stringify(req.body.permissions) !== JSON.stringify(existingUser.permissions);
          } else {
            isChanged = req.body[field] !== existingUser[field];
          }
          if (isChanged) {
            auditDetails[field] = req.body[field];
          }
        }
      }
      req.auditDetails = auditDetails;
    }

    // Send email notification to sub-admins if permissions or roles are updated
    if (user && user.role === "ADMIN" && (req.body.permissions !== undefined || req.body.adminRole !== undefined)) {
      try {
        let permissionsStr = "None";
        if (user.permissions && typeof user.permissions === 'object') {
          const perms = user.permissions;
          const activePages = Object.keys(perms).filter(k => perms[k] === true || perms[k] === 'true');
          if (activePages.length > 0) {
            permissionsStr = activePages.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ");
          }
        } else if (user.permissions) {
          permissionsStr = String(user.permissions);
        }

        dispatch("subadmin-permissions-updated", user.email, {
          adminName: user.fullName,
          roleName: user.adminRole || "Sub-Admin",
          permissionsList: permissionsStr,
          loginUrl: process.env.FRONTEND_URL || "http://localhost:5173",
          companyName: "Sai IT Services",
        });
      } catch (err) {
        console.error("[UpdateUser] Failed to dispatch subadmin permissions updated email:", err.message);
      }
    }

    if ((existingUser && existingUser.role === "CLIENT") || (user && user.role === "CLIENT")) {
      await invalidateClients();
    }
    await invalidateUsers();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Function to handle deleteUser operations
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (targetUser.status !== "Suspended") {
      return res.status(400).json({
        success: false,
        code: "ACCOUNT_NOT_SUSPENDED",
        message: "Account must be suspended before deletion."
      });
    }

    const isMainAdmin = req.user.role === "ADMIN" && req.user.isSuperAdmin === true;
    if (!isMainAdmin) {
      const userPermissions = parsePermissions(req.user);

      if (targetUser.role === "ADMIN") {
        return res.status(403).json({ success: false, message: "Access denied. Only super-admins can manage other administrators." });
      }
      if (targetUser.role === "STAFF" && !(userPermissions.staff === true || userPermissions.staff === "true")) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: staff" });
      }
      if (targetUser.role === "CLIENT" && !(userPermissions.clients === true || userPermissions.clients === "true")) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: clients" });
      }
    }

    await authService.deleteUserById(id);

    // Send email notification after account deletion
    try {
      await dispatch("account-deleted", targetUser.email, {
        userName: targetUser.fullName || targetUser.name,
      });
    } catch (emailErr) {
      console.error("[DeleteUser] Failed to send account-deleted email:", emailErr.message);
    }

    if (targetUser && targetUser.role === "CLIENT") {
      await invalidateClients();
    }
    await invalidateUsers();

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// Function to handle saveUserTheme operations
export const saveUserTheme = async (req, res) => {
  try {
    const { themeId } = req.body;

    if (themeId) {
      const themeExists = await prisma.theme.findUnique({
        where: { id: themeId },
      });
      if (!themeExists) {
        return res.status(404).json({ success: false, message: "Theme not found" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { themeId: themeId || null },
      include: { theme: true },
    });

    res.status(200).json({
      success: true,
      message: "User theme preference updated successfully",
      data: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        avatar: updatedUser.avatar,
        themeId: updatedUser.themeId,
        theme: updatedUser.theme,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Function to handle forgotPassword operations
export const forgotPassword = async (req, res) => {
  try {
    const rawEmail = req.body.email;
    if (!rawEmail) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    const email = rawEmail.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    // Enforce 60-second cooldown between resends
    const entry = await prisma.verificationSession.findUnique({
      where: { email },
    });

    if (entry && entry.type === "FORGOT_PASSWORD") {
      const timeRemaining = entry.expiresAt.getTime() - Date.now();
      const timeElapsed = (10 * 60 * 1000) - timeRemaining;
      if (timeElapsed > 0 && timeElapsed < 60 * 1000) {
        const waitSec = Math.ceil((60 * 1000 - timeElapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSec} seconds before requesting another OTP.`,
        });
      }
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store in database verificationSession
    await prisma.verificationSession.upsert({
      where: { email },
      update: {
        code,
        type: "FORGOT_PASSWORD",
        expiresAt: new Date(expiresAt),
        attempts: 0,
        verified: false,
        userId: null
      },
      create: {
        email,
        code,
        type: "FORGOT_PASSWORD",
        expiresAt: new Date(expiresAt),
        attempts: 0,
        verified: false,
        userId: null
      }
    });

    // Send direct email with the OTP code
    const companyName = await getDynamicCompanyName();
    const subject = `${companyName} Password Reset Verification Code`;
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">${companyName} Password Reset</h2>
        <p>Hello <strong>${user.fullName}</strong>,</p>
        <p>We received a request to reset your password. Please use the following 6-digit verification code to proceed with the password reset:</p>
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0f172a; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #64748b;">This verification code is valid for 10 minutes. If you did not request this password reset, please ignore this email.</p>
      </div>
    `;

    await sendDirectEmail(email, subject, html);

    // Log the email sending
    await prisma.emailLog.create({
      data: {
        recipient: email,
        template: "password-reset-otp",
        subject,
        status: "sent",
      },
    }).catch((logErr) => console.error("[ForgotPass] Failed to write log:", logErr.message));

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Function to handle verifyOTP operations
export const verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    const entry = await prisma.verificationSession.findUnique({
      where: { email }
    });
    if (!entry || entry.type !== "FORGOT_PASSWORD") {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset session.",
      });
    }

    if (Date.now() > entry.expiresAt.getTime()) {
      await prisma.verificationSession.delete({ where: { email } }).catch(() => {});
      return res.status(400).json({
        success: false,
        message: "Verification code has expired.",
      });
    }

    if (entry.code !== code) {
      return res.status(400).json({
        success: false,
        message: "Incorrect verification code.",
      });
    }

    // Mark as verified and extend expiration for the password update step
    await prisma.verificationSession.update({
      where: { email },
      data: {
        verified: true,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    res.status(200).json({
      success: true,
      message: "Code verified successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Function to handle resetPassword operations
export const resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and confirm password are required.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const entry = await prisma.verificationSession.findUnique({
      where: { email }
    });
    if (!entry || entry.type !== "FORGOT_PASSWORD" || !entry.verified) {
      return res.status(400).json({
        success: false,
        message: "Session is invalid or email verification was not completed.",
      });
    }

    if (Date.now() > entry.expiresAt.getTime()) {
      await prisma.verificationSession.delete({ where: { email } }).catch(() => {});
      return res.status(400).json({
        success: false,
        message: "Session has expired. Please request a new code.",
      });
    }

    // Hash and update the user's password
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        isFirstLogin: false,
      },
    });

    // Clear session
    await prisma.verificationSession.delete({ where: { email } }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const bulkDeleteUsers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No user IDs provided" });
    }

    const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (numericIds.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid user IDs" });
    }

    const isMainAdmin = req.user.role === "ADMIN" && req.user.isSuperAdmin === true;

    // Fetch users first to check roles and verify permissions
    const usersToDelete = await prisma.user.findMany({
      where: { id: { in: numericIds } }
    });

    if (usersToDelete.length === 0) {
      return res.status(404).json({ success: false, message: "No users found" });
    }

    const userPermissions = isMainAdmin ? {} : parsePermissions(req.user);

    // Role checks
    for (const u of usersToDelete) {
      if ((u.role === "STAFF" || u.role === "CLIENT") && u.status !== "Suspended") {
        return res.status(400).json({
          success: false,
          code: "ACCOUNT_NOT_SUSPENDED",
          message: `Account for "${u.fullName}" must be suspended before deletion.`
        });
      }

      // Prevent deleting the main admin
      if (u.isSuperAdmin) {
        return res.status(403).json({ success: false, message: "Cannot delete the main admin account." });
      }
      // Prevent deleting self
      if (u.id === req.user.id) {
        return res.status(403).json({ success: false, message: "Cannot delete your own logged-in account." });
      }

      if (!isMainAdmin) {
        if (u.role === "ADMIN") {
          return res.status(403).json({ success: false, message: "Access denied. Super Admin privilege required to delete admins." });
        }
        if (u.role === "STAFF" && !(userPermissions.staff === true || userPermissions.staff === "true")) {
          return res.status(403).json({ success: false, message: "Access denied. Required permission: staff" });
        }
        if (u.role === "CLIENT" && !(userPermissions.clients === true || userPermissions.clients === "true")) {
          return res.status(403).json({ success: false, message: "Access denied. Required permission: clients" });
        }
      }
    }

    // Execute safe database transaction
    await prisma.$transaction(async (tx) => {
      // 1. Set clientId: null on Projects to avoid foreign key restriction on deletion
      await tx.project.updateMany({
        where: { clientId: { in: numericIds } },
        data: { clientId: null }
      });

      // 2. Delete users (which cascades to Invoices, Transactions, Tickets, TicketReplies, Notifications, and AuditLogs)
      await tx.user.deleteMany({
        where: { id: { in: numericIds } }
      });
    }, { maxWait: 20000, timeout: 30000 });

    // Global audit trail logging details
    req.auditDetails = {
      description: `Admin bulk deleted ${usersToDelete.length} accounts`,
      deletedCount: usersToDelete.length,
      roles: Array.from(new Set(usersToDelete.map(u => u.role)))
    };

    const hasClient = usersToDelete.some(u => u.role === "CLIENT");
    if (hasClient) {
      await invalidateClients();
    }
    await invalidateUsers();

    // Send email notifications to all deleted users
    for (const u of usersToDelete) {
      try {
        await dispatch("account-deleted", u.email, {
          userName: u.fullName || u.name,
        });
      } catch (emailErr) {
        console.error(`[BulkDeleteUsers] Failed to send account-deleted email to ${u.email}:`, emailErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${usersToDelete.length} users.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Function to handle silent refresh of access tokens
export const refreshToken = async (req, res) => {
  try {
    const cookieHeader = req.headers.cookie;
    const cookies = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const parts = cookie.split("=");
        cookies[parts.shift().trim()] = decodeURI(parts.join("="));
      });
    }

    const token = cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret");
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { theme: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (user.status === "Suspended") {
      return res.status(401).json({ success: false, message: "User account suspended" });
    }

    const newAccessToken = generateToken(user);
    res.status(200).json({
      success: true,
      token: newAccessToken,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
};

// Function to handle logout and clear refresh token cookie
export const logoutUser = async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};




