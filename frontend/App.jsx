// Defines the main route map and wraps the client in layout providers.
// Serves as the parent route coordinator for public and protected paths.

import React, { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadUser } from "./slices/authSlice";
import { ToastProvider } from "./context/ToastContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CmsSettingsProvider } from "./context/CmsSettingsContext";

const AdminLogin = lazy(() => import("./pages/admin/Login"));
const StaffLogin = lazy(() => import("./pages/staff/Login"));
const ClientLogin = lazy(() => import("./pages/client/Login"));

// Admin layout + pages (lazy loaded)
const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProjects = lazy(() => import("./pages/admin/Projects"));
const ProjectDetail = lazy(() => import("./pages/admin/ProjectDetail"));
const AdminClients = lazy(() => import("./pages/admin/Clients"));
const AdminStaff = lazy(() => import("./pages/admin/Staff"));
const AdminTasks = lazy(() => import("./pages/admin/Tasks"));
const AdminMilestones = lazy(() => import("./pages/admin/Milestones"));
const AdminDocuments = lazy(() => import("./pages/admin/Documents"));
const AdminInvoices = lazy(() => import("./pages/admin/Invoices"));
const AdminSupport = lazy(() => import("./pages/admin/Tickets"));
const AdminMessages = lazy(() => import("./pages/admin/Messages"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminRevenueForecast = lazy(() => import("./pages/admin/revenue-forecast/RevenueForecast"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminPaymentGateways = lazy(() => import("./pages/admin/PaymentGateways"));
const AdminContactReviews = lazy(() => import("./pages/admin/ContactReviews"));
const AdminSuspensionReviews = lazy(() => import("./pages/admin/SuspensionReviews"));
const AdminTransactions = lazy(() => import("./pages/admin/Transactions"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const AdminContentSettings = lazy(() => import("./pages/admin/ContentSettings"));
const EmailConfigPage = lazy(() => import("./pages/admin/EmailConfigPage"));
const AdminManagement = lazy(() => import("./pages/admin/AdminManagement"));
const EmailSettings = lazy(() => import("./pages/admin/settings/EmailSettings"));
const EmailTemplates = lazy(() => import("./pages/admin/settings/EmailTemplates"));
const SecuritySettings = lazy(() => import("./pages/admin/settings/SecuritySettings"));
const ThemeSettings = lazy(() => import("./pages/admin/settings/ThemeSettings"));
const AdminLoginActivities = lazy(() => import("./pages/admin/LoginActivities"));
const CheckoutPortal = lazy(() => import("./pages/client/CheckoutPortal"));

// Other role pages (lazy loaded)
const StaffLayout = lazy(() => import("./layouts/StaffLayout"));
const StaffDashboard = lazy(() => import("./pages/staff/StaffDashboard"));
const StaffProjects = lazy(() => import("./pages/staff/Projects"));
const StaffDocuments = lazy(() => import("./pages/staff/Documents"));
const StaffMessages = lazy(() => import("./pages/staff/Messages"));
const StaffTickets = lazy(() => import("./pages/staff/StaffTickets"));
const StaffMilestones = lazy(() => import("./pages/staff/StaffMilestones"));
const StaffSettings = lazy(() => import("./pages/staff/StaffSettings"));
const MyTasks = lazy(() => import("./pages/staff/MyTasks"));
const ClientDashboard = lazy(() => import("./pages/client/Dashboard"));
import RoleProtectedRoute from "./routes/RoleProtectedRoute";
const Welcome = lazy(() => import("./pages/public/Welcome"));
const Contact = lazy(() => import("./pages/public/Contact"));
const Services = lazy(() => import("./pages/public/Services"));
const ServiceDetail = lazy(() => import("./pages/public/ServiceDetail"));
const CaseStudies = lazy(() => import("./pages/public/CaseStudies"));
const CaseStudyDetail = lazy(() => import("./pages/public/CaseStudyDetail"));
const AboutUs = lazy(() => import("./pages/public/AboutUs"));
const Careers = lazy(() => import("./pages/public/Careers"));
const PrivacyPolicy = lazy(() => import("./pages/public/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/public/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/public/CookiePolicy"));
const HelpCenter = lazy(() => import("./pages/public/HelpCenter"));

// Client Portal Shell Layout & Pages (lazy loaded)
const ClientLayout = lazy(() => import("./layouts/ClientLayout"));
const ClientProjects = lazy(() => import("./pages/client/Projects"));
const ClientDeliverables = lazy(() => import("./pages/client/Deliverables"));
const ClientDocuments = lazy(() => import("./pages/client/Documents"));
const ClientInvoices = lazy(() => import("./pages/client/Invoices"));
const ClientTickets = lazy(() => import("./pages/client/Tickets"));
const ClientMessages = lazy(() => import("./pages/client/Messages"));
const ClientNotifications = lazy(() => import("./pages/client/Notifications"));
const ClientSettings = lazy(() => import("./pages/client/Settings"));
const BookingHistory = lazy(() => import("./pages/client/BookingHistory"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const StaffNotifications = lazy(() => import("./pages/staff/Notifications"));

/**
 * ScrollToTop component that automatically scrolls the window to coordinates (0, 0)
 * on page/route transitions. It also updates search engine tags, Twitter cards, Open Graph data, 
 * and browser page titles dynamically depending on the current routing subpath.
 * 
 * @returns {null} Renders no UI elements.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    let pageTitle = "Portal";
    let pageDesc = "Manage projects, invoices, tasks, and client communication seamlessly on the Sai Portal.";

    const siteTitle = localStorage.getItem("sai_site_title") || "Sai IT Services";

    // Public Pages
    if (pathname === "/") {
      pageTitle = "Welcome";
      pageDesc = "Welcome to Sai IT Services Enterprise IT Services & Solutions.";
    } else if (pathname === "/services") {
      pageTitle = "Enterprise Services";
      pageDesc = "Explore Enterprise IT Services & Engineering Capabilities offered by Sai IT Services.";
    } else if (pathname.startsWith("/services/")) {
      pageTitle = "Service Offering";
      pageDesc = "Detailed breakdown of enterprise technology capabilities and IT architecture.";
    } else if (pathname === "/about") {
      pageTitle = "About Us";
      pageDesc = "Learn about our corporate mission, values, and enterprise IT leadership.";
    } else if (pathname === "/careers") {
      pageTitle = "Careers";
      pageDesc = "Explore open career opportunities across our enterprise IT practice areas.";
    } else if (pathname === "/case-studies") {
      pageTitle = "Projects";
      pageDesc = "Explore our portfolio of enterprise projects and case studies with proven results.";
    } else if (pathname.startsWith("/case-studies/")) {
      pageTitle = "Project Details";
      pageDesc = "Detailed case study of an enterprise project with key results and technologies used.";
    } else if (pathname === "/contact") {
      pageTitle = "Contact Us";
      pageDesc = "Get in touch with our customer support and administration team.";
    } else if (pathname === "/privacy-policy") {
      pageTitle = "Privacy Policy";
      pageDesc = "Read our privacy policy to understand how we protect and manage your personal data.";
    } else if (pathname === "/terms-of-service") {
      pageTitle = "Terms of Service";
      pageDesc = "Read the terms of service governing the use of the Sai Portal.";
    } else if (pathname === "/cookie-policy") {
      pageTitle = "Cookie Policy";
      pageDesc = "Understand how we use cookies to improve your user experience on our portal.";
    } else if (pathname === "/help-center") {
      pageTitle = "Help Center";
      pageDesc = "Browse help topics, FAQs, and support guides for utilizing the portal.";
    }
    // Auth Logins
    else if (pathname === "/admin/login") {
      pageTitle = "Admin Login";
      pageDesc = "Secure administrative access login portal for staff and project managers.";
    } else if (pathname === "/staff/login") {
      pageTitle = "Staff Login";
      pageDesc = "Secure staff login portal to manage tasks, milestones, and projects.";
    } else if (pathname === "/client/login") {
      pageTitle = "Client Login";
      pageDesc = "Client relationship portal login page. Log in to track your deliverables.";
    }
    // Admin Panel Pages
    else if (pathname === "/admin/dashboard") {
      pageTitle = "Admin Dashboard";
      pageDesc = "Administrator dashboard overviewing live metrics, active projects, tasks, and tickets.";
    } else if (pathname === "/admin/projects") {
      pageTitle = "Project Management";
      pageDesc = "Manage client projects, view scopes, budgets, statuses, and allocate resources.";
    } else if (pathname.startsWith("/admin/projects/")) {
      pageTitle = "Project Details";
      pageDesc = "View detailed project timeline, files, deliverables, activity log, and milestones.";
    } else if (pathname === "/admin/clients") {
      pageTitle = "Client Relations";
      pageDesc = "Manage customer profiles, contacts, statuses, and login account authorizations.";
    } else if (pathname === "/admin/staff") {
      pageTitle = "Staff Directory";
      pageDesc = "Manage staff members, roles, permissions, and workload assignments.";
    } else if (pathname === "/admin/tasks") {
      pageTitle = "Task Tracking";
      pageDesc = "Overview of all tasks across projects, assignees, deadlines, and completion statuses.";
    } else if (pathname === "/admin/milestones") {
      pageTitle = "Project Milestones";
      pageDesc = "Track critical phase milestones, target dates, invoicing triggers, and project roadmap.";
    } else if (pathname === "/admin/documents") {
      pageTitle = "Documents Vault";
      pageDesc = "Central repository for administrative files, client briefs, and shared deliverables.";
    } else if (pathname === "/admin/invoices") {
      pageTitle = "Invoices & Billing";
      pageDesc = "Generate invoices, monitor payment statuses, send reminders, and record offline transactions.";
    } else if (pathname === "/admin/transactions") {
      pageTitle = "Financial Transactions";
      pageDesc = "Track all inbound and outbound client payments, gateway logs, and records.";
    } else if (pathname === "/admin/support") {
      pageTitle = "Support Desk";
      pageDesc = "Resolve customer tickets, reply to inquiries, and manage technical requests.";
    } else if (pathname === "/admin/contact-reviews") {
      pageTitle = "Contact Submissions";
      pageDesc = "Review and respond to messages submitted through the public contact form.";
    } else if (pathname === "/admin/suspension-reviews") {
      pageTitle = "Suspension Reviews";
      pageDesc = "Review and resolve appeals submitted by suspended users requesting login assistance.";
    } else if (pathname === "/admin/messages") {
      pageTitle = "Chat Messages";
      pageDesc = "Secure, direct messaging workspace communicating with team agents and clients.";
    } else if (pathname === "/admin/analytics") {
      pageTitle = "Business Analytics";
      pageDesc = "View portal analytics, financial charts, project efficiency, and client distributions.";
    } else if (pathname === "/admin/revenue-forecast") {
      pageTitle = "Revenue Forecast & BI";
      pageDesc = "Analyze historical revenue, view source distributions, and forecast upcoming earnings.";
    } else if (pathname === "/admin/email-config") {
      pageTitle = "SMTP Email Config";
      pageDesc = "Configure administrative SMTP settings for portal notifications and system alerts.";
    } else if (pathname === "/admin/admin-management") {
      pageTitle = "Admin Management";
      pageDesc = "Create and manage sub-admins and configure their section-wise platform permissions.";
    } else if (pathname === "/admin/settings") {
      pageTitle = "Global Settings";
      pageDesc = "Customize corporate branding, theme colors, site titles, logos, and defaults.";
    } else if (pathname === "/admin/settings/email") {
      pageTitle = "Email Settings";
      pageDesc = "Fine-tune SMTP configurations and system email delivery preferences.";
    } else if (pathname === "/admin/settings/themes") {
      pageTitle = "Theme Settings";
      pageDesc = "Customize corporate branding, theme colors, sidebar, and navbar defaults.";
    } else if (pathname === "/admin/settings/email-templates") {
      pageTitle = "Email Templates";
      pageDesc = "Edit design and layout templates for automated client notifications and onboarding.";
    } else if (pathname === "/admin/settings/security") {
      pageTitle = "Security Settings";
      pageDesc = "Adjust portal security, 2FA enforcements, password policies, and login thresholds.";
    } else if (pathname === "/admin/settings/redis") {
      pageTitle = "Redis Cache Settings";
      pageDesc = "Monitor and control the Redis caching layer — enable or disable at runtime.";
    } else if (pathname === "/admin/payment-gateways") {
      pageTitle = "Payment Gateways";
      pageDesc = "Integrate and configure payment systems including Stripe, Razorpay, and manual UPI QR codes.";
    } else if (pathname === "/admin/audit-logs") {
      pageTitle = "Audit Logs";
      pageDesc = "View detailed system activity logs for all users, actions, and entities.";
    } else if (pathname === "/admin/content-settings") {
      pageTitle = "Content Settings";
      pageDesc = "Edit and manage public page content including welcome, about, and feature sections.";
    }
    // Staff Panel Pages
    else if (pathname === "/staff/dashboard") {
      pageTitle = "Staff Dashboard";
      pageDesc = "Staff dashboard containing task assignments, project timelines, and support tickets.";
    }
    // Client Panel Pages
    else if (pathname === "/client/dashboard") {
      pageTitle = "Client Dashboard";
      pageDesc = "Overview of active projects, deliverables, recent activities, and open invoices.";
    } else if (pathname === "/client/projects") {
      pageTitle = "My Projects";
      pageDesc = "View project developments, milestones, shared files, and deliverable status updates.";
    } else if (pathname.startsWith("/client/projects/")) {
      pageTitle = "Project Details";
      pageDesc = "Detail view for your project including tabs for overview, tasks, and documents.";
    } else if (pathname === "/client/deliverables") {
      pageTitle = "Deliverables Vault";
      pageDesc = "Review and download project assets, codebases, and finalized files.";
    } else if (pathname === "/client/documents") {
      pageTitle = "My Documents";
      pageDesc = "Upload required project specifications and review administrative documents.";
    } else if (pathname === "/client/invoices") {
      pageTitle = "My Invoices";
      pageDesc = "Pay bills, view transaction history, download receipts, and track invoice statuses.";
    } else if (pathname === "/client/support-tickets") {
      pageTitle = "Support Tickets";
      pageDesc = "Create support tickets, read agent replies, and request project assistance.";
    } else if (pathname === "/client/messages") {
      pageTitle = "Chat Messages";
      pageDesc = "Communicate directly with your assigned project manager and support team.";
    } else if (pathname === "/client/notifications" || pathname === "/admin/notifications" || pathname === "/staff/notifications") {
      pageTitle = "Alerts & Notifications";
      pageDesc = "Inbox for project progress logs, invoicing events, and portal notifications.";
    } else if (pathname === "/client/settings") {
      pageTitle = "Account Settings";
      pageDesc = "Manage profile details, security settings, passwords, and 2FA authentication.";
    } else if (pathname === "/client/payment-history") {
      pageTitle = "Payment History";
      pageDesc = "View details and transaction histories for submitted payments and invoice receipts.";
    } else if (pathname.startsWith("/client/checkout/")) {
      pageTitle = "Invoice Checkout";
      pageDesc = "Complete checkout and securely process payments for outstanding client invoices.";
    } else if (pathname === "/staff/dashboard") {
      pageTitle = "Staff Dashboard";
      pageDesc = "Overview of your assigned tasks, projects, roadmap milestones, and general system stats.";
    } else if (pathname === "/staff/projects") {
      pageTitle = "My Projects";
      pageDesc = "Overview of all active projects assigned to you.";
    } else if (pathname.startsWith("/staff/projects/")) {
      pageTitle = "Project Details";
      pageDesc = "Detailed view of project tasks, milestones, documents, and client contacts.";
    } else if (pathname === "/staff/tasks") {
      pageTitle = "My Tasks";
      pageDesc = "Your queue of assigned tasks and priorities.";
    } else if (pathname === "/staff/milestones") {
      pageTitle = "Project Milestones";
      pageDesc = "Sprint roadmap milestones tracker.";
    } else if (pathname === "/staff/documents") {
      pageTitle = "Documents";
      pageDesc = "Shared project documents and files repository.";
    } else if (pathname === "/staff/tickets") {
      pageTitle = "Support Desk";
      pageDesc = "Reply to customer support tickets.";
    } else if (pathname === "/staff/messages") {
      pageTitle = "Chat Messages";
      pageDesc = "Staff and client communication board.";
    } else if (pathname === "/staff/settings") {
      pageTitle = "Account Settings";
      pageDesc = "Configure profile details and security settings.";
    }

    document.title = `${pageTitle} | ${siteTitle}`;
    
    // Explicit mapping of routes to their specific Cloudinary OG image filenames
    const ogImageMap = {
      // Public Pages
      "/": "og-welcome-login.png",
      "/welcome": "og-welcome-login.png",
      "/contact": "og-contact.png",
      "/privacy-policy": "og-privacy-policy.png",
      "/terms-of-service": "og-terms-of-service.png",
      "/cookie-policy": "og-cookie-policy.png",
      "/help-center": "og-help-center.png",
      
      // Auth Pages
      "/admin/login": "og-welcome-login.png",
      "/staff/login": "og-welcome-login.png",
      "/client/login": "og-welcome-login.png",
      "/forgot-password": "og-forgot-password.png",
      "/reset-password": "og-reset-password.png",

      // Admin Panel Pages
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

      // Staff Panel Pages
      "/staff/dashboard": "og-staff-dashboard.png",
      "/staff/projects": "og-staff-projects.png",
      "/staff/tasks": "og-staff-tasks.png",
      "/staff/milestones": "og-staff-milestones.png",
      "/staff/documents": "og-staff-documents.png",
      "/staff/tickets": "og-staff-tickets.png",
      "/staff/messages": "og-staff-messages.png",
      "/staff/settings": "og-staff-settings.png",
      "/staff/notifications": "og-staff-notifications.png",

      // Client Panel Pages
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

    // All OG images are now served from Cloudinary
    let ogImage = "og-default.png";
    if (ogImageMap[pathname]) {
      ogImage = ogImageMap[pathname];
    } else if (pathname.startsWith("/admin/projects/")) {
      ogImage = "og-admin-project-details.png";
    } else if (pathname.startsWith("/staff/projects/")) {
      ogImage = "og-staff-projects.png";
    } else if (pathname.startsWith("/client/projects/")) {
      ogImage = "og-client-projects.png";
    } else if (pathname.includes("/client/checkout/")) {
      ogImage = "og-client-invoices.png";
    }
    const ogImageUrl = `https://res.cloudinary.com/dfr1lsqzx/image/upload/sai-crp/og/${ogImage}`;

    const fullTitle = `${pageTitle} | ${siteTitle}`;

    const updateMetaTag = (attrName, attrVal, content) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Update canonical link in DOM
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", window.location.href);

    // Update standard description
    updateMetaTag("name", "description", pageDesc);

    // Update Open Graph tags
    updateMetaTag("property", "og:title", fullTitle);
    updateMetaTag("property", "og:description", pageDesc);
    updateMetaTag("property", "og:image", ogImageUrl);
    updateMetaTag("property", "og:image:width", "1200");
    updateMetaTag("property", "og:image:height", "630");
    updateMetaTag("property", "og:image:type", "image/png");
    updateMetaTag("property", "og:url", window.location.href);
    updateMetaTag("property", "og:type", "website");
    updateMetaTag("property", "og:site_name", siteTitle);

    // Update Schema.org itemprop tags for WhatsApp & Search Engines
    updateMetaTag("itemprop", "name", fullTitle);
    updateMetaTag("itemprop", "description", pageDesc);
    updateMetaTag("itemprop", "image", ogImageUrl);

    // Update Twitter tags
    updateMetaTag("name", "twitter:card", "summary_large_image");
    updateMetaTag("name", "twitter:title", fullTitle);
    updateMetaTag("name", "twitter:description", pageDesc);
    updateMetaTag("name", "twitter:image", ogImageUrl);
    updateMetaTag("name", "twitter:url", window.location.href);
  }, [pathname]);

  return null;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans" style={{ backgroundColor: "var(--page-bg, #F8FAFC)" }}>
      <svg className="animate-spin h-8 w-8 text-primary mb-3" width="32" height="32" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span className="text-xs font-semibold" style={{ color: "var(--text-secondary, #475569)" }}>Loading Page...</span>
    </div>
  );
}

/**
 * Main application component. Sets up global state context providers (SiteSettings, Toast, CmsSettings, Theme),
 * initializes React Router, sets up global auth bootstrap logic on startup, and lists all public and role-protected
 * routes (Admin, Staff, Client).
 * 
 * @returns {React.JSX.Element} The rendered React tree structure.
 */
function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  // applySiteSettings is now handled by SiteSettingsProvider at the root level

  // if token exists, try to load user on app start
  useEffect(() => {
    if (token) {
      dispatch(loadUser());
    }
  }, [dispatch, token]);

  // Hide initial HTML loader once React app mounts
  useEffect(() => {
    const loader = document.getElementById("initial-loader");
    if (loader) {
      // Send loader to the back layer behind #root
      loader.style.zIndex = "-10";
      
      // Stop layout animations to preserve CPU resource usage
      const spinner = loader.querySelector(".spinner-svg");
      if (spinner) {
        spinner.style.animation = "none";
      }
      const circle = loader.querySelector("circle");
      if (circle) {
        circle.style.animation = "none";
      }
    }
  }, []);

  return (
    <SiteSettingsProvider>
      <ToastProvider>
      <CmsSettingsProvider>
        <ThemeProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/staff/login" element={<StaffLogin />} />
              <Route path="/client/login" element={<ClientLogin />} />
              <Route path="/login" element={<Navigate to="/client/login" replace />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:slug" element={<ServiceDetail />} />
              <Route path="/case-studies" element={<CaseStudies />} />
              <Route path="/case-studies/:slug" element={<CaseStudyDetail />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/" element={<Welcome />} />

              {/* Admin routes — wrapped in AdminLayout */}
              <Route
                path="/admin"
                element={
                  <RoleProtectedRoute allowedRole="ADMIN">
                    <AdminLayout />
                  </RoleProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route
                  path="projects"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="projects">
                      <AdminProjects />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="projects/:id"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="projects">
                      <ProjectDetail />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="clients"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="clients">
                      <AdminClients />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="staff"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="staff">
                      <AdminStaff />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="tasks"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="tasks">
                      <AdminTasks />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="milestones"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="milestones">
                      <AdminMilestones />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="documents"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="documents">
                      <AdminDocuments />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="invoices"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="invoices">
                      <AdminInvoices />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="transactions"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="transactions">
                      <AdminTransactions />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="support"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="support">
                      <AdminSupport />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="messages"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN">
                      <AdminMessages />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="contact-reviews"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="contact_reviews">
                      <AdminContactReviews />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="suspension-reviews"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="suspension_reviews">
                      <AdminSuspensionReviews />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="login-activities"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="login_activities">
                      <AdminLoginActivities />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="analytics"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="analytics">
                      <AdminAnalytics />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="revenue-forecast"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="revenue_forecast">
                      <AdminRevenueForecast />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="email-config"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="email_config">
                      <EmailConfigPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="admin-management"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" superAdminOnly={true}>
                      <AdminManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="notifications"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN">
                      <AdminNotifications />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN">
                      <AdminSettings />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="settings/themes"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="settings_theme">
                      <ThemeSettings />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="settings/email"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="email_config">
                      <EmailSettings />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="settings/email-templates"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="email_config">
                      <EmailTemplates />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="settings/security"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="settings_site">
                      <SecuritySettings />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="payment-gateways"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="payment_gateways">
                      <AdminPaymentGateways />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="audit-logs"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="audit_logs">
                      <AdminAuditLogs />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="content-settings"
                  element={
                    <RoleProtectedRoute allowedRole="ADMIN" requiredPermissionKey="content_settings">
                      <AdminContentSettings />
                    </RoleProtectedRoute>
                  }
                />
              </Route>

              {/* Staff protected routes */}
              <Route
                path="/staff"
                element={
                  <RoleProtectedRoute allowedRole="STAFF">
                    <StaffLayout />
                  </RoleProtectedRoute>
                }
              >
                <Route path="dashboard" element={<StaffDashboard />} />
                <Route path="projects" element={<StaffProjects />} />
                <Route path="projects/:id" element={<ProjectDetail />} />
                <Route path="tasks" element={<MyTasks />} />
                <Route path="milestones" element={<StaffMilestones />} />
                <Route path="documents" element={<StaffDocuments />} />
                <Route path="tickets" element={<StaffTickets />} />
                <Route path="messages" element={<StaffMessages />} />
                <Route path="notifications" element={<StaffNotifications />} />
                <Route path="settings" element={<StaffSettings />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Client portal nested layout routes */}
              <Route
                path="/client"
                element={
                  <RoleProtectedRoute allowedRole="CLIENT">
                    <ClientLayout />
                  </RoleProtectedRoute>
                }
              >
                <Route path="dashboard" element={<ClientDashboard />} />
                <Route path="projects" element={<ClientProjects />} />
                <Route path="projects/:id" element={<ProjectDetail />} />
                <Route path="deliverables" element={<ClientDeliverables />} />
                <Route path="documents" element={<ClientDocuments />} />
                <Route path="invoices" element={<ClientInvoices />} />
                <Route path="support-tickets" element={<ClientTickets />} />
                <Route path="messages" element={<ClientMessages />} />
                <Route path="notifications" element={<ClientNotifications />} />
                <Route path="settings" element={<ClientSettings />} />
                <Route path="payment-history" element={<BookingHistory />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Full-screen Client Checkout */}
              <Route
                path="/client/checkout/:gateway/:invoiceId"
                element={
                  <RoleProtectedRoute allowedRole="CLIENT">
                    <CheckoutPortal />
                  </RoleProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/client/login" replace />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </ThemeProvider>
      </CmsSettingsProvider>
      </ToastProvider>
    </SiteSettingsProvider>
  );
}

export default App;