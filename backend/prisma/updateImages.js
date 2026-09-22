import "dotenv/config";
import prisma from "../config/prisma.js";

async function updateDbImages() {
  console.log("Updating database records to use local high-quality images...");

  // Update Case Studies
  const caseStudies = [
    { slug: "cloud-migration-fintech-platform", image: "/images/project-fintech.png" },
    { slug: "ai-powered-healthcare-diagnostics", image: "/images/project-healthcare.png" },
    { slug: "enterprise-erp-modernization", image: "/images/project-erp.png" },
    { slug: "zero-trust-security-framework", image: "/images/project-security.png" }
  ];

  for (const cs of caseStudies) {
    await prisma.cmsCaseStudy.updateMany({
      where: { slug: cs.slug },
      data: { image: cs.image }
    });
  }

  // Update Services
  const services = [
    { slug: "cloud-transformation", image: "/images/project-fintech.png" },
    { slug: "custom-software-engineering", image: "/images/project-fintech.png" },
    { slug: "ai-automation-analytics", image: "/images/project-healthcare.png" },
    { slug: "cybersecurity-compliance", image: "/images/project-security.png" },
    { slug: "digital-consulting-transformation", image: "/images/project-erp.png" },
    { slug: "managed-it-devops", image: "/images/project-erp.png" }
  ];

  for (const srv of services) {
    await prisma.cmsService.updateMany({
      where: { slug: srv.slug },
      data: { image: srv.image }
    });
  }

  console.log("Database records successfully updated to local paths!");
  await prisma.$disconnect();
}

updateDbImages();
