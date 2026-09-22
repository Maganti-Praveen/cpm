// Controller logic for managing emailSettings operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import * as smtpService from "../services/email/smtpService.js";
import { getCache, setCache, deleteCache, invalidateEmailSettings } from "../utils/cache.js";

// mask keys showing only the last 4 characters
function mask(str) {
  if (!str || str.length <= 4) return str ? "****" : "";
  return "•".repeat(str.length - 4) + str.slice(-4);
}

// map db structure to frontend API model
function mapDbToApi(settings) {
  if (!settings) return null;
  return {
    id:                      settings.id,
    singletonId:             settings.singletonId,
    emailEnabled:            settings.emailEnabled,
    provider:                settings.activeProvider,
    smtpHost:                settings.smtpHost,
    smtpPort:                settings.smtpPort,
    smtpUsername:            settings.smtpUser,
    smtpPassword:            settings.smtpPass,
    smtpFromEmail:           settings.smtpFromEmail,
    smtpFromName:            settings.smtpFromName,
    smtpSecure:              settings.smtpSecure,
    resendApiKey:            settings.resendApiKey,
    resendFromEmail:         settings.resendFromEmail,
    resendFromName:          settings.resendFromName,
    brevoApiKey:             settings.brevoApiKey,
    brevoFromEmail:          settings.brevoFromEmail,
    brevoFromName:           settings.brevoFromName,
    autoEmails:              settings.autoEmailsEnabled,
    invoiceEmails:           settings.invoiceEmails,
    clientWelcomeEmails:     settings.clientWelcomeEmails,
    staffWelcomeEmails:      settings.staffWelcomeEmails,
    projectAssignmentEmails: settings.projectAssignEmails,
    passwordResetEmails:     settings.passwordResetEmails,
    supportTicketEmails:     settings.supportTicketEmails,
    emailPrimaryColor:       settings.emailPrimaryColor,
    emailHeaderBg:           settings.emailHeaderBg,
    emailBodyBg:             settings.emailBodyBg,
    emailBgColor:            settings.emailBgColor,
    emailFontColor:          settings.emailFontColor,
    emailFontFamily:         settings.emailFontFamily,
    emailFooterText:         settings.emailFooterText,
    updatedAt:               settings.updatedAt,
  };
}

// map incoming request data to db schema properties
function mapApiToDb(body) {
  const dbData = {};
  
  if (body.emailEnabled !== undefined)            dbData.emailEnabled = body.emailEnabled;
  if (body.provider !== undefined)                dbData.activeProvider = body.provider;
  if (body.smtpHost !== undefined)                dbData.smtpHost = body.smtpHost;
  if (body.smtpPort !== undefined)                dbData.smtpPort = Number(body.smtpPort);
  if (body.smtpUsername !== undefined)            dbData.smtpUser = body.smtpUsername;
  if (body.smtpPassword !== undefined)            dbData.smtpPass = body.smtpPassword;
  if (body.smtpFromEmail !== undefined)           dbData.smtpFromEmail = body.smtpFromEmail;
  if (body.smtpFromName !== undefined)            dbData.smtpFromName = body.smtpFromName;
  if (body.smtpSecure !== undefined)              dbData.smtpSecure = body.smtpSecure;
  if (body.resendApiKey !== undefined)            dbData.resendApiKey = body.resendApiKey;
  if (body.resendFromEmail !== undefined)         dbData.resendFromEmail = body.resendFromEmail;
  if (body.resendFromName !== undefined)          dbData.resendFromName = body.resendFromName;
  if (body.brevoApiKey !== undefined)             dbData.brevoApiKey = body.brevoApiKey;
  if (body.brevoFromEmail !== undefined)          dbData.brevoFromEmail = body.brevoFromEmail;
  if (body.brevoFromName !== undefined)           dbData.brevoFromName = body.brevoFromName;
  if (body.autoEmails !== undefined)              dbData.autoEmailsEnabled = body.autoEmails;
  if (body.invoiceEmails !== undefined)           dbData.invoiceEmails = body.invoiceEmails;
  if (body.clientWelcomeEmails !== undefined)     dbData.clientWelcomeEmails = body.clientWelcomeEmails;
  if (body.staffWelcomeEmails !== undefined)      dbData.staffWelcomeEmails = body.staffWelcomeEmails;
  if (body.projectAssignmentEmails !== undefined) dbData.projectAssignEmails = body.projectAssignmentEmails;
  if (body.passwordResetEmails !== undefined)     dbData.passwordResetEmails = body.passwordResetEmails;
  if (body.supportTicketEmails !== undefined)     dbData.supportTicketEmails = body.supportTicketEmails;
  if (body.emailPrimaryColor !== undefined)       dbData.emailPrimaryColor = body.emailPrimaryColor;
  if (body.emailHeaderBg !== undefined)           dbData.emailHeaderBg = body.emailHeaderBg;
  if (body.emailBodyBg !== undefined)             dbData.emailBodyBg = body.emailBodyBg;
  if (body.emailBgColor !== undefined)            dbData.emailBgColor = body.emailBgColor;
  if (body.emailFontColor !== undefined)          dbData.emailFontColor = body.emailFontColor;
  if (body.emailFontFamily !== undefined)         dbData.emailFontFamily = body.emailFontFamily;
  if (body.emailFooterText !== undefined)         dbData.emailFooterText = body.emailFooterText;

  return dbData;
}

// fetch current email settings
export const getEmailSettings = async (req, res) => {
  try {
    const cacheKey = "email:settings";
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    let settings = await prisma.emailSettings.findUnique({
      where: { singletonId: 1 },
    });

    if (!settings) {
      settings = await prisma.emailSettings.create({ data: { singletonId: 1 } });
    }

    const data = mapDbToApi(settings);
    data.smtpPassword = mask(data.smtpPassword);
    data.resendApiKey = mask(data.resendApiKey);
    data.brevoApiKey = mask(data.brevoApiKey);

    await setCache(cacheKey, data, 3600);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// update/save email settings
export const updateEmailSettings = async (req, res) => {
  try {
    const body = { ...req.body };

    // Don't overwrite passwords with masked values
    if (body.smtpPassword && body.smtpPassword.includes("•")) delete body.smtpPassword;
    if (body.resendApiKey && body.resendApiKey.includes("•")) delete body.resendApiKey;
    if (body.brevoApiKey && body.brevoApiKey.includes("•")) delete body.brevoApiKey;

    const dbData = mapApiToDb(body);

    const settings = await prisma.emailSettings.upsert({
      where: { singletonId: 1 },
      update: dbData,
      create: { singletonId: 1, ...dbData },
    });

    const data = mapDbToApi(settings);
    data.smtpPassword = mask(data.smtpPassword);
    data.resendApiKey = mask(data.resendApiKey);
    data.brevoApiKey = mask(data.brevoApiKey);

    await invalidateEmailSettings();

    res.json({ success: true, message: "Email settings saved", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// send a test email to check configuration
export const testEmail = async (req, res) => {
  let status = "sent";
  let errorMsg = null;
  const { email } = req.body;
  const subject = "Sai CRM — Test Email";

  try {
    if (!email) return res.status(400).json({ success: false, message: "Email address required" });

    const settings = await prisma.emailSettings.findUnique({
      where: { singletonId: 1 },
    });

    if (!settings) return res.status(400).json({ success: false, message: "Email settings not configured" });

    const testHtml = `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#4F46E5;margin:0 0 16px">Test Email Successful</h2>
        <p style="color:#334155">Your email configuration is working correctly.</p>
        <p style="color:#94a3b8;font-size:13px">Provider: ${settings.activeProvider.toUpperCase()}</p>
      </div>`;

    try {
      if (settings.activeProvider === "resend") {
        const { sendMail } = await import("../services/email/resendService.js");
        await sendMail(settings, email, subject, testHtml);
      } else if (settings.activeProvider === "brevo") {
        const { sendMail } = await import("../services/email/brevoService.js");
        await sendMail(settings, email, subject, testHtml);
      } else {
        await smtpService.sendMail(settings, email, subject, testHtml);
      }
    } catch (err) {
      status = "failed";
      errorMsg = err.message;
      throw err;
    } finally {
      await prisma.emailLog.create({
        data: {
          recipient: email,
          template: "test-email",
          subject,
          status,
          error: errorMsg
        }
      }).catch(logErr => console.error("[TestEmail] Failed to write log:", logErr.message));
      await deleteCache("email:logs").catch(() => {});
    }

    res.json({ success: true, message: "Test email sent successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: `Test failed: ${error.message}` });
  }
};

// verify email service connection status
export const getEmailStatus = async (req, res) => {
  try {
    const settings = await prisma.emailSettings.findUnique({
      where: { singletonId: 1 },
    });

    if (!settings || !settings.emailEnabled) {
      return res.json({ success: true, data: { connected: false, status: "disabled", message: "Email system is disabled" } });
    }

    if (settings.activeProvider === "smtp") {
      try {
        await smtpService.verifyConnection(settings);
        return res.json({ success: true, data: { connected: true, status: "connected", message: "SMTP connection verified" } });
      } catch {
        return res.json({ success: true, data: { connected: false, status: "error", message: "SMTP connection failed" } });
      }
    }

    if (settings.activeProvider === "resend") {
      if (settings.resendApiKey) {
        return res.json({ success: true, data: { connected: true, status: "connected", message: "Resend API key configured" } });
      }
      return res.json({ success: true, data: { connected: false, status: "error", message: "Resend API key not configured" } });
    }

    if (settings.activeProvider === "brevo") {
      if (settings.brevoApiKey) {
        return res.json({ success: true, data: { connected: true, status: "connected", message: "Brevo API key configured" } });
      }
      return res.json({ success: true, data: { connected: false, status: "error", message: "Brevo API key not configured" } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// fetch recent email delivery logs
export const getEmailLogs = async (req, res) => {
  try {
    const cacheKey = "email:logs";
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const logs = await prisma.emailLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 200,
    });

    await setCache(cacheKey, logs, 3600);

    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
