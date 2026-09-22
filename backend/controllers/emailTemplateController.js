// Controller logic for managing emailTemplate operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { getDefaultTemplates, parseTemplate } from "../services/email/templateParser.js";
import { getCache, setCache, deleteCache, invalidateEmailTemplates } from "../utils/cache.js";

// fetch all email templates
export const getTemplates = async (req, res) => {
  try {
    const cacheKey = "email:templates:list";
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    await setCache(cacheKey, templates, 3600);

    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// fetch a single email template by id
export const getTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `email:templates:details:${id}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id: Number(id) },
    });
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });

    await setCache(cacheKey, template, 3600);

    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// create a new email template
export const createTemplate = async (req, res) => {
  try {
    const { name, slug, subject, htmlContent, variables, type, isActive } = req.body;
    const template = await prisma.emailTemplate.create({
      data: {
        name,
        slug,
        subject,
        htmlContent,
        variables: variables || [],
        type,
        isActive: isActive ?? true,
      },
    });
    await invalidateEmailTemplates();

    res.status(201).json({ success: true, message: "Template created", data: template });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ success: false, message: "A template with this slug already exists" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// update an existing template
export const updateTemplate = async (req, res) => {
  try {
    const { name, slug, subject, htmlContent, variables, type, isActive } = req.body;
    const template = await prisma.emailTemplate.update({
      where: { id: Number(req.params.id) },
      data: { name, slug, subject, htmlContent, variables, type, isActive },
    });
    await invalidateEmailTemplates(req.params.id);

    res.json({ success: true, message: "Template updated", data: template });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// delete a template
export const deleteTemplate = async (req, res) => {
  try {
    await prisma.emailTemplate.delete({ where: { id: Number(req.params.id) } });
    await invalidateEmailTemplates(req.params.id);

    res.json({ success: true, message: "Template deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// preview template with dummy/sample variables
export const previewTemplate = async (req, res) => {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });

    const sampleVars = {};
    for (const v of template.variables) {
      sampleVars[v] = req.body.variables?.[v] || `[${v}]`;
    }

    const settings = await prisma.emailSettings.findUnique({
      where: { singletonId: 1 },
    });

    const { subject, html } = parseTemplate(template.htmlContent, template.subject, sampleVars, template.slug, settings);
    res.json({ success: true, data: { subject, html } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// seed default email templates into database
export const seedDefaultTemplates = async (req, res) => {
  try {
    const defaults = getDefaultTemplates();
    let created = 0;

    for (const tpl of defaults) {
      const existing = await prisma.emailTemplate.findUnique({ where: { slug: tpl.slug } });
      if (!existing) {
        await prisma.emailTemplate.create({ data: tpl });
        created++;
      } else {
        const content = (existing.htmlContent || "").trim();
        const isOldHtml = content.startsWith("<") || content.toLowerCase().includes("<html>") || content.toLowerCase().includes("<!doctype");
        const isOldProject = tpl.slug === "project-assigned" && (content.includes("Project Name:") || content.includes("Client:"));
        const isOldTask = tpl.slug === "task-assigned" && (content.includes("Task ID:") || content.includes("Task:"));
        const isOldAck = tpl.slug === "contact-acknowledgment" && content.includes("Subject: {{subject}}");

        if (isOldHtml || isOldProject || isOldTask || isOldAck) {
          await prisma.emailTemplate.update({
            where: { slug: tpl.slug },
            data: {
              htmlContent: tpl.htmlContent,
              subject: tpl.subject,
              variables: tpl.variables,
            },
          });
          created++;
        }
      }
    }

    await invalidateEmailTemplates();

    res.json({ success: true, message: `Seeded ${created} default templates`, data: { created } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
