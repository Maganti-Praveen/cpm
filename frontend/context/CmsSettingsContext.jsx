// Synchronizes landing page content edits from the CMS dashboard with public routes.
// Manages default values, cache storage, and updates for welcome, about, and features blocks.


import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CmsSettingsContext = createContext(null);

// Fallback values in case the DB connection is offline or not yet seeded
const DEFAULTS = {
  welcome: {
    hero: {
      title: "Project Management Portal: Unified Client & Project Hub.",
      subtitle: "Everything your team needs to manage clients and projects — in one place. No more scattered emails, lost files, or missed deadlines.",
      buttonText: "Get Started"
    },
    cta: {
      title: "Ready to Transform Your Corporate Technology Operations?",
      description: "Connect with our enterprise solution architects to discuss your technical requirements or request a proposal.",
      buttonText: "Contact IT Sales & Engineering"
    },
    stats: {
      title: "Platform Overview",
      stat1_title: "Active Projects",
      stat1_value: "12",
      stat2_title: "Open Tasks",
      stat2_value: "38",
      stat3_title: "Pending Invoices",
      stat3_value: "5",
      stat4_title: "Team Members",
      stat4_value: "8"
    },
    features: {
      title: "Features",
      subtitle: "All the tools you need to run your projects and serve your clients.",
      list: [
        { icon: "LayoutDashboard", title: "Dashboard", description: "See your project status, deadlines, and team activity at a glance." },
        { icon: "Users", title: "Client Management", description: "Manage all your client details, contacts, and portal access in one place." },
        { icon: "Briefcase", title: "Project Management", description: "Track projects from start to finish — scope, timeline, and team." },
        { icon: "CheckCircle2", title: "Task Management", description: "Create tasks, assign team members, and track progress with status boards." },
        { icon: "Flag", title: "Milestone Tracking", description: "Set milestones for key project phases and track deadlines." },
        { icon: "FileText", title: "Document Management", description: "Upload and organize project files securely in one place." },
        { icon: "Box", title: "Deliverables", description: "Submit deliverables to clients and get sign-off directly." },
        { icon: "Ticket", title: "Support & Tickets", description: "Raise support tickets and track responses within your project." },
        { icon: "Receipt", title: "Invoice Management", description: "Create invoices, track payments, and manage billing per project." }
      ]
    },
    about: {
      title: "About",
      badge: "Built for Every Role",
      subtitle: "Three separate dashboards so everyone sees exactly what they need.",
      card1_title: "Administrator",
      card1_description: "Manage users, configure settings, view reports, and oversee all projects and billing.",
      card1_icon: "ShieldCheck",
      card2_title: "Team Member",
      card2_description: "View assigned tasks, update progress, upload documents, and coordinate with team and clients.",
      card2_icon: "UserCheck",
      card3_title: "Client",
      card3_description: "Track project progress, download deliverables, pay invoices, and raise support tickets.",
      card3_icon: "User"
    },
    workflow: {
      title: "Workflow",
      badge: "How It Works",
      subtitle: "A simple five-step process from onboarding a client to closing out a project.",
      list: [
        { step: "1", title: "Client Creation", description: "Add a new client and their portal login is set up automatically." },
        { step: "2", title: "Project Creation", description: "Set up the project with a name, timeline, and description." },
        { step: "3", title: "Team & Tasks", description: "Assign staff to the project and break work into tasks." },
        { step: "4", title: "Updates & Milestones", description: "Mark milestones as complete and keep the client updated." },
        { step: "5", title: "Review & Closure", description: "Submit deliverables, send the final invoice, and close the project." }
      ]
    }
  },
  contact: {
    hero: {
      badge: "Contact Us",
      title: "Let's streamline your client and project operations.",
      description: "Reach out for workspace setup, administrator onboarding, technical assistance, or integration support. The portal connects administrators, team members, and clients on a single unified platform."
    },
    columns: {
      col1_title: "Workspace & Onboarding",
      col1_description: "Speak with us about system configuration, administrator setup, and platform deployment plans.",
      col1_icon: "Building",
      col2_title: "Technical Support",
      col2_description: "Get assistance with role-based privileges, document management, or client portal queries.",
      col2_icon: "ShieldCheck",
      col3_title: "Fast response",
      col3_description: "Reach out through email, phone, or WhatsApp and our team will follow up promptly.",
      col3_icon: "CheckCircle2"
    },
    sidebar: {
      title: "Ready to optimize your project management workflow?",
      description: "Speak with our team about portal configuration, role assignment, or secure collaboration features.",
      emails: "info@saiitservices.com (General), sales@saiitservices.com (Sales)",
      phones: "+91-9429694298, +91-9041914601",
      whatsapp_label: "Message us on WhatsApp",
      address: "10009 Mount Tabor Road, City, Odessa Missouri, United States",
      social_twitter: "https://twitter.com/saiitservices",
      social_facebook: "https://facebook.com/saiitservices",
      social_linkedin: "https://linkedin.com/company/saiitservices",
      social_instagram: "https://instagram.com/saiitservices"
    }
  },
  "help-center": {
    general: {
      title: "Help Center",
      subtitle: "Find guides, FAQs, and resources to help you manage your projects, clients, and workflows."
    },
    guidance: {
      title: "Role-Based Guidance",
      description: "The Platform provides tailored workspaces with specific roles. Select your guide to get started:",
      cards: [
        { icon: "ShieldCheck", title: "Administrator", description: "Learn how to onboard clients, set up projects, deploy workflows, assign tasks, and manage invoicing." },
        { icon: "Users", title: "Team Member", description: "Learn to track assigned tasks, post progress updates, upload deliverables, and coordinate with clients." },
        { icon: "Briefcase", title: "Client Portal", description: "Learn to monitor project milestones, download shared documents, review deliverables, and submit tickets." }
      ]
    },
    faqs: {
      title: "Frequently Asked Questions",
      list: [
        { q: "How do I onboard a new client to the portal?", a: "Administrators can navigate to the Client Management module in their dashboard, click the 'Create Client' button, and enter the client's profile details. The system will automatically configure credentials and prepare their personalized client portal workspace." },
        { q: "How can team members upload project deliverables?", a: "Team members can open their assigned projects from their workspace dashboard, navigate to the 'Deliverables' module, and click 'Upload Deliverable'. Uploading a file registers the history log and prompts the client for review and approval." },
        { q: "How do clients raise support requests?", a: "Clients can log in to their dashboard and access the 'Support & Tickets' module from the sidebar. Clicking 'Create Ticket' opens a query form where they can state the priority level and description. Team members are notified instantly to resolve the ticket." },
        { q: "Can I manage invoice billing details directly?", a: "Yes. Administrators have full billing access inside the Invoice Management module to generate invoices, view billing histories, monitor client payment updates, and export logs." },
        { q: "How does the system ensure document security?", a: "The Document Management module employs strict Role-Based Access Control (RBAC) and version tracking. Administrators can customize access permissions so that only authorized team members or clients can download specific files." }
      ]
    },
    cta: {
      title: "Need More Assistance?",
      description: "If you couldn't find the answers you need in our guides or FAQs, our technical support team is here to help. Get in touch to report issues, suggest enhancements, or get setup help.",
      buttonText: "Contact Support",
      email: "info@saiitservices.com"
    }
  },
  "privacy-policy": {
    general: {
      title: "Privacy Policy",
      effectiveDate: "Effective Date: February 12, 2026",
      intro: "The Project Management Portal is owned and operated by SAI IT SERVICES LLC, which acts as the data controller of your personal data.\n\nThis Privacy Policy explains how we collect, use, process, store, and protect your information when you access or use our Project Management Portal (the \"Platform\"). By using the Platform, you agree to the collection and use of information in accordance with this Policy. We encourage you to read this document carefully before using the Platform.",
      sections: [
        {
          title: "1. Our Commitment to Privacy",
          body: "We respect your privacy and are committed to protecting your personal data. We adopt appropriate technical and organizational measures to ensure the confidentiality, integrity, and security of the information we collect and process."
        },
        {
          title: "2. Personal Information We Collect",
          body: "We collect information automatically when you navigate the Platform and also when you voluntarily input details to register or use portal workflows.",
          boxes: [
            {
              type: "primary",
              title: "a) Information Collected Automatically",
              intro: "When you access the Platform, we may automatically collect certain information about your device and usage, including but not limited to:",
              items: [
                "Browser type and version",
                "IP address",
                "Time zone and location data (approximate)",
                "Device information",
                "Cookies and similar tracking technologies",
                "Pages visited, features used, and interaction data"
              ],
              note: "This data is collectively referred to as \"Device Information.\""
            },
            {
              type: "neutral",
              title: "b) Information You Provide to Us",
              intro: "When you register for or use the Platform, we may collect personal information that you voluntarily provide, including:",
              items: [
                "Full name",
                "Email address",
                "Phone number",
                "Organization / Company name",
                "Login credentials",
                "Assigned projects and roles",
                "Tasks, milestone progress, and support ticket details",
                "Payment or billing information (if applicable)"
              ],
              note: "This information is collected to provide access to Platform features and to fulfill contractual and operational requirements."
            }
          ]
        },
        {
          title: "3. Why We Process Your Data",
          body: "We process your personal data only when necessary and for legitimate purposes, including:\n\n- Creating and managing user accounts\n- Providing access to projects, tasks, invoices, and deliverables\n- Tracking project progress, milestones, and task completion\n- Communicating important updates and notifications\n- Improving platform performance and user experience\n- Detecting and preventing fraud, abuse, or security issues\n- Complying with legal and regulatory obligations\n\nAutomatically collected information is primarily used for analytics, security monitoring, and system optimization and does not directly identify individual users."
        },
        {
          title: "4. Optional Information",
          body: "",
          boxes: [
            {
              type: "neutral",
              title: "Information Disclosure Policy",
              intro: "You may choose not to provide certain personal information. However, doing so may limit your ability to access specific Platform features such as task updates, milestones tracking, invoices, document management, or ticketing support.\n\nIf you are unsure which information is mandatory, you may contact us at info@saiitservices.com.",
              items: []
            }
          ]
        },
        {
          title: "5. Your Rights",
          body: "If you are a resident of the European Economic Area (EEA), you have the following rights regarding your personal data:\n\n- The right to be informed\n- The right of access\n- The right to rectification\n- The right to erasure (right to be forgotten)\n- The right to restrict processing\n- The right to data portability\n- The right to object to processing\n- Rights related to automated decision-making and profiling\n\nTo exercise any of these rights, please contact us using the details provided below."
        },
        {
          title: "6. International Data Transfers",
          body: "Your information may be transferred to and processed in countries outside of your country of residence, including the United States and other jurisdictions where our infrastructure or service providers are located. We ensure that such transfers comply with applicable data protection laws."
        },
        {
          title: "7. Links to Third-Party Websites",
          body: "The Platform may contain links to third-party websites or tools. We are not responsible for the privacy practices or content of such external sites. We recommend reviewing the privacy policies of any third-party services you access."
        },
        {
          title: "8. Information Security",
          body: "",
          boxes: [
            {
              type: "primary",
              title: "Security Safeguards",
              intro: "We store personal data on secure servers and implement reasonable administrative, technical, and physical safeguards to protect against unauthorized access, alteration, disclosure, or destruction of data.\n\nHowever, please note that no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.",
              items: []
            }
          ]
        },
        {
          title: "9. Legal Disclosure",
          body: "We may disclose your personal information if required to do so by law or in good faith belief that such action is necessary to:\n\n- Comply with legal obligations\n- Protect and defend our rights or property\n- Protect the safety of users or the public\n- Investigate fraud or security issues\n- Respond to lawful government requests"
        },
        {
          title: "10. Contact Information",
          body: "",
          boxes: [
            {
              type: "primary",
              title: "Contact Details",
              intro: "If you have any questions about this Privacy Policy, your personal data, or your rights, please contact us:\n\nEmail: info@saiitservices.com\nCompany: SAI IT SERVICES LLC\n\nThis Privacy Policy may be updated from time to time. Any changes will be reflected on this page with an updated effective date.",
              items: []
            }
          ]
        }
      ]
    }
  },
  "terms-of-service": {
    general: {
      title: "Terms of Service",
      effectiveDate: "Last Updated: February 12, 2026",
      intro: "Welcome to the Project Management Portal. These Terms of Service (\"Terms\") govern your access to and use of the platform operated by SAI IT SERVICES LLC.\n\nBy accessing or using the Platform, you agree to comply with and be bound by these Terms. If you do not agree with any part of these Terms, you must not access or use the Platform.",
      sections: [
        {
          title: "1. Definitions",
          body: "",
          boxes: [
            {
              type: "neutral",
              title: "Standard Terminology",
              intro: "The following terms are used in these Terms of Service:",
              items: [
                "\"Company\", \"We\", \"Us\", or \"Our\" refers to SAI IT SERVICES LLC.",
                "\"Platform\", \"Portal\", or \"Website\" refers to the Project Management Portal and its associated subdomains.",
                "\"User\", \"You\", or \"Your\" refers to any individual accessing or using the Platform, including Administrators, Team Members, and Clients."
              ]
            }
          ]
        },
        {
          title: "2. Cookies",
          body: "",
          boxes: [
            {
              type: "neutral",
              title: "Cookie Agreement",
              intro: "The Platform uses cookies to enhance user experience, support secure authentication sessions, and ensure proper portal functionality. By accessing the Platform, you agree to our use of required cookies.",
              note: "Cookies are small text files stored on your device. Required cookies are essential for core Platform security and user authentication (such as keeping you logged in). You may manage optional cookies through your profile or browser settings."
            }
          ]
        },
        {
          title: "3. License and Intellectual Property",
          body: "",
          boxes: [
            {
              type: "primary",
              title: "Intellectual Property Policy",
              intro: "Unless otherwise stated, SAI IT SERVICES LLC and/or its licensors own all intellectual property rights for the content, design, software, and systems available on the Platform. All rights are reserved.\n\nYou are granted a limited, non-exclusive, non-transferable license to access and use the Platform for personal, collaborative, or business operations under your registered account role.\n\nYou must not:",
              items: [
                "Copy, modify, or republish Platform code or templates",
                "Sell, rent, lease, or sub-license access credentials to the Platform",
                "Exploit Platform resources or reverse-engineer its systems",
                "Redistribute proprietary data or deliverables without authorization"
              ],
              note: "This Agreement becomes effective on the date you first access the Platform."
            }
          ]
        },
        {
          title: "4. User Content and Comments",
          body: "Users may post comments, replies, or task logs in dedicated sections of the Platform. You represent and warrant that your content does not violate any third-party intellectual property or privacy rights, and does not contain defamatory, offensive, or unlawful material.\n\nWe reserve the right to monitor and remove any user-contributed content that is deemed inappropriate or in breach of these Terms."
        },
        {
          title: "5. Invoices and Financial Transactions",
          body: "Billing and payment services are provided per project milestone. You agree to settle invoices by the specified due date using approved automatic payment gateways or by uploading manual proof of transfer. The Company reserves the right to suspend platform access for accounts with outstanding unpaid invoices."
        },
        {
          title: "6. Limitation of Liability",
          body: "The Platform is provided on an \"as is\" and \"as available\" basis without warranties of any kind. In no event shall SAI IT SERVICES LLC be liable for any direct, indirect, incidental, special, or consequential damages arising out of your use or inability to use the Platform, even if advised of the possibility of such damages."
        },
        {
          title: "7. Governing Law",
          body: "These Terms of Service shall be governed by and construed in accordance with the laws of the State of Missouri, United States, without regard to its conflict of law principles. Any legal actions or disputes arising from these Terms shall be resolved in courts located in Missouri."
        }
      ]
    }
  },
  "cookie-policy": {
    general: {
      title: "Cookie Policy",
      effectiveDate: "Last Updated: February 10, 2026",
      intro: "This page explains how SAI IT SERVICES LLC uses cookies and similar technologies to keep the Project Management Portal secure, reliable, and easy to use.",
      sections: [
        {
          title: "What Are Cookies?",
          body: "Cookies are small text files that are placed on your device when you visit our Platform. They help us provide you with a better experience by remembering your preferences, keeping you logged in securely, and analyzing how you use our platform to make enhancements."
        },
        {
          title: "Types of Cookies We Use",
          body: "",
          boxes: [
            {
              type: "primary",
              title: "Essential Cookies",
              intro: "These cookies are necessary for the Platform to function properly. They enable core functionality such as:",
              items: [
                "User authentication and login sessions",
                "Security, CSRF protection, and fraud prevention",
                "Maintaining your dashboard state during your session",
                "Remembering items in active forms and portals"
              ],
              note: "Note: These cookies cannot be disabled as they are essential for the Platform to work."
            },
            {
              type: "neutral",
              title: "Functional Cookies",
              intro: "These cookies allow us to remember your choices and provide enhanced, personalized features:",
              items: [
                "Remembering active view filters and project search query states",
                "Saving your display preferences (such as dark mode toggles)",
                "Remembering active menu choices and navigation panel sizes",
                "Storing your cookie consent settings"
              ]
            },
            {
              type: "primary",
              title: "Analytics Cookies",
              intro: "These cookies help us understand how you interact with our Platform:",
              items: [
                "Tracking page navigation patterns and active workflows",
                "Measuring milestone completion rates",
                "Identifying popular pages and features",
                "Analyzing portal activity logs and traffic distribution"
              ]
            }
          ]
        },
        {
          title: "Managing Cookie Preferences",
          body: "You can control and manage cookies through your web browser settings. Most browsers allow you to block or delete cookies, but doing so may prevent you from logging in or using important features of the portal.\n\nFor more details or to adjust cookie consents, contact us at info@saiitservices.com."
        }
      ]
    }
  },
  global: {
    navigation: {
      list: [
        { label: "Home", link: "/" },
        { label: "Features", link: "/#features" },
        { label: "About", link: "/#about" },
        { label: "Workflow", link: "/#workflow" },
        { label: "Contact", link: "/contact" }
      ]
    },
    footer: {
      copyright: "© 2026 SAI IT SERVICES LLC. All rights reserved.",
      description: "Secure, reliable, and scalable Client Relationship Portal & Project Management Portal."
    }
  }
};

export function CmsSettingsProvider({ children }) {
  const [cmsData, setCmsData] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refreshCms = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cms/content`);
      if (!res.ok) throw new Error("Network response error");
      const json = await res.json();
      
      if (json.success && json.data) {
        // Deep merge API response with DEFAULTS so any missing keys fallback gracefully
        const merged = { ...DEFAULTS };
        
        Object.keys(json.data).forEach(pageKey => {
          if (!merged[pageKey]) merged[pageKey] = {};
          
          Object.keys(json.data[pageKey]).forEach(sectionKey => {
            if (!merged[pageKey][sectionKey]) merged[pageKey][sectionKey] = {};
            
            Object.keys(json.data[pageKey][sectionKey]).forEach(k => {
              merged[pageKey][sectionKey][k] = json.data[pageKey][sectionKey][k];
            });
          });
        });

        setCmsData(merged);
      }
    } catch (err) {
      console.warn("Could not fetch CMS settings, using local defaults:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCms();

    // Listen to custom event when save happens in the admin tab (to sync dynamic landing views instantly)
    const handleCmsUpdate = () => refreshCms();
    window.addEventListener("cmsContentUpdated", handleCmsUpdate);
    return () => {
      window.removeEventListener("cmsContentUpdated", handleCmsUpdate);
    };
  }, [refreshCms]);

  return (
    <CmsSettingsContext.Provider value={{ cmsData, loading, refreshCms }}>
      {children}
    </CmsSettingsContext.Provider>
  );
}

export function useCmsSettings() {
  const ctx = useContext(CmsSettingsContext);
  return ctx ? ctx.cmsData : DEFAULTS;
}

export function useRefreshCmsSettings() {
  const ctx = useContext(CmsSettingsContext);
  return ctx ? ctx.refreshCms : async () => {};
}
