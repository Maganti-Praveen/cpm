// Service class or helper functions for Brevo business logic.
// Contains operations for sending transactional emails via Brevo.

export async function sendMail(settings, to, subject, html) {
  if (!settings.brevoApiKey) {
    throw new Error("Brevo API key is not configured");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": settings.brevoApiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: settings.brevoFromName || "Sai CRM",
        email: settings.brevoFromEmail
      },
      to: [
        {
          email: to
        }
      ],
      subject: subject,
      htmlContent: html
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Brevo API error: ${response.statusText}`);
  }

  return await response.json();
}
