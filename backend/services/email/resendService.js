// Service class or helper functions for resend business logic.
// Contains operations for database queries, transformations, and system actions.

import { Resend } from "resend";

// send mail using resend api
export async function sendMail(settings, to, subject, html) {
  const resend = new Resend(settings.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: `${settings.resendFromName} <${settings.resendFromEmail}>`,
    to: [to],
    subject,
    html,
  });
  if (error) throw new Error(error.message);
  return data;
}
