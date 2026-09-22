import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { getDefaultTemplates } from "../services/email/templateParser.js";

async function main() {
  console.log("Starting initial database seed for Sai IT Services...\n");

  // 1. SiteSettings
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
    console.log("[OK] Seeded SiteSettings");
  } else {
    console.log("[SKIP] SiteSettings already exists");
  }

  // 2. SecuritySettings
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
    console.log("[OK] Seeded SecuritySettings");
  } else {
    console.log("[SKIP] SecuritySettings already exists");
  }

  // 3. EmailSettings
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
    console.log("[OK] Seeded EmailSettings");
  } else {
    console.log("[SKIP] EmailSettings already exists");
  }

  // 4. EmailTemplates
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
    console.log(`[OK] Seeded ${defaultTemplates.length} EmailTemplates`);
  } else {
    console.log(`[SKIP] EmailTemplates already exist (${templateCount})`);
  }

  // 5. Themes (Presets)
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
    console.log(`[OK] Seeded ${themes.length} Themes`);
  } else {
    console.log(`[SKIP] Themes already exist (${themeCount})`);
  }

  // 6. PaymentGateways
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
          accountNumber: "123456789012",
          ifsc: "SBIN0001234",
          bankName: "State Bank of India",
          upiId: "saiitservices@upi",
          instructions: "Please transfer the invoice amount using NEFT/RTGS/IMPS or UPI, then submit your transaction reference number for verification."
        }
      }
    ];
    for (const gw of gateways) {
      await prisma.paymentGateway.create({ data: gw });
    }
    console.log(`[OK] Seeded ${gateways.length} PaymentGateways`);
  } else {
    console.log(`[SKIP] PaymentGateways already exist (${gwCount})`);
  }

  // 7. CMS Services
  const existingServices = await prisma.cmsService.count();
  if (existingServices === 0) {
    const services = [
      { slug: "cloud-transformation", title: "Cloud Migration & Infrastructure Transformation", subtitle: "Accelerate your enterprise cloud journey with resilient, scalable multi-cloud architectures.", icon: "Cloud", shortDescription: "End-to-end cloud strategy, cloud-native application modernization, AWS/Azure/GCP migration, and automated DevOps pipelines.", fullDescription: "We help global enterprises modernize legacy systems, migrate workload infrastructure to multi-cloud environments, and build robust cloud-native applications.", keyCapabilities: ["Multi-Cloud Architecture & Migration", "DevOps & Infrastructure-as-Code", "Cloud Cost Optimization & FinOps", "Microservices & Serverless", "Disaster Recovery & High Availability"], techStack: ["AWS", "Azure", "GCP", "Kubernetes", "Docker", "Terraform", "Jenkins"], benefits: ["45% reduction in cloud costs", "99.99% uptime SLAs", "3x faster release cycles", "ISO/SOC 2 compliance"], isActive: true },
      { slug: "custom-software-engineering", title: "Enterprise Software Engineering & Modernization", subtitle: "Custom scalable software systems tailored for complex business demands.", icon: "Code2", shortDescription: "Building mission-critical enterprise software, API integrations, web & mobile applications.", fullDescription: "Our software engineering division crafts custom web applications, enterprise mobile solutions, and system middleware using Agile delivery and domain-driven design.", keyCapabilities: ["Custom Web & Enterprise Apps", "API Ecosystem & Integration", "Legacy System Modernization", "Mobile Development", "Automated Testing & QA"], techStack: ["React", "Node.js", "Python", "Java Spring Boot", "PostgreSQL", "GraphQL", "TypeScript"], benefits: ["Tailored to your workflows", "Millions of concurrent requests", "ERP & CRM integration", "Comprehensive test coverage"], isActive: true },
      { slug: "ai-automation-analytics", title: "AI, Machine Learning & Business Intelligence", subtitle: "Harness enterprise data, generative AI, and predictive analytics.", icon: "Cpu", shortDescription: "Transform raw data into strategic foresight with custom AI/ML models, LLM integrations, and BI dashboards.", fullDescription: "We design predictive analytics engines, train domain-specific AI models, integrate LLMs, and build interactive real-time BI dashboards.", keyCapabilities: ["Generative AI & LLM Integration", "Predictive Analytics", "RPA Workflows", "Data Lake Engineering", "BI Dashboards"], techStack: ["Python", "PyTorch", "OpenAI", "Apache Spark", "Snowflake", "PowerBI", "Databricks"], benefits: ["70% task automation", "Real-time dashboards", "Predictive retention modeling", "AI governance safeguards"], isActive: true },
      { slug: "cybersecurity-compliance", title: "Cybersecurity, Managed Defense & Compliance", subtitle: "Protect your enterprise with proactive threat intelligence and zero-trust security.", icon: "ShieldCheck", shortDescription: "SOC monitoring, vulnerability assessments, Zero Trust architecture, and ISO/GDPR compliance.", fullDescription: "Our cybersecurity engineers defend enterprise infrastructure against cyber attacks with penetration testing, Zero Trust IAM, and compliance enforcement.", keyCapabilities: ["Zero Trust Architecture", "VAPT", "24/7 SOC Support", "SOC 2/ISO/GDPR Compliance", "DLP & Incident Response"], techStack: ["CrowdStrike", "Splunk", "Okta", "Palo Alto", "Wireshark", "Vault", "Burp Suite"], benefits: ["24/7 threat detection", "Zero Trust protection", "100% audit readiness", "Mitigated breach risk"], isActive: true },
      { slug: "digital-consulting-transformation", title: "Digital Transformation & IT Strategy Consulting", subtitle: "Strategic technology advisory for long-term business growth.", icon: "TrendingUp", shortDescription: "Expert technology roadmapping, enterprise architecture design, and digital strategy consulting.", fullDescription: "We collaborate with C-suite executives to reshape IT strategies, audit legacy infrastructure, and execute high-ROI digital transformation initiatives.", keyCapabilities: ["Enterprise Architecture Design", "Digital Transformation Strategy", "Legacy Audit & Modernization", "IT Governance", "Vendor Evaluation"], techStack: ["TOGAF", "ITIL v4", "Jira Enterprise", "Lucidchart", "Confluence", "Miro"], benefits: ["3-5 year transformation roadmap", "Eliminated technical debt", "Faster time-to-market", "Maximized ROI"], isActive: true },
      { slug: "managed-it-devops", title: "Managed IT Services & Infrastructure Support", subtitle: "Round-the-clock infrastructure monitoring and proactive IT operations.", icon: "Server", shortDescription: "24/7 proactive monitoring, server maintenance, helpdesk support, and SLA-backed operations.", fullDescription: "We deliver 24/7 proactive server monitoring, database tuning, rapid incident resolution, and dedicated enterprise support engineers.", keyCapabilities: ["24/7 Server Monitoring", "Database Admin & Optimization", "Incident Management", "DevOps & SRE", "Enterprise Helpdesk"], techStack: ["Prometheus", "Grafana", "Datadog", "PagerDuty", "Linux", "Kubernetes", "AWS CloudWatch"], benefits: ["99.99% uptime SLAs", "24/7 systems engineers", "Reduced IT overhead", "Predictable costs"], isActive: true }
    ];
    await prisma.cmsService.createMany({ data: services });
    console.log(`[OK] Seeded ${services.length} CMS Services`);
  } else {
    console.log(`[SKIP] CMS Services already exist (${existingServices})`);
  }

  // 8. CMS Careers
  const existingCareers = await prisma.cmsCareer.count();
  if (existingCareers === 0) {
    const careers = [
      { title: "Senior Cloud Solution Architect", department: "Cloud Infrastructure", location: "Remote / Hybrid", type: "Full-time", experience: "7+ years", description: "Lead complex multi-cloud architecture design and migration strategies.", responsibilities: ["Architect multi-cloud infrastructures", "Design Terraform IaC blueprints", "Define cloud governance policies", "Mentor cloud engineers"], requirements: ["CS degree or equivalent", "AWS/Azure SA certification", "5+ years Kubernetes/Docker/Terraform", "Zero-trust networking knowledge"], contactEmail: "careers@saiitservices.com", active: true },
      { title: "Lead Full-Stack Software Engineer", department: "Software Engineering", location: "Odessa, MO / Hybrid", type: "Full-time", experience: "5+ years", description: "Drive design and building of mission-critical web applications and APIs.", responsibilities: ["Develop scalable React/Node.js apps", "Design REST & GraphQL microservices", "Establish CI/CD testing pipelines", "Conduct code reviews"], requirements: ["React, Node.js, PostgreSQL proficiency", "API design & auth experience", "Docker & cloud deployment", "Agile collaboration skills"], contactEmail: "careers@saiitservices.com", active: true },
      { title: "AI & Machine Learning Specialist", department: "Data & AI", location: "Remote", type: "Full-time", experience: "4+ years", description: "Design, train, and deploy generative AI and predictive models.", responsibilities: ["Develop NLP/LLM/ML models", "Build data pipelines with Python/Spark", "Deploy ML models with MLOps", "Build AI-powered features"], requirements: ["MS/BS in Data Science or CS", "PyTorch/TensorFlow proficiency", "OpenAI/LangChain experience", "MLOps knowledge"], contactEmail: "careers@saiitservices.com", active: true },
      { title: "Senior Cybersecurity Analyst", department: "Security Operations", location: "Remote / Hybrid", type: "Full-time", experience: "5+ years", description: "Protect enterprise environments with VAPT, SOC monitoring, and IAM.", responsibilities: ["Monitor SIEM alerts", "Perform vulnerability scans", "Ensure SOC 2/ISO/GDPR compliance", "Conduct security training"], requirements: ["CISSP/CISM/CEH certification", "Splunk/CrowdStrike/Okta expertise", "Network security knowledge", "Incident escalation experience"], contactEmail: "careers@saiitservices.com", active: true },
      { title: "DevOps & SRE Engineer", department: "Cloud & Operations", location: "Odessa, MO / Remote", type: "Full-time", experience: "3+ years", description: "Ensure continuous uptime and automated deployments across environments.", responsibilities: ["Manage Kubernetes clusters & CI/CD", "Implement Prometheus/Grafana monitoring", "Automate with Terraform/Ansible", "On-call rotation & RCA"], requirements: ["Linux admin & shell scripting", "Kubernetes/Helm/Docker proficiency", "AWS or Azure experience", "SLA management commitment"], contactEmail: "careers@saiitservices.com", active: true }
    ];
    await prisma.cmsCareer.createMany({ data: careers });
    console.log(`[OK] Seeded ${careers.length} CMS Careers`);
  } else {
    console.log(`[SKIP] CMS Careers already exist (${existingCareers})`);
  }

  // 9. CMS About Us
  const existingAbout = await prisma.cmsAboutUs.count();
  if (existingAbout === 0) {
    await prisma.cmsAboutUs.create({
      data: {
        id: 1,
        title: "Empowering Enterprises Through Digital Innovation",
        subtitle: "We are a global IT services and technology consultancy delivering transformative software, cloud infrastructure, AI solutions, and cybersecurity to forward-thinking enterprises.",
        mission: "To empower organizations worldwide by engineering reliable, scalable, and intelligent technology solutions that drive sustainable growth and operational excellence.",
        vision: "To be the most trusted global technology partner for enterprise digital transformation, recognized for technical mastery, uncompromised quality, and business impact.",
        coreValues: [
          { title: "Technical Excellence", description: "Rigorous engineering standards and state-of-the-art architecture.", icon: "Award" },
          { title: "Client-Centric Commitment", description: "Solutions engineered around measurable business goals and partnership.", icon: "Users" },
          { title: "Security & Compliance First", description: "Zero-trust architecture and strict regulatory compliance built-in.", icon: "ShieldCheck" },
          { title: "Continuous Innovation", description: "Pioneering AI, cloud, and DevOps to keep clients ahead." }
        ],
        milestones: [
          { year: "2018", title: "Company Founded", description: "Established as an IT consultancy for enterprise cloud migrations." },
          { year: "2020", title: "Global Expansion", description: "Expanded to multi-region cloud services and international delivery." },
          { year: "2022", title: "AI & DevOps CoE", description: "Launched Generative AI, MLOps, and SRE practices." },
          { year: "2024", title: "SOC 2 & ISO Certified", description: "Achieved global compliance accreditations." },
          { year: "2026", title: "250+ Enterprise Projects", description: "Delivered scalable solutions for Fortune 500 enterprises." }
        ],
        stats: [
          { label: "Global Projects Delivered", value: "250+" },
          { label: "Client Retention Rate", value: "98%" },
          { label: "Countries Served", value: "35+" },
          { label: "Dedicated IT Experts", value: "150+" }
        ]
      }
    });
    console.log("[OK] Seeded CMS About Us data");
  } else {
    console.log(`[SKIP] CMS About Us already exists`);
  }

  // 10. CMS Case Studies
  const existingCS = await prisma.cmsCaseStudy.count();
  if (existingCS === 0) {
    const caseStudies = [
      { slug: "cloud-migration-fintech-platform", title: "Cloud Migration for FinTech Trading Platform", subtitle: "Complete AWS migration with zero downtime", clientName: "Global FinTech Corp", industry: "Banking & Finance", icon: "Cloud", shortDescription: "Migrated legacy trading infrastructure to AWS with zero-downtime and 40% cost reduction.", fullDescription: "Full-scale cloud migration for a global FinTech company. Containerized 120+ microservices, implemented blue-green deployments, and built real-time data pipelines.", keyResults: ["99.99% uptime", "40% cost reduction", "3x faster deployments", "500K+ daily transactions", "SOC 2 compliant"], technologiesUsed: ["AWS", "Kubernetes", "Terraform", "Docker", "PostgreSQL", "Redis", "Kafka"], isActive: true },
      { slug: "ai-powered-healthcare-diagnostics", title: "AI-Powered Diagnostic Platform for Healthcare", subtitle: "ML pipeline processing 50K+ medical images daily", clientName: "MedVision Health Systems", industry: "Healthcare & Life Sciences", icon: "Cpu", shortDescription: "AI diagnostic platform processing 50K+ medical images daily with 96% accuracy across 200+ clinics.", fullDescription: "End-to-end ML pipeline for 200+ clinics. Ingests medical imaging data, runs deep learning inference, and delivers diagnostic reports with HIPAA compliance.", keyResults: ["96% accuracy", "60% faster turnaround", "200+ clinics", "50K+ daily images", "HIPAA compliant"], technologiesUsed: ["Python", "PyTorch", "TensorFlow", "AWS SageMaker", "FastAPI", "React", "PostgreSQL"], isActive: true },
      { slug: "enterprise-erp-modernization", title: "Enterprise ERP Modernization for Manufacturing", subtitle: "Legacy SAP modernization for 15,000+ employees", clientName: "Atlas Manufacturing Group", industry: "Manufacturing & Industrial", icon: "Building", shortDescription: "Modernized a 15-year-old ERP into cloud-native platform with real-time analytics and mobile access.", fullDescription: "Complete digital transformation of legacy ERP. Phased migration of supply chain, inventory, finance, and HR modules into microservices architecture.", keyResults: ["35% supply chain improvement", "15,000+ users", "12 countries", "$2.5M annual savings", "Real-time analytics"], technologiesUsed: ["React", "Node.js", "Java Spring Boot", "PostgreSQL", "Kubernetes", "Azure", "Power BI"], isActive: true },
      { slug: "zero-trust-security-framework", title: "Zero-Trust Security for Government Agency", subtitle: "Cybersecurity overhaul protecting 50,000+ endpoints", clientName: "Federal Services Agency", industry: "Government & Public Sector", icon: "ShieldCheck", shortDescription: "Zero-trust security architecture protecting 50,000+ endpoints, reducing incidents by 85%.", fullDescription: "Comprehensive zero-trust framework with identity-centric controls, micro-segmentation, SIEM/SOAR integration, and automated incident response playbooks.", keyResults: ["85% fewer incidents", "FedRAMP authorized", "50,000+ endpoints", "15-min detection time", "Zero breaches"], technologiesUsed: ["Splunk", "CrowdStrike", "Palo Alto", "Azure AD", "Terraform", "Python", "Ansible"], isActive: true }
    ];
    await prisma.cmsCaseStudy.createMany({ data: caseStudies });
    console.log(`[OK] Seeded ${caseStudies.length} CMS Case Studies`);
  } else {
    console.log(`[SKIP] CMS Case Studies already exist (${existingCS})`);
  }

  // 11. Initial Users (Admin, Staff, Client)
  console.log("Seeding initial users...");

  // Password hashes
  const adminPasswordHash = await bcrypt.hash("SaiAdmin@2026!", 10);
  const staffPasswordHash = await bcrypt.hash("SaiStaff@2026!", 10);
  const clientPasswordHash = await bcrypt.hash("SaiClient@2026!", 10);

  // 11a. Super Admin
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@saiitservices.com" },
    update: {
      fullName: "Sai Administrator",
      role: "ADMIN",
      isSuperAdmin: true,
      isActive: true,
      status: "Active",
      isFirstLogin: false
    },
    create: {
      email: "admin@saiitservices.com",
      password: adminPasswordHash,
      fullName: "Sai Administrator",
      role: "ADMIN",
      isSuperAdmin: true,
      isActive: true,
      status: "Active",
      isFirstLogin: false,
      company: "Sai IT Services",
      phone: "+1-800-555-0199"
    }
  });
  console.log(`[OK] Seeded Super Admin: ${adminUser.email}`);

  // 11b. Staff Member
  const staffUser = await prisma.user.upsert({
    where: { email: "staff@saiitservices.com" },
    update: {
      fullName: "Praveen Sai",
      role: "STAFF",
      isActive: true,
      status: "Active",
      isFirstLogin: false
    },
    create: {
      email: "staff@saiitservices.com",
      password: staffPasswordHash,
      fullName: "Praveen Sai",
      role: "STAFF",
      isActive: true,
      status: "Active",
      isFirstLogin: false,
      company: "Sai IT Services",
      phone: "+1-800-555-0155"
    }
  });
  console.log(`[OK] Seeded Staff Member: ${staffUser.email}`);

  // 11c. Client Account
  const clientUser = await prisma.user.upsert({
    where: { email: "client@saiitservices.com" },
    update: {
      fullName: "Enterprise Client",
      role: "CLIENT",
      company: "Acme Global Solutions",
      isActive: true,
      status: "Active",
      isFirstLogin: false
    },
    create: {
      email: "client@saiitservices.com",
      password: clientPasswordHash,
      fullName: "Enterprise Client",
      role: "CLIENT",
      company: "Acme Global Solutions",
      phone: "+1-800-555-0120",
      isActive: true,
      status: "Active",
      isFirstLogin: false
    }
  });
  console.log(`[OK] Seeded Client: ${clientUser.email}`);

  // 12. Seed Sample Project, Tasks, Milestones, Invoice, and Ticket
  const existingProjectCount = await prisma.project.count();
  if (existingProjectCount === 0) {
    const project = await prisma.project.create({
      data: {
        name: "Enterprise Multi-Cloud Modernization",
        description: "Migration and modernization of mission-critical corporate workloads to AWS and Azure with zero-downtime cutover and automated CI/CD.",
        progress: 45,
        status: "In Progress",
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        clientId: clientUser.id,
        team: {
          connect: [{ id: staffUser.id }]
        }
      }
    });

    // Milestones
    await prisma.milestone.createMany({
      data: [
        {
          title: "Infrastructure & Security Discovery",
          status: "Completed",
          progress: 100,
          projectId: project.id,
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        },
        {
          title: "Terraform IaC & VPC Deployment",
          status: "In Progress",
          progress: 50,
          projectId: project.id,
          date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        },
        {
          title: "Workload Migration & Cutover",
          status: "Planning",
          progress: 0,
          projectId: project.id,
          date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    // Deliverables
    await prisma.deliverable.createMany({
      data: [
        {
          name: "Cloud Architecture Blueprint",
          size: "4.2 MB",
          status: "Approved",
          stage: "Planning",
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          url: "/documents/sample-blueprint.pdf",
          projectId: project.id
        },
        {
          name: "Terraform Modules Code Review",
          size: "1.8 MB",
          status: "Awaiting Review",
          stage: "Execution",
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          url: "/documents/sample-terraform.zip",
          projectId: project.id
        }
      ]
    });

    // Tasks
    await prisma.task.createMany({
      data: [
        {
          taskKey: "TSK-101",
          title: "Configure AWS Multi-AZ VPC and Direct Connect",
          description: "Establish isolated production subnets, routing tables, and internet gateway with NAT gateways across three availability zones.",
          projectId: project.id,
          assigneeId: staffUser.id,
          priority: "High",
          status: "Done",
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          taskKey: "TSK-102",
          title: "Deploy Kubernetes Cluster with Terraform",
          description: "Provision managed EKS cluster with autoscaling node groups and IAM OIDC provider integration.",
          projectId: project.id,
          assigneeId: staffUser.id,
          priority: "High",
          status: "In Progress",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          taskKey: "TSK-103",
          title: "Setup Prometheus & Grafana Monitoring",
          description: "Configure cluster metrics scraping and set up alert rules with enterprise SLA dashboards.",
          projectId: project.id,
          assigneeId: staffUser.id,
          priority: "Medium",
          status: "To Do",
          dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    // Invoice
    await prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2026-001",
        amount: 150000,
        status: "Pending",
        paymentStatus: "UNPAID",
        paymentMethod: "manual",
        clientId: clientUser.id,
        projectId: project.id,
        description: "Milestone 1: Cloud Architecture Blueprint and Infrastructure Discovery",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    });

    // Support Ticket
    await prisma.ticket.create({
      data: {
        subject: "Staging VPC Peering Connectivity Inquiry",
        category: "Cloud Infrastructure",
        priority: "Medium",
        status: "Open",
        description: "We are validating cross-account peering connectivity between the staging VPC and our legacy data center. Please confirm routing table entries.",
        clientId: clientUser.id
      }
    });

    // Activity Log
    await prisma.activity.create({
      data: {
        title: "Project Initialized",
        description: "Enterprise Multi-Cloud Modernization initialized with architecture milestones and team assignment.",
        type: "project",
        projectId: project.id
      }
    });

    console.log("[OK] Seeded Project, Milestones, Deliverables, Tasks, Invoice, and Ticket");
  } else {
    console.log(`[SKIP] Projects already exist (${existingProjectCount})`);
  }

  console.log("\nDatabase seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
