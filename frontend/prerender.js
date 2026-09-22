import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic meta mappings
const staticMetaMap = {
  "/": {
    title: "Welcome",
    desc: "Welcome to Sai Portal. Access your dashboard, projects, and invoices."
  },
  "/welcome": {
    title: "Welcome",
    desc: "Welcome to Sai Portal. Access your dashboard, projects, and invoices."
  },
  "/contact": {
    title: "Contact Us",
    desc: "Get in touch with our customer support and administration team."
  },
  "/privacy-policy": {
    title: "Privacy Policy",
    desc: "Read our privacy policy to understand how we protect and manage your personal data."
  },
  "/terms-of-service": {
    title: "Terms of Service",
    desc: "Read the terms of service governing the use of the Sai Portal."
  },
  "/cookie-policy": {
    title: "Cookie Policy",
    desc: "Understand how we use cookies to improve your user experience on our portal."
  },
  "/help-center": {
    title: "Help Center",
    desc: "Browse help topics, FAQs, and support guides for utilizing the portal."
  },
  // Admin Login
  "/admin/login": {
    title: "Admin Login",
    desc: "Secure administrator access portal."
  },
  "/staff/login": {
    title: "Staff Login",
    desc: "Secure staff access portal."
  },
  "/client/login": {
    title: "Client Login",
    desc: "Secure client access portal."
  },
  // Admin Panel Pages
  "/admin/dashboard": {
    title: "Admin Dashboard",
    desc: "Administrator dashboard overviewing live metrics, active projects, tasks, and tickets."
  },
  "/admin/projects": {
    title: "Project Management",
    desc: "Manage client projects, view scopes, budgets, statuses, and allocate resources."
  },
  "/admin/clients": {
    title: "Client Relations",
    desc: "Manage customer profiles, contacts, statuses, and login account authorizations."
  },
  "/admin/staff": {
    title: "Staff Directory",
    desc: "Manage staff members, roles, permissions, and workload assignments."
  },
  "/admin/tasks": {
    title: "Task Tracking",
    desc: "Overview of all tasks across projects, assignees, deadlines, and completion statuses."
  },
  "/admin/milestones": {
    title: "Project Milestones",
    desc: "Track critical phase milestones, target dates, invoicing triggers, and project roadmap."
  },
  "/admin/documents": {
    title: "Documents Vault",
    desc: "Central repository for administrative files, client briefs, and shared deliverables."
  },
  "/admin/invoices": {
    title: "Invoices & Billing",
    desc: "Generate invoices, monitor payment statuses, send reminders, and record offline transactions."
  },
  "/admin/transactions": {
    title: "Financial Transactions",
    desc: "Track all inbound and outbound client payments, gateway logs, and records."
  },
  "/admin/support": {
    title: "Support Desk",
    desc: "Resolve customer tickets, reply to inquiries, and manage technical requests."
  },
  "/admin/messages": {
    title: "Chat Messages",
    desc: "Communicate with clients, sub-admins, and staff members."
  },
  "/admin/contact-reviews": {
    title: "Contact Submissions",
    desc: "Review and respond to messages submitted through the public contact form."
  },
  "/admin/suspension-reviews": {
    title: "Suspension Reviews",
    desc: "Review client suspension appeals and account reactivation requests."
  },
  "/admin/analytics": {
    title: "Business Analytics",
    desc: "View portal analytics, financial charts, project efficiency, and client distributions."
  },
  "/admin/revenue-forecast": {
    title: "Revenue Forecast & BI",
    desc: "Analyze historical revenue, view source distributions, and forecast upcoming earnings."
  },
  "/admin/email-config": {
    title: "SMTP Email Config",
    desc: "Configure administrative SMTP settings for portal notifications and system alerts."
  },
  "/admin/admin-management": {
    title: "Admin Management",
    desc: "Create and manage sub-admins and configure their section-wise platform permissions."
  },
  "/admin/notifications": {
    title: "Alerts & Notifications",
    desc: "Inbox for project progress logs, invoicing events, and portal notifications."
  },
  "/admin/settings": {
    title: "Global Settings",
    desc: "Customize corporate branding, theme colors, site titles, logos, and defaults."
  },
  "/admin/settings/themes": {
    title: "Theme Settings",
    desc: "Customize branding colors, themes, navbar styles, and canvas backgrounds."
  },
  "/admin/settings/email": {
    title: "Email Settings",
    desc: "Fine-tune SMTP configurations and system email delivery preferences."
  },
  "/admin/settings/email-templates": {
    title: "Email Templates",
    desc: "Edit design and layout templates for automated client notifications and onboarding."
  },
  "/admin/settings/security": {
    title: "Security Settings",
    desc: "Adjust portal security, 2FA enforcements, password policies, and login thresholds."
  },
  "/admin/settings/redis": {
    title: "Redis Cache Settings",
    desc: "Monitor and control the Redis caching layer — enable or disable at runtime."
  },
  "/admin/payment-gateways": {
    title: "Payment Gateways",
    desc: "Integrate and configure payment systems including Stripe, Razorpay, and manual UPI QR codes."
  },
  "/admin/audit-logs": {
    title: "Audit Logs",
    desc: "View detailed system activity logs for all users, actions, and entities."
  },
  "/admin/content-settings": {
    title: "Content Settings",
    desc: "Edit and manage public page content including welcome, about, and feature sections."
  },

  // Staff Panel Pages
  "/staff/dashboard": {
    title: "Staff Dashboard",
    desc: "Staff dashboard containing task assignments, project timelines, and support tickets."
  },
  "/staff/projects": {
    title: "My Projects",
    desc: "Overview of all active projects assigned to you."
  },
  "/staff/tasks": {
    title: "My Tasks",
    desc: "Your queue of assigned tasks and priorities."
  },
  "/staff/milestones": {
    title: "Project Milestones",
    desc: "Sprint roadmap milestones tracker."
  },
  "/staff/documents": {
    title: "Documents",
    desc: "Shared project documents and files repository."
  },
  "/staff/tickets": {
    title: "Support Desk",
    desc: "Reply to customer support tickets."
  },
  "/staff/messages": {
    title: "Chat Messages",
    desc: "Staff and client communication board."
  },
  "/staff/settings": {
    title: "Account Settings",
    desc: "Configure profile details and security settings."
  },
  "/staff/notifications": {
    title: "Alerts & Notifications",
    desc: "Inbox for project progress logs, invoicing events, and portal notifications."
  },

  // Client Panel Pages
  "/client/dashboard": {
    title: "Client Dashboard",
    desc: "Overview of active projects, deliverables, recent activities, and open invoices."
  },
  "/client/projects": {
    title: "My Projects",
    desc: "View project developments, milestones, shared files, and deliverable status updates."
  },
  "/client/deliverables": {
    title: "Deliverables Vault",
    desc: "Review and download project assets, codebases, and finalized files."
  },
  "/client/documents": {
    title: "My Documents",
    desc: "Upload required project specifications and review administrative documents."
  },
  "/client/invoices": {
    title: "My Invoices",
    desc: "Pay bills, view transaction history, download receipts, and track invoice statuses."
  },
  "/client/support-tickets": {
    title: "Support Tickets",
    desc: "Create support tickets, read agent replies, and request project assistance."
  },
  "/client/messages": {
    title: "Chat Messages",
    desc: "Communicate directly with your assigned project manager and support team."
  },
  "/client/notifications": {
    title: "Alerts & Notifications",
    desc: "Inbox for project progress logs, invoicing events, and portal notifications."
  },
  "/client/settings": {
    title: "Account Settings",
    desc: "Manage profile details, security settings, passwords, and 2FA authentication."
  },
  "/client/payment-history": {
    title: "Payment History",
    desc: "View details and transaction histories for submitted payments and invoice receipts."
  }
};

const ogImageMap = {
  "/": "og-welcome-login.png",
  "/welcome": "og-welcome-login.png",
  "/contact": "og-contact.png",
  "/privacy-policy": "og-privacy-policy.png",
  "/terms-of-service": "og-terms-of-service.png",
  "/cookie-policy": "og-cookie-policy.png",
  "/help-center": "og-help-center.png",
  "/admin/login": "og-welcome-login.png",
  "/staff/login": "og-welcome-login.png",
  "/client/login": "og-welcome-login.png",
  "/forgot-password": "og-forgot-password.png",
  "/reset-password": "og-reset-password.png",
  "/admin/dashboard": "og-admin-dashboard.png",
  "/admin/projects": "og-admin-projects.png",
  "/admin/clients": "og-admin-clients.png",
  "/admin/staff": "og-admin-staff.png",
  "/admin/tasks": "og-admin-tasks.png",
  "/admin/milestones": "og-admin-milestones.png",
  "/admin/documents": "og-admin-documents.png",
  "/admin/invoices": "og-admin-invoices.png",
  "/admin/transactions": "og-admin-transactions.png",
  "/admin/support": "og-admin-support.png",
  "/admin/messages": "og-admin-messages.png",
  "/admin/contact-reviews": "og-admin-contact-reviews.png",
  "/admin/suspension-reviews": "og-admin-suspension-reviews.png",
  "/admin/analytics": "og-admin-analytics.png",
  "/admin/revenue-forecast": "og-admin-revenue-forecast.png",
  "/admin/email-config": "og-admin-email-config.png",
  "/admin/admin-management": "og-admin-admin-management.png",
  "/admin/notifications": "og-admin-notifications.png",
  "/admin/settings": "og-admin-settings.png",
  "/admin/settings/themes": "og-admin-settings-themes.png",
  "/admin/settings/email": "og-admin-settings-email.png",
  "/admin/settings/email-templates": "og-admin-settings-email-templates.png",
  "/admin/settings/security": "og-admin-settings-security.png",
  "/admin/settings/redis": "og-admin-settings-redis.png",
  "/admin/payment-gateways": "og-admin-payment-gateways.png",
  "/admin/audit-logs": "og-admin-audit-logs.png",
  "/admin/content-settings": "og-admin-content-settings.png",
  "/staff/dashboard": "og-staff-dashboard.png",
  "/staff/projects": "og-staff-projects.png",
  "/staff/tasks": "og-staff-tasks.png",
  "/staff/milestones": "og-staff-milestones.png",
  "/staff/documents": "og-staff-documents.png",
  "/staff/tickets": "og-staff-tickets.png",
  "/staff/messages": "og-staff-messages.png",
  "/staff/settings": "og-staff-settings.png",
  "/staff/notifications": "og-staff-notifications.png",
  "/client/dashboard": "og-client-dashboard.png",
  "/client/projects": "og-client-projects.png",
  "/client/deliverables": "og-client-deliverables.png",
  "/client/documents": "og-client-documents.png",
  "/client/invoices": "og-client-invoices.png",
  "/client/support-tickets": "og-client-support-tickets.png",
  "/client/messages": "og-client-messages.png",
  "/client/notifications": "og-client-notifications.png",
  "/client/settings": "og-client-settings.png",
  "/client/payment-history": "og-client-payment-history.png"
};

function escapeHtml(string) {
  if (!string) return "";
  return string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function prerender() {
  const distDir = path.resolve(__dirname, "dist");
  const templatePath = path.join(distDir, "index.html");

  if (!fs.existsSync(templatePath)) {
    console.error("Vite build output (index.html) not found. Build first.");
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(templatePath, "utf8");
  const siteTitle = "Sai CRP";
  const frontendUrl = "https://sai-crm.onrender.com";

  console.log("Starting static prerendering for routes...");

  for (const [route, meta] of Object.entries(staticMetaMap)) {
    const pageTitle = meta.title;
    const pageDesc = meta.desc;
    const ogImage = ogImageMap[route] || "og-default.png";

    const escapedTitle = escapeHtml(`${pageTitle} | ${siteTitle}`);
    const escapedDesc = escapeHtml(pageDesc);
    const ogImageUrl = `https://res.cloudinary.com/dfr1lsqzx/image/upload/sai-crp/og/${ogImage}`;

    // Clean existing meta tags if any (prevent duplication)
    let html = baseHtml;
    html = html.replace(/<title>.*?<\/title>/, `<title>${escapedTitle}</title>`);

    const metaTags = `
  <link rel="canonical" href="${frontendUrl}${route}" />
  <meta name="description" content="${escapedDesc}" />
  <meta property="og:title" content="${escapedTitle}" />
  <meta property="og:description" content="${escapedDesc}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:url" content="${frontendUrl}${route}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${siteTitle}" />
  <meta itemprop="name" content="${escapedTitle}" />
  <meta itemprop="description" content="${escapedDesc}" />
  <meta itemprop="image" content="${ogImageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapedTitle}" />
  <meta name="twitter:description" content="${escapedDesc}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <meta name="twitter:url" content="${frontendUrl}${route}" />
`;

    // Remove duplicates
    html = html.replace(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+name=["']description["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+property=["']og:image:width["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+property=["']og:image:height["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+property=["']og:image:type["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+property=["']og:url["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+property=["']og:type["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+property=["']og:site_name["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+itemprop=["']name["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+itemprop=["']description["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+itemprop=["']image["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+name=["']twitter:card["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+name=["']twitter:title["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+name=["']twitter:description["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']\s*\/?>/gi, "");
    html = html.replace(/<meta\s+name=["']twitter:url["']\s+content=["'](.*?)["']\s*\/?>/gi, "");

    html = html.replace("</head>", `${metaTags}\n</head>`);

    if (route === "/") {
      // For root, save directly to index.html in place
      fs.writeFileSync(templatePath, html, "utf8");
      console.log(`Prerendered root -> dist/index.html`);
    } else {
      // For sub-routes, save to dist/[route]/index.html
      const subRouteDir = path.join(distDir, route.slice(1));
      fs.mkdirSync(subRouteDir, { recursive: true });
      fs.writeFileSync(path.join(subRouteDir, "index.html"), html, "utf8");
      console.log(`Prerendered route ${route} -> dist${route}/index.html`);
    }
  }

  console.log("Successfully completed prerendering all static routes!");
}

prerender();
