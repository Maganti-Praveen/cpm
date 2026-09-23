import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { getDefaultTemplates } from "../services/email/templateParser.js";

async function main() {
  console.log("Cleaning database and seeding single Admin account...\n");

  // 1. Remove all workspace, company, client, and user data
  console.log("Removing all workspace, transaction, project, and user data...");
  const tables = [
    "Transaction",
    "Invoice",
    "TicketReply",
    "Ticket",
    "Comment",
    "Attachment",
    "Task",
    "Deliverable",
    "Milestone",
    "Document",
    "Activity",
    "Project",
    "ContactReply",
    "ContactSubmission",
    "AuditLog",
    "Notification",
    "ConversationLock",
    "Message",
    "Conversation",
    "PushSubscription",
    "LoginAttempt",
    "VerificationSession",
    "User"
  ];
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`
  );
  console.log("[OK] All previous users and company data removed.");

  // 2. SiteSettings
  const existingSettings = await prisma.siteSettings.findUnique({
    where: { singletonId: 1 }
  });
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        singletonId: 1,
        siteTitle: "Sai IT Services",
        metaTitle: "Sai IT Services - Enterprise IT Solutions",
        metaDescription: "Global enterprise IT services delivering cloud, AI, cybersecurity, and digital transformation solutions.",
        themeColor: "#4F46E5",
        themeSecondaryColor: "#6366F1",
        sidebarBg: "#1E1B4B",
        sidebarFontColor: "#E0E7FF",
        navbarBg: "#FFFFFF",
        navbarFontColor: "#475569",
        mainBg: "#F8FAFC",
        mainFontColor: "#0F172A",
        activeTabBg: "#4F46E5",
        activeTabColor: "#FFFFFF",
        ctaBg: "#4F46E5",
        ctaHoverBg: "#3730A3",
        fontFamily: "Inter",
        storageProvider: "local"
      }
    });
    console.log("[OK] Verified SiteSettings");
  }

  // 3. SecuritySettings
  const existingSecurity = await prisma.securitySettings.findUnique({
    where: { singletonId: 1 }
  });
  if (!existingSecurity) {
    await prisma.securitySettings.create({
      data: {
        singletonId: 1,
        admin2FAEnabled: false,
        staff2FAEnabled: false,
        client2FAEnabled: false
      }
    });
    console.log("[OK] Verified SecuritySettings");
  }

  // 4. EmailSettings
  const existingEmailSettings = await prisma.emailSettings.findUnique({
    where: { singletonId: 1 }
  });
  if (!existingEmailSettings) {
    await prisma.emailSettings.create({
      data: {
        singletonId: 1,
        emailEnabled: false,
        activeProvider: "smtp",
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPass: "",
        smtpFromEmail: "info@saiitservices.com",
        smtpFromName: "Sai IT Services",
        smtpSecure: false,
        resendApiKey: "",
        resendFromEmail: "info@saiitservices.com",
        resendFromName: "Sai IT Services",
        autoEmailsEnabled: true,
        invoiceEmails: true,
        clientWelcomeEmails: true,
        staffWelcomeEmails: true,
        projectAssignEmails: true,
        passwordResetEmails: true,
        supportTicketEmails: true,
        emailPrimaryColor: "#4F46E5",
        emailHeaderBg: "#1E1B4B",
        emailBodyBg: "#FFFFFF",
        emailBgColor: "#F8FAFC",
        emailFontColor: "#334155",
        emailFontFamily: "Segoe UI, Arial, sans-serif",
        emailFooterText: "© 2026 Sai IT Services. All rights reserved."
      }
    });
    console.log("[OK] Verified EmailSettings");
  }

  // 5. EmailTemplates
  const templateCount = await prisma.emailTemplate.count();
  if (templateCount === 0) {
    const defaultTemplates = getDefaultTemplates();
    for (const tpl of defaultTemplates) {
      await prisma.emailTemplate.create({
        data: {
          name: tpl.name,
          slug: tpl.slug,
          subject: tpl.subject,
          htmlContent: tpl.htmlContent,
          variables: tpl.variables,
          type: tpl.type,
          isActive: true
        }
      });
    }
    console.log(`[OK] Verified ${defaultTemplates.length} EmailTemplates`);
  }

  // 6. Themes
  const themeCount = await prisma.theme.count();
  if (themeCount === 0) {
    const themes = [
      {
        name: "Default Indigo",
        sidebarBg: "#1E1B4B",
        sidebarFont: "#E0E7FF",
        activeTabBg: "#6366F1",
        activeTabFont: "#FFFFFF",
        navbarBg: "#FFFFFF",
        navbarFont: "#475569",
        mainCanvasBg: "#F8FAFC",
        mainFontColor: "#0F172A",
        primaryButtonBg: "#4F46E5",
        buttonHoverBg: "#3730A3",
        footerBg: "#1E1B4B",
        footerFont: "#E0E7FF",
        fontFamily: "Inter",
        iconColor: "#6366F1",
        paginationBg: "#4F46E5",
        paginationFont: "#FFFFFF",
        isDefault: true
      },
      {
        name: "Midnight Emerald",
        sidebarBg: "#064E3B",
        sidebarFont: "#D1FAE5",
        activeTabBg: "#10B981",
        activeTabFont: "#FFFFFF",
        navbarBg: "#FFFFFF",
        navbarFont: "#374151",
        mainCanvasBg: "#F8FAFC",
        mainFontColor: "#111827",
        primaryButtonBg: "#059669",
        buttonHoverBg: "#047857",
        footerBg: "#064E3B",
        footerFont: "#D1FAE5",
        fontFamily: "Outfit",
        iconColor: "#10B981",
        paginationBg: "#059669",
        paginationFont: "#FFFFFF",
        isDefault: false
      },
      {
        name: "Deep Indigo",
        sidebarBg: "#0B1120",
        sidebarFont: "#F1F5F9",
        activeTabBg: "#7C3AED",
        activeTabFont: "#FFFFFF",
        navbarBg: "#111827",
        navbarFont: "#F8FAFC",
        mainCanvasBg: "#0F172A",
        mainFontColor: "#F8FAFC",
        primaryButtonBg: "#4338CA",
        buttonHoverBg: "#312E81",
        footerBg: "#0B1120",
        footerFont: "#F1F5F9",
        fontFamily: "Inter",
        iconColor: "#7C3AED",
        paginationBg: "#4338CA",
        paginationFont: "#FFFFFF",
        isDefault: false
      },
      {
        name: "Nordic Dark",
        sidebarBg: "#0B1120",
        sidebarFont: "#F1F5F9",
        activeTabBg: "#0EA5E9",
        activeTabFont: "#FFFFFF",
        navbarBg: "#111827",
        navbarFont: "#F8FAFC",
        mainCanvasBg: "#0F172A",
        mainFontColor: "#F8FAFC",
        primaryButtonBg: "#0284C7",
        buttonHoverBg: "#0369A1",
        footerBg: "#0B1120",
        footerFont: "#F1F5F9",
        fontFamily: "Space Grotesk",
        iconColor: "#0EA5E9",
        paginationBg: "#0284C7",
        paginationFont: "#FFFFFF",
        isDefault: false
      }
    ];
    for (const th of themes) {
      await prisma.theme.create({ data: th });
    }
    console.log(`[OK] Verified ${themes.length} Themes`);
  }

  // 7. PaymentGateways
  const gwCount = await prisma.paymentGateway.count();
  if (gwCount === 0) {
    const gateways = [
      {
        name: "razorpay",
        label: "Razorpay",
        type: "automatic",
        enabled: false,
        mode: "test",
        config: { keyId: "", secret: "" }
      },
      {
        name: "payu",
        label: "PayU",
        type: "automatic",
        enabled: false,
        mode: "test",
        config: { merchantKey: "", merchantSalt: "" }
      },
      {
        name: "paypal",
        label: "PayPal",
        type: "automatic",
        enabled: false,
        mode: "sandbox",
        config: { clientId: "", secret: "" }
      },
      {
        name: "paytm",
        label: "Paytm",
        type: "automatic",
        enabled: false,
        mode: "test",
        config: { merchantId: "", merchantKey: "", website: "" }
      },
      {
        name: "cashfree",
        label: "Cashfree",
        type: "automatic",
        enabled: false,
        mode: "test",
        config: { appId: "", secretKey: "" }
      },
      {
        name: "manual",
        label: "Bank Transfer & UPI",
        type: "manual",
        enabled: true,
        mode: "live",
        config: {
          accountName: "Sai IT Services LLC",
          accountNumber: "",
          ifsc: "",
          bankName: "",
          upiId: "",
          instructions: "Please transfer the invoice amount and submit your transaction reference number for verification."
        }
      }
    ];
    for (const gw of gateways) {
      await prisma.paymentGateway.create({ data: gw });
    }
    console.log(`[OK] Verified ${gateways.length} PaymentGateways`);
  }

  // 8. Seed ONLY the single Super Admin account
  console.log("Seeding single Super Admin account...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@gmail.com",
      password: hashedPassword,
      fullName: "Administrator",
      role: "ADMIN",
      isSuperAdmin: true,
      isActive: true,
      status: "Active",
      isFirstLogin: false,
      company: null,
      phone: null
    }
  });

  console.log(`[OK] Seeded single Admin account: ${admin.email}`);
  console.log("Database reset and single admin account seeded successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
