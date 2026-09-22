import prisma from "../../config/prisma.js";
import * as smtpService from "./smtpService.js";
import * as resendService from "./resendService.js";
import * as brevoService from "./brevoService.js";
import { parseTemplate, getDefaultTemplates } from "./templateParser.js";
import { deleteCache } from "../../utils/cache.js";

// template slug to toggle mapping
const SLUG_TO_TOGGLE = {
  "invoice-created": "invoiceEmails",
  "invoice-paid": "invoiceEmails",
  "client-welcome": "clientWelcomeEmails",
  "staff-welcome": "staffWelcomeEmails",
  "subadmin-welcome": "staffWelcomeEmails",
  "subadmin-permissions-updated": "staffWelcomeEmails",
  "project-assigned": "projectAssignEmails",
  "task-assigned": "projectAssignEmails",
  "password-reset": "passwordResetEmails",
  "support-ticket-update": "supportTicketEmails",
  "contact-inquiry-reply": "supportTicketEmails",
  "contact-acknowledgment": "supportTicketEmails",
  "manual-payment-received": "invoiceEmails",
};

// load template, parse, and send mail
export async function dispatch(templateSlug, recipientEmail, variables = {}) {
  try {
    // get email settings
    const settings = await prisma.emailSettings.findUnique({
      where: { singletonId: 1 },
    });

    if (!settings || !settings.emailEnabled) return null;
    if (!settings.autoEmailsEnabled) return null;

    // check if this template is disabled in settings
    const toggleField = SLUG_TO_TOGGLE[templateSlug];
    if (toggleField && !settings[toggleField]) return null;

    // fetch template from db
    let template = await prisma.emailTemplate.findUnique({
      where: { slug: templateSlug },
    });

    if (!template) {
      const defaults = getDefaultTemplates();
      const defaultTpl = defaults.find(t => t.slug === templateSlug);
      if (defaultTpl) {
        template = await prisma.emailTemplate.create({
          data: {
            ...defaultTpl,
            isActive: true
          }
        });
      }
    }

    if (!template || !template.isActive) return null;

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

    const mergedVariables = {
      companyName,
      ...variables
    };

    // replace variables and format as html
    const { subject, html } = parseTemplate(
      template.htmlContent,
      template.subject,
      mergedVariables,
      templateSlug,
      settings
    );

    // send via resend or smtp
    let result = null;
    let status = "sent";
    let errorMsg = null;

    let maxRetries = 2;
    try {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (settings.activeProvider === "resend") {
            result = await resendService.sendMail(settings, recipientEmail, subject, html);
          } else if (settings.activeProvider === "brevo") {
            result = await brevoService.sendMail(settings, recipientEmail, subject, html);
          } else {
            result = await smtpService.sendMail(settings, recipientEmail, subject, html);
          }
          status = "sent";
          errorMsg = null;
          break;
        } catch (err) {
          status = "failed";
          errorMsg = err.message;
          if (attempt < maxRetries && (err.message.includes("fetch failed") || err.message.includes("ECONNRESET") || err.message.includes("ETIMEDOUT"))) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            console.error(`[EmailDispatcher] Failed to send "${templateSlug}" to ${recipientEmail} (Attempt ${attempt}):`, err.message);
          }
        }
      }
    } finally {
      await prisma.emailLog.create({
        data: {
          recipient: recipientEmail,
          template: templateSlug,
          subject,
          status,
          error: errorMsg,
        },
      }).catch(logErr => console.error("[EmailDispatcher] Failed to write log:", logErr.message));
      await deleteCache("email:logs").catch(() => {});
    }
    return result;
  } catch (err) {
    console.error(`[EmailDispatcher] Unexpected error:`, err.message);
    return null;
  }
}

// send email directly (for OTP, 2FA, password reset)
export async function sendDirectEmail(recipientEmail, subject, html) {
  try {
    const settings = await prisma.emailSettings.findUnique({
      where: { singletonId: 1 },
    });
    if (!settings || !settings.emailEnabled) return null;
    let result = null;
    if (settings.activeProvider === "resend") {
      result = await resendService.sendMail(settings, recipientEmail, subject, html);
    } else if (settings.activeProvider === "brevo") {
      result = await brevoService.sendMail(settings, recipientEmail, subject, html);
    } else {
      result = await smtpService.sendMail(settings, recipientEmail, subject, html);
    }
    return result;
  } catch (err) {
    console.error(`[EmailDispatcher] Direct email send failed:`, err.message);
    return null;
  }
}
