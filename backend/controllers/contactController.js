// Controller logic for managing contact operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { getCache, setCache, deleteCache, invalidateContacts, invalidateUsers, invalidateClients } from "../utils/cache.js";
import { dispatch, sendDirectEmail } from "../services/email/emailDispatcher.js";

/**
 * Creates a new contact submission.
 * If the submitter's email belongs to a currently suspended user,
 * the submission is automatically classified as a "Suspended" inquiry.
 * Invalidates contact-related caches upon successful creation.
 *
 * @route POST /api/contacts
 * @param {import('express').Request} req - Express request object.
 * @param {Object} req.body - Submission details.
 * @param {string} req.body.firstName - Submitter's first name.
 * @param {string} req.body.lastName - Submitter's last name.
 * @param {string} req.body.email - Submitter's email address.
 * @param {string} req.body.subject - Subject of the inquiry.
 * @param {string} req.body.message - Message body.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const createContact = async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if the user is currently suspended
    const user = await prisma.user.findUnique({ where: { email } });
    const isSuspended = user?.status === "Suspended";

    const submission = await prisma.contactSubmission.create({
      data: {
        firstName,
        lastName,
        email,
        subject,
        message,
        status: isSuspended ? "Suspended" : "Pending",
        isSuspensionInquiry: isSuspended
      }
    });

    await invalidateContacts();
    if (isSuspended) {
      await deleteCache("contacts:suspension");
    }

    // Dispatch acknowledgment email to user asynchronously
    dispatch("contact-acknowledgment", email, {
      firstName,
      lastName,
      subject,
      message,
    }).catch((err) => {
      console.error("[ContactSubmit] Acknowledgment email dispatch failed:", err.message);
    });
    

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    console.error("[ContactSubmit] Error creating submission:", error.message || error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Retrieves all normal (non-suspension) contact submissions.
 * Restricted to ADMIN role. Utilizes Redis caching ('contacts:list').
 *
 * @route GET /api/contacts
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const getContacts = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const cacheKey = "contacts:list";
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({ success: true, data: cachedData });
    }

    const submissions = await prisma.contactSubmission.findMany({
      where: { isSuspensionInquiry: false },
      include: { replies: { orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" }
    });

    await setCache(cacheKey, submissions, 3600);

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Retrieves contact submissions that are marked as suspension inquiries.
 * Restricted to ADMIN role. Utilizes Redis caching ('contacts:suspension').
 *
 * @route GET /api/contacts/suspensions
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const getSuspensionInquiries = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const cacheKey = "contacts:suspension";
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({ success: true, data: cachedData });
    }

    const submissions = await prisma.contactSubmission.findMany({
      where: { isSuspensionInquiry: true },
      orderBy: { createdAt: "desc" }
    });

    await setCache(cacheKey, submissions, 3600);

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reactivates a suspended user based on their contact submission ID.
 * Updates the user's status to "Active", triggers an email notification,
 * and sets all associated suspension inquiries to "Active".
 * Restricted to ADMIN role. Invalidates user, client, contact, and suspension caches.
 *
 * @route PUT /api/contacts/reactivate/:id
 * @param {import('express').Request} req - Express request object.
 * @param {string} req.params.id - The unique ID of the contact submission.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const reactivateSuspendedUser = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { id } = req.params;

    const submission = await prisma.contactSubmission.findUnique({
      where: { id: parseInt(id) }
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: submission.email }
    });

    if (user) {
      // Update user to active
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: "Active",
          suspendedAt: null,
          suspensionReason: null,
          unsuspendedAt: new Date()
        }
      });

      // Dispatch activation email
      try {
        await dispatch("account-reactivated", user.email, {
          userName: user.fullName,
          companyName: "Sai IT Services",
        });
      } catch (err) {
        console.error("[ReactivateSuspendedUser] Failed to dispatch account reactivated email:", err.message);
      }
    }

    // Update the reactivated submission AND all other suspension inquiries for this user's email to "Active"
    await prisma.contactSubmission.updateMany({
      where: {
        email: submission.email,
        isSuspensionInquiry: true
      },
      data: { status: "Active" }
    });

    const updatedSubmission = await prisma.contactSubmission.findUnique({
      where: { id: submission.id }
    });

    // Invalidate caches
    await invalidateUsers();
    await invalidateClients();
    await invalidateContacts();
    await deleteCache("contacts:suspension");

    res.status(200).json({
      success: true,
      message: "User reactivated successfully and inquiry resolved.",
      data: updatedSubmission
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Updates the status of a specific contact submission.
 * Restricted to ADMIN role. Invalidates contact and suspension caches.
 *
 * @route PATCH /api/contacts/:id/status
 * @param {import('express').Request} req - Express request object.
 * @param {string} req.params.id - Submission ID.
 * @param {Object} req.body - Request body.
 * @param {string} req.body.status - The new status (e.g., Pending, Resolved).
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const updateContactStatus = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }
    const updated = await prisma.contactSubmission.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    await invalidateContacts();
    await deleteCache("contacts:suspension");
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Deletes a contact submission.
 * Restricted to ADMIN role. Invalidates contact and suspension caches.
 *
 * @route DELETE /api/contacts/:id
 * @param {import('express').Request} req - Express request object.
 * @param {string} req.params.id - Submission ID to delete.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const deleteContact = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { id } = req.params;
    await prisma.contactSubmission.delete({
      where: { id: parseInt(id) }
    });
    await invalidateContacts();
    await deleteCache("contacts:suspension");
    res.status(200).json({ success: true, message: "Submission deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Function to handle replyToContactSubmission operations
export const replyToContactSubmission = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { id } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: "Subject and message are required" });
    }

    const submission = await prisma.contactSubmission.findUnique({
      where: { id: parseInt(id) }
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: "Contact submission not found" });
    }

    const formattedMessage = message.replace(/\n/g, "<br/>");

    // Fetch site settings to get dynamic company name
    let companyName = "Sai IT Services";
    try {
      const siteSettings = await prisma.siteSettings.findUnique({
        where: { singletonId: 1 }
      });
      if (siteSettings && siteSettings.siteTitle) {
        companyName = siteSettings.siteTitle.replace(/\s+(CRP|Portal|CRM|System|Solutions)\b/gi, "").trim();
      }
    } catch (e) {
      console.warn("Failed to load company name from SiteSettings:", e.message);
    }

    // Try dispatching email via template engine so admin can customize template under Email Templates
    let emailSent = await dispatch("contact-inquiry-reply", submission.email, {
      firstName: submission.firstName,
      lastName: submission.lastName,
      replyMessage: message,
      originalSubject: submission.subject,
      originalMessage: submission.message,
      companyName,
    });

    // Fallback to direct HTML email send if auto emails is disabled or template dispatch returned null
    if (!emailSent) {
      const formattedMessage = message.replace(/\n/g, "<br/>");
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 14px; margin-bottom: 20px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 20px; font-weight: bold;">${companyName} Support Reply</h2>
          </div>
          <p style="color: #334155; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">Dear <strong>${submission.firstName} ${submission.lastName}</strong>,</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; color: #1e293b; font-size: 14px; line-height: 1.6; border-radius: 0 8px 8px 0;">
            ${formattedMessage}
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0 15px 0;" />
          <div style="background-color: #f1f5f9; padding: 14px; border-radius: 8px; font-size: 12px; color: #64748b; line-height: 1.5;">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #475569;">Your Original Inquiry:</p>
            <p style="margin: 0 0 4px 0;"><strong>Subject:</strong> ${submission.subject}</p>
            <p style="margin: 0;"><strong>Message:</strong> ${submission.message}</p>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; text-align: center;">Sent via ${companyName} Support Management System.</p>
        </div>
      `;
      emailSent = await sendDirectEmail(submission.email, subject, html);
    }

    // Save reply record to ContactReply table
    await prisma.contactReply.create({
      data: {
        contactSubmissionId: submission.id,
        senderId: req.user.id,
        senderName: req.user.fullName || "Admin",
        subject,
        message,
        status: emailSent ? "sent" : "failed"
      }
    });

    // Update submission status to "Replied"
    const updated = await prisma.contactSubmission.update({
      where: { id: parseInt(id) },
      data: { status: "Replied" },
      include: { replies: { orderBy: { createdAt: "desc" } } }
    });

    await invalidateContacts();
    await deleteCache("contacts:suspension");

    res.status(200).json({
      success: true,
      message: emailSent ? "Reply sent successfully!" : "Status updated to Replied, but email delivery failed. Please check SMTP / Resend settings.",
      data: updated
    });
  } catch (error) {
    console.error("[ReplyToContactSubmission] Error:", error.message || error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Function to handle getContactReplies operations
export const getContactReplies = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { id } = req.params;

    const replies = await prisma.contactReply.findMany({
      where: { contactSubmissionId: parseInt(id) },
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json({ success: true, data: replies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


