// Service class or helper functions for smtp business logic.
// Contains operations for database queries, transformations, and system actions.

import nodemailer from "nodemailer";

// setup nodemailer transporter
export function createTransporter(settings) {
  const port = Number(settings.smtpPort);
  // secure connection only on port 465
  const secure = port === 465;
  // force STARTTLS if secure is ticked but port isn't 465
  const requireTLS = !secure && settings.smtpSecure;

  return nodemailer.createTransport({
    host: settings.smtpHost,
    port,
    secure,
    requireTLS,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
    tls: {
      rejectUnauthorized: false, // bypass cert check errors
    },
  });
}

// send mail via smtp
export async function sendMail(settings, to, subject, html) {
  const transporter = createTransporter(settings);
  const info = await transporter.sendMail({
    from: `"${settings.smtpFromName}" <${settings.smtpFromEmail}>`,
    to,
    subject,
    html,
  });
  return info;
}

// check if smtp settings are valid
export async function verifyConnection(settings) {
  const transporter = createTransporter(settings);
  await transporter.verify();
  return true;
}
