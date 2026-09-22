// Service class or helper functions for templateParser business logic.
// Contains operations for database queries, transformations, and system actions.

// swap placeholders and wrap in HTML layout
export function parseTemplate(bodyText, subject, variables = {}, slug = "", settings = null) {
  let parsedText = bodyText || "";
  let parsedSubject = subject || "";

  // replace placeholders
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    parsedText = parsedText.replace(regex, value ?? "");
    parsedSubject = parsedSubject.replace(regex, value ?? "");
  }

  // convert newlines to paragraphs
  let formattedBody = parsedText.split("\n").map(p => p.trim() ? `<p>${p}</p>` : "").join("");

  const brand = settings?.emailPrimaryColor || "#4F46E5";
  const headerBg = settings?.emailHeaderBg || "#1E1B4B";
  const bodyBg = settings?.emailBodyBg || "#FFFFFF";
  const bgColor = settings?.emailBgColor || "#F8FAFC";
  const fontColor = settings?.emailFontColor || "#334155";
  const fontFamily = settings?.emailFontFamily || "'Segoe UI',Arial,sans-serif";

  // append dynamic tables based on template type
  let dynamicHtml = "";

  if (slug === "invoice-created") {
    dynamicHtml = `
      <table class="invoice">
        <tr><th>Invoice #</th><td>${variables.invoiceNumber || ""}</td></tr>
        <tr><th>Amount</th><td><strong>₹${variables.invoiceAmount || ""}</strong></td></tr>
        <tr><th>Due Date</th><td>${variables.dueDate || ""}</td></tr>
        <tr><th>Description</th><td>${variables.description || ""}</td></tr>
      </table>
      <div style="text-align:center">
        <a href="${variables.paymentLink || "#"}" class="btn">Pay Now</a>
      </div>
    `;
  } else if (slug === "invoice-paid") {
    dynamicHtml = `
      <table class="invoice">
        <tr><th>Invoice #</th><td>${variables.invoiceNumber || ""}</td></tr>
        <tr><th>Amount Paid</th><td><strong>₹${variables.invoiceAmount || ""}</strong></td></tr>
        <tr><th>Date Paid</th><td>${variables.paidAt || ""}</td></tr>
      </table>
    `;
  } else if (slug === "client-welcome" || slug === "staff-welcome" || slug === "subadmin-welcome") {
    let permissionsPart = "";
    if (slug === "subadmin-welcome" && variables.permissionsList) {
      permissionsPart = `<p style="margin:8px 0 0"><strong>Initial Access:</strong> ${variables.permissionsList}</p>`;
    }
    dynamicHtml = `
      <div class="highlight">
        <p style="margin:0"><strong>Email:</strong> ${variables.email || ""}</p>
        <p style="margin:8px 0 0"><strong>Temporary Password:</strong> ${variables.temporaryPassword || ""}</p>
        ${permissionsPart}
      </div>
      <div style="text-align:center">
        <a href="${variables.loginUrl || "#"}" class="btn">Login Now</a>
      </div>
    `;
  } else if (slug === "subadmin-permissions-updated") {
    dynamicHtml = `
      <div class="highlight">
        <p style="margin:0"><strong>Title / Role:</strong> ${variables.roleName || "N/A"}</p>
        <p style="margin:8px 0 0"><strong>Current Modules Access:</strong></p>
        <p style="margin:4px 0 0; font-size: 13px; line-height: 1.5; color: #475569;">${variables.permissionsList || "None"}</p>
      </div>
      <div style="text-align:center">
        <a href="${variables.loginUrl || "#"}" class="btn">Go to Dashboard</a>
      </div>
    `;
  } else if (slug === "project-assigned") {
    dynamicHtml = `
      <table class="invoice">
        <tr><th>Project Name</th><td>${variables.projectName || ""}</td></tr>
        <tr><th>Client</th><td>${variables.clientName || "N/A"}</td></tr>
        <tr><th>Status</th><td><span style="background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600">${variables.projectStatus || "Planning"}</span></td></tr>
        <tr><th>Start Date</th><td>${variables.startDate || "TBD"}</td></tr>
        <tr><th>Due Date</th><td>${variables.dueDate || "TBD"}</td></tr>
        <tr><th>Description</th><td>${variables.projectDescription || "No description"}</td></tr>
      </table>
      <div style="text-align:center">
        <a href="${variables.loginUrl || "#"}" class="btn">View Project</a>
      </div>
    `;
  } else if (slug === "task-assigned") {
    const priorityColor = variables.priority === "High" ? "#ef4444" : variables.priority === "Medium" ? "#f59e0b" : "#10b981";
    dynamicHtml = `
      <table class="invoice">
        <tr><th>Task ID</th><td><strong>${variables.taskKey || ""}</strong></td></tr>
        <tr><th>Task Title</th><td>${variables.taskTitle || ""}</td></tr>
        <tr><th>Project</th><td>${variables.projectName || ""}</td></tr>
        <tr><th>Priority</th><td><span style="color:${priorityColor};font-weight:600">${variables.priority || "Medium"}</span></td></tr>
        <tr><th>Status</th><td><span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600">${variables.status || "To Do"}</span></td></tr>
        <tr><th>Due Date</th><td>${variables.dueDate || "TBD"}</td></tr>
        <tr><th>Description</th><td>${variables.taskDescription || "No description"}</td></tr>
      </table>
      <div style="text-align:center">
        <a href="${variables.loginUrl || "#"}" class="btn">View Task</a>
      </div>
    `;
  } else if (slug === "password-reset") {
    dynamicHtml = `
      <div style="text-align:center">
        <a href="${variables.resetLink || "#"}" class="btn">Reset Password</a>
      </div>
    `;
  } else if (slug === "support-ticket-update") {
    dynamicHtml = `
      <div class="highlight">
        <p style="margin:0"><strong>Ticket #${variables.ticketId || ""}:</strong> ${variables.ticketSubject || ""}</p>
      </div>
      <p><strong>Reply:</strong></p>
      <p style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0">${variables.replyMessage || ""}</p>
      <div style="text-align:center">
        <a href="${variables.loginUrl || "#"}" class="btn">View Ticket</a>
      </div>
    `;
  } else if (slug === "contact-inquiry-reply") {
    dynamicHtml = `
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px 0;" />
      <div style="background:#f1f5f9;padding:14px;border-radius:8px;font-size:12px;color:#64748b;line-height:1.5;">
        <p style="margin:0 0 6px 0;font-weight:bold;color:#475569;">Your Original Inquiry:</p>
        <p style="margin:0 0 4px 0;"><strong>Subject:</strong> ${variables.originalSubject || ""}</p>
        <p style="margin:0;"><strong>Message:</strong> ${variables.originalMessage || ""}</p>
      </div>
    `;
  } else if (slug === "contact-acknowledgment") {
    dynamicHtml = `
      <div style="background:#f8fafc;border-left:4px solid ${brand};padding:16px;border-radius:0 8px 8px 0;margin:16px 0;color:#1e293b;font-size:14px;line-height:1.6;">
        <p style="margin:0 0 6px 0;font-weight:bold;color:#475569;">Your Submitted Message:</p>
        <p style="margin:0 0 4px 0;"><strong>Subject:</strong> ${variables.subject || ""}</p>
        <p style="margin:0;"><strong>Message:</strong> ${variables.message || ""}</p>
      </div>
    `;
  }

  // wrap in basic HTML email shell
  const titleText = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  
  let footerHtml = "";
  if (settings?.emailFooterText) {
    let footerText = settings.emailFooterText;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      footerText = footerText.replace(regex, value ?? "");
    }
    footerHtml = `<p>${footerText}</p>`;
  } else {
    const companyName = variables.companyName || "Sai IT Services";
    footerHtml = `<p>© 2026 ${companyName}. All rights reserved.</p>`;
  }

  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin:0; padding:0; font-family:${fontFamily}; background:${bgColor}; }
    .container { max-width:600px; margin:0 auto; background:${bodyBg}; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
    .header { background:${headerBg}; padding:32px 40px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:22px; font-weight:700; }
    .body { padding:32px 40px; color:${fontColor}; font-size:15px; line-height:1.7; }
    .footer { background:#f1f5f9; padding:24px 40px; text-align:center; color:#94a3b8; font-size:12px; }
    .btn { display:inline-block; background:${brand}; color:#fff!important; text-decoration:none; padding:12px 32px; border-radius:8px; font-weight:600; font-size:15px; margin:16px 0; }
    table.invoice { width:100%; border-collapse:collapse; margin:16px 0; }
    table.invoice th { background:#f1f5f9; text-align:left; padding:10px 12px; font-size:13px; color:#64748b; border-bottom:1px solid #e2e8f0; }
    table.invoice td { padding:10px 12px; font-size:14px; border-bottom:1px solid #e2e8f0; }
    .highlight { background:#eef2ff; border-left:4px solid ${brand}; padding:16px; border-radius:0 8px 8px 0; margin:16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${titleText}</h1>
    </div>
    <div class="body">
      ${formattedBody}
      ${dynamicHtml}
    </div>
    <div class="footer">
      ${footerHtml}
    </div>
  </div>
</body>
</html>
  `;

  return { subject: parsedSubject, html: fullHtml };
}

// default templates used to seed DB
export function getDefaultTemplates() {
  return [
    {
      name: "Invoice Created",
      slug: "invoice-created",
      subject: "Invoice #{{invoiceNumber}} from Sai IT Services",
      type: "invoice",
      variables: ["clientName", "invoiceNumber", "invoiceAmount", "dueDate", "description", "paymentLink", "companyName"],
      htmlContent: `Hi {{clientName}},\n\nA new invoice has been generated for your account.\n\nIf you have any questions, please contact our support team.`,
    },
    {
      name: "Invoice Paid",
      slug: "invoice-paid",
      subject: "Payment Received – Invoice #{{invoiceNumber}}",
      type: "invoice",
      variables: ["clientName", "invoiceNumber", "invoiceAmount", "paidAt", "companyName"],
      htmlContent: `Hi {{clientName}},\n\nThank you for your payment. We have successfully processed the payment for your invoice.\n\nYou can view and download the invoice details from your portal dashboard.`,
    },
    {
      name: "Client Welcome",
      slug: "client-welcome",
      subject: "Welcome to {{companyName}} – Your Account is Ready",
      type: "welcome",
      variables: ["clientName", "email", "temporaryPassword", "loginUrl", "companyName"],
      htmlContent: `Welcome, {{clientName}}!\n\nYour account on {{companyName}} has been created successfully.\n\nPlease change your password after your first login.`,
    },
    {
      name: "Staff Welcome",
      slug: "staff-welcome",
      subject: "Welcome to the Team – {{companyName}}",
      type: "welcome",
      variables: ["staffName", "email", "temporaryPassword", "loginUrl", "companyName"],
      htmlContent: `Welcome to the Team!\n\nHi {{staffName}},\n\nYou have been added as a team member at {{companyName}}.\n\nPlease login and update your password immediately.`,
    },
    {
      name: "Project Assigned",
      slug: "project-assigned",
      subject: "You've Been Assigned to Project: {{projectName}}",
      type: "project",
      variables: ["recipientName", "projectName", "projectDescription", "startDate", "dueDate", "projectStatus", "clientName", "loginUrl", "companyName"],
      htmlContent: `Hi {{recipientName}},\n\nYou have been assigned to a new project.`,
    },
    {
      name: "Task Assigned",
      slug: "task-assigned",
      subject: "New Task Assigned: {{taskTitle}} ({{taskKey}})",
      type: "task",
      variables: ["recipientName", "taskTitle", "taskKey", "taskDescription", "priority", "status", "dueDate", "projectName", "loginUrl", "companyName"],
      htmlContent: `Hi {{recipientName}},\n\nYou have been assigned to a new task.`,
    },
    {
      name: "Password Reset",
      slug: "password-reset",
      subject: "Password Reset Request – {{companyName}}",
      type: "password",
      variables: ["userName", "resetLink", "companyName"],
      htmlContent: `Hi {{userName}},\n\nWe received a request to reset your password. Click the button below to set a new password.\n\nIf you didn't request this, you can safely ignore this email. This link will expire in 1 hour.`,
    },
    {
      name: "Support Ticket Update",
      slug: "support-ticket-update",
      subject: "Ticket #{{ticketId}} Updated – {{ticketSubject}}",
      type: "support",
      variables: ["clientName", "ticketId", "ticketSubject", "replyMessage", "loginUrl", "companyName"],
      htmlContent: `Hi {{clientName}},\n\nThere's an update on your support ticket.`,
    },
    {
      name: "Sub-Admin Welcome",
      slug: "subadmin-welcome",
      subject: "Welcome to the Admin Team – {{companyName}}",
      type: "welcome",
      variables: ["adminName", "email", "temporaryPassword", "loginUrl", "permissionsList", "companyName"],
      htmlContent: `Welcome to the Admin Team!\n\nHi {{adminName}},\n\nYou have been added as a sub-admin at {{companyName}}.\n\nPlease login and update your password immediately.`,
    },
    {
      name: "Sub-Admin Permissions Updated",
      slug: "subadmin-permissions-updated",
      subject: "Your Admin Permissions Have Been Updated – {{companyName}}",
      type: "welcome",
      variables: ["adminName", "roleName", "permissionsList", "loginUrl", "companyName"],
      htmlContent: `Hi {{adminName}},\n\nYour roles and permissions have been updated by the main administrator.`,
    },
    {
      name: "Manual Payment Received",
      slug: "manual-payment-received",
      subject: "Manual Payment Submitted – Invoice #{{invoiceNumber}}",
      type: "invoice",
      variables: ["clientName", "invoiceNumber", "invoiceAmount", "transactionId", "notes", "companyName"],
      htmlContent: `Hi Admin,\n\nClient {{clientName}} has submitted manual payment proof for Invoice #{{invoiceNumber}} (amount: {{invoiceAmount}}).\n\nTransaction ID: {{transactionId}}\nNotes: {{notes}}\n\nPlease verify and approve/reject it in the admin panel.`,
    },
    {
      name: "Account Suspended",
      slug: "account-suspended",
      subject: "Your account has been suspended – {{companyName}}",
      type: "system",
      variables: ["userName", "suspensionReason", "companyName"],
      htmlContent: `Hi {{userName}},\n\nYour account has been suspended.\n\nReason: {{suspensionReason}}\n\nIf you believe this was an error, please contact your administrator.`,
    },
    {
      name: "Account Reactivated",
      slug: "account-reactivated",
      subject: "Your account access has been restored – {{companyName}}",
      type: "system",
      variables: ["userName", "companyName"],
      htmlContent: `Hi {{userName}},\n\nYour account access has been restored. You can now log into the portal.`,
    },
    {
      name: "Account Deleted",
      slug: "account-deleted",
      subject: "Your account has been deleted – {{companyName}}",
      type: "system",
      variables: ["userName", "companyName"],
      htmlContent: `Hi {{userName}},\n\nYour account has been permanently deleted.\n\nWe appreciate the time you spent with us. If you have any further questions or need help, please contact us.`,
    },
    {
      name: "Suspicious Login Alert",
      slug: "suspicious-login",
      subject: "Suspicious login attempt detected for your {{companyName}} account",
      type: "system",
      variables: ["userName", "ipAddress", "companyName"],
      htmlContent: `Hi {{userName}},\n\nWe detected multiple failed login attempts on your {{companyName}} account from IP address {{ipAddress}}.\n\nAs a security precaution, login attempts for your email have been temporarily blocked for 30 minutes.\n\nIf this was you, you can try again after the block expires. If you did not request this, we recommend changing your password immediately or contacting support.`,
    },
    {
      name: "Contact Inquiry Reply",
      slug: "contact-inquiry-reply",
      subject: "Reply to your inquiry – {{companyName}}",
      type: "support",
      variables: ["firstName", "lastName", "replyMessage", "originalSubject", "originalMessage", "companyName"],
      htmlContent: `Dear {{firstName}} {{lastName}},\n\n{{replyMessage}}`,
    },
    {
      name: "Contact Request Acknowledgment",
      slug: "contact-acknowledgment",
      subject: "Thank you for contacting {{companyName}}",
      type: "support",
      variables: ["firstName", "lastName", "subject", "message", "companyName"],
      htmlContent: `Hi {{firstName}} {{lastName}},\n\nThank you for reaching out to us. We have received your message and our team will get back to you within 24 hours.\n\nThank you for choosing us.`,
    },
  ];
}
