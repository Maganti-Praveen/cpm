// Controller logic for managing project operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { logActivity } from "../utils/activityLogger.js";
import { dispatch } from "../services/email/emailDispatcher.js";
import { createNotification } from "../utils/notifier.js";
import { getCache, setCache, invalidateProjects } from "../utils/cache.js";

// Fetch projects with optional filters
export const getProjects = async (req, res) => {
  try {
    const { status, client, search } = req.query;

    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    const userRole = req.user.role;
    const userId = req.user.id;
    const cacheKey = `projects:list:${userRole}:${userId}:${status || "all"}:${client || "all"}:${search || ""}:p${page || "all"}:l${limit || "all"}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    let whereClause = {};

    // Enforce role-based restrictions
    if (req.user.role === "CLIENT") {
      whereClause.clientId = req.user.id;
    } else if (req.user.role === "STAFF") {
      whereClause.team = {
        some: { id: req.user.id }
      };
    }

    if (status && status !== "All Statuses" && status !== "All") {
      whereClause.status = status;
    }

    if (client && client !== "All Clients" && client !== "All") {
      whereClause.client = {
        company: client
      };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { client: { fullName: { contains: search, mode: "insensitive" } } },
        { client: { company: { contains: search, mode: "insensitive" } } }
      ];
    }

    let projects;
    let total;

    if (page && limit) {
      const skip = (page - 1) * limit;
      [projects, total] = await Promise.all([
        prisma.project.findMany({
          where: whereClause,
          include: {
            client: true,
            team: true,
            deliverableItems: true,
            milestones: {
              orderBy: { date: "asc" }
            }
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.project.count({ where: whereClause })
      ]);
    } else {
      projects = await prisma.project.findMany({
        where: whereClause,
        include: {
          client: true,
          team: true,
          deliverableItems: true,
          milestones: {
            orderBy: { date: "asc" }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      total = projects.length;
    }

    const mappedProjects = projects.map((p) => ({
      ...p,
      deliverables: p.deliverableItems.map((d) => d.name)
    }));

    const responseData = {
      success: true,
      data: mappedProjects,
      pagination: {
        page: page || 1,
        limit: limit || total,
        total,
        pages: limit ? Math.ceil(total / limit) : 1
      }
    };

    await setCache(cacheKey, responseData, 3600);

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch single project details with all related sub-entities
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    // Parse the project ID param to verify it is a valid number format
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID format" });
    }
    const project = await prisma.project.findUnique({
      where: { id: numericId },
      include: {
        client: true,
        team: true,
        tasks: {
          include: {
            assignee: true,
            attachments: true,
            comments: {
              include: { user: true }
            }
          }
        },
        milestones: {
          orderBy: { date: "asc" }
        },
        documents: {
          include: { uploadedBy: true },
          orderBy: { createdAt: "desc" }
        },
        deliverableItems: true,
        activities: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Role-based Access Control (RBAC) check
    if (req.user.role === "CLIENT" && project.clientId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (req.user.role === "STAFF") {
      const isMember = project.team.some(m => m.id === req.user.id);
      if (!isMember) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    const mappedProject = {
      ...project,
      deliverables: project.deliverableItems?.map(d => d.name) || []
    };

    res.status(200).json({
      success: true,
      data: mappedProject
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: Only Admin users can create projects." });
    }

    const { name, description, clientId, progress, status, startDate, dueDate, deliverables, teamIds, createGroupChat } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Project name is required." });
    }

    if (clientId) {
      const parsedClientId = parseInt(clientId);
      if (isNaN(parsedClientId)) {
        return res.status(400).json({ success: false, message: "Invalid client ID format." });
      }
      const clientUser = await prisma.user.findUnique({
        where: { id: parsedClientId }
      });
      if (!clientUser) {
        return res.status(400).json({ success: false, message: "Specified client does not exist." });
      }
    }

    if (teamIds && Array.isArray(teamIds) && teamIds.length > 0) {
      const parsedTeamIds = teamIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (parsedTeamIds.length !== teamIds.length) {
        return res.status(400).json({ success: false, message: "Invalid team member ID format." });
      }
      const teamUsers = await prisma.user.findMany({
        where: { id: { in: parsedTeamIds } }
      });
      if (teamUsers.length !== parsedTeamIds.length) {
        return res.status(400).json({ success: false, message: "One or more specified team members do not exist." });
      }
    }

    if (startDate && dueDate) {
      const start = new Date(startDate);
      const due = new Date(dueDate);
      if (due < start) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date."
        });
      }
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description,
        clientId: clientId ? parseInt(clientId) : null,
        progress: progress ? parseInt(progress) : 0,
        status: status || "Planning",
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        deliverableItems: {
          create: (deliverables || []).map((name) => ({
            name,
            size: "0 KB",
            status: "Awaiting Submission",
            stage: "Planning"
          }))
        },
        team: teamIds ? {
          connect: teamIds.map(id => ({ id: parseInt(id) }))
        } : undefined
      },
      include: {
        client: true,
        team: true
      }
    });

    await logActivity(project.id, `Project created: ${project.name}`, `Assigned to client ${project.client?.fullName || "N/A"}`, "create");

    if (project.clientId) {
      await createNotification({
        userId: project.clientId,
        title: "New Project Assigned",
        message: `You have been assigned to project: "${project.name}"`,
        type: "project",
        linkId: project.id
      });
    }

    if (project.team && project.team.length > 0) {
      for (const member of project.team) {
        await createNotification({
          userId: member.id,
          title: "New Project Assignment",
          message: `You have been assigned to project: "${project.name}"`,
          type: "project",
          linkId: project.id
        });
      }
    }

    // Email team members about project assignment
    if (project.team && project.team.length > 0) {
      try {
        for (const member of project.team) {
          dispatch("project-assigned", member.email, {
            recipientName: member.fullName,
            projectName: project.name,
            projectDescription: project.description || "No description",
            startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : "TBD",
            dueDate: project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "TBD",
            projectStatus: project.status || "Planning",
            clientName: project.client?.fullName || "N/A",
            loginUrl: process.env.FRONTEND_URL || "http://localhost:5173",
            companyName: "Sai IT Services",
          });
        }
      } catch (_) { /* email failure is non-critical */ }
    }

    // Email client about project assignment/creation
    if (project.client && project.client.email) {
      try {
        dispatch("project-assigned", project.client.email, {
          recipientName: project.client.fullName,
          projectName: project.name,
          projectDescription: project.description || "No description",
          startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : "TBD",
          dueDate: project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "TBD",
          projectStatus: project.status || "Planning",
          clientName: project.client?.fullName || "N/A",
          loginUrl: process.env.FRONTEND_URL || "http://localhost:5173",
          companyName: "Sai IT Services",
        });
      } catch (err) {
        console.error("[ProjectAssignedEmail] Failed to notify client:", err.message);
      }
    }

    // Automatic group chat creation
    if (createGroupChat) {
      try {
        const participantIds = new Set();
        participantIds.add(req.user.id);
        if (project.clientId) {
          participantIds.add(project.clientId);
        }
        if (project.team && project.team.length > 0) {
          project.team.forEach(m => participantIds.add(m.id));
        }

        const convo = await prisma.conversation.create({
          data: {
            type: "GROUP",
            name: `${project.name} [Project Group]`,
            creatorId: req.user.id,
            adminIds: [req.user.id],
            participants: {
              connect: Array.from(participantIds).map(id => ({ id }))
            }
          }
        });

        await prisma.message.create({
          data: {
            conversationId: convo.id,
            senderId: req.user.id,
            content: `__SYSTEM__:Welcome to the "${project.name}" group chat! This group was automatically created for project collaboration.`,
            isRead: false,
            isSystem: true
          }
        });
        console.log(`[Project Group] Automatically created group conversation for project: ${project.name} with id ${convo.id}`);
      } catch (groupError) {
        console.error("Failed to automatically create project group chat:", groupError.message || groupError);
      }
    }

    await invalidateProjects();

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ success: false, message: "Invalid client ID or foreign key constraint failed." });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: Only Admin users can update projects." });
    }

    const { id } = req.params;
    // Parse the project ID param to verify it is a valid number format
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID format" });
    }

    const existingProject = await prisma.project.findUnique({
      where: { id: numericId },
      include: { team: true }
    });

    if (!existingProject) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const { name, description, clientId, progress, status, startDate, dueDate, deliverables, teamIds } = req.body;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return res.status(400).json({ success: false, message: "Project name cannot be empty." });
    }

    if (clientId !== undefined && clientId !== null) {
      const parsedClientId = parseInt(clientId);
      if (isNaN(parsedClientId)) {
        return res.status(400).json({ success: false, message: "Invalid client ID format." });
      }
      const clientUser = await prisma.user.findUnique({
        where: { id: parsedClientId }
      });
      if (!clientUser) {
        return res.status(400).json({ success: false, message: "Specified client does not exist." });
      }
    }

    if (teamIds !== undefined && teamIds !== null && Array.isArray(teamIds) && teamIds.length > 0) {
      const parsedTeamIds = teamIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (parsedTeamIds.length !== teamIds.length) {
        return res.status(400).json({ success: false, message: "Invalid team member ID format." });
      }
      const teamUsers = await prisma.user.findMany({
        where: { id: { in: parsedTeamIds } }
      });
      if (teamUsers.length !== parsedTeamIds.length) {
        return res.status(400).json({ success: false, message: "One or more specified team members do not exist." });
      }
    }

    const resolvedStartDate = startDate !== undefined ? (startDate ? new Date(startDate) : null) : existingProject.startDate;
    const resolvedDueDate = dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingProject.dueDate;

    if (resolvedStartDate && resolvedDueDate) {
      const start = new Date(resolvedStartDate);
      const due = new Date(resolvedDueDate);
      if (due < start) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date."
        });
      }
    }

    if (deliverables !== undefined) {
      const existingDeliverables = await prisma.deliverable.findMany({
        where: { projectId: numericId }
      });
      const existingNames = existingDeliverables.map(d => d.name);
      
      const toCreate = deliverables.filter(name => !existingNames.includes(name));
      const toDelete = existingDeliverables.filter(d => !deliverables.includes(d.name) && !d.url);
      
      if (toDelete.length > 0) {
        await prisma.deliverable.deleteMany({
          where: { id: { in: toDelete.map(d => d.id) } }
        });
      }
      
      if (toCreate.length > 0) {
        await prisma.deliverable.createMany({
          data: toCreate.map(name => ({
            name,
            size: "0 KB",
            status: "Awaiting Submission",
            stage: "Planning",
            projectId: numericId
          }))
        });
      }
    }

    const project = await prisma.project.update({
      where: { id: numericId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description,
        clientId: clientId ? parseInt(clientId) : undefined,
        progress: progress !== undefined ? parseInt(progress) : undefined,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        team: teamIds ? {
          set: teamIds.map(id => ({ id: parseInt(id) }))
        } : undefined
      },
      include: {
        client: true,
        team: true,
        deliverableItems: true
      }
    });

    // Calculate actual diff for the audit log
    if (existingProject) {
      const auditDetails = {};
      if (name !== undefined && name !== existingProject.name) auditDetails.name = name;
      if (description !== undefined && description !== existingProject.description) auditDetails.description = description;
      if (clientId !== undefined && (clientId ? parseInt(clientId) : null) !== existingProject.clientId) {
        auditDetails.clientId = clientId ? parseInt(clientId) : null;
      }
      if (progress !== undefined && parseInt(progress) !== existingProject.progress) {
        auditDetails.progress = parseInt(progress);
      }
      if (status !== undefined && status !== existingProject.status) auditDetails.status = status;
      if (startDate !== undefined) {
        const d1 = startDate ? new Date(startDate).getTime() : 0;
        const d2 = existingProject.startDate ? new Date(existingProject.startDate).getTime() : 0;
        if (d1 !== d2) auditDetails.startDate = startDate;
      }
      if (dueDate !== undefined) {
        const d1 = dueDate ? new Date(dueDate).getTime() : 0;
        const d2 = existingProject.dueDate ? new Date(existingProject.dueDate).getTime() : 0;
        if (d1 !== d2) auditDetails.dueDate = dueDate;
      }
      if (deliverables !== undefined && JSON.stringify(deliverables) !== JSON.stringify(existingProject.deliverables)) {
        auditDetails.deliverables = deliverables;
      }
      if (teamIds !== undefined) {
        const existingTeamIds = existingProject.team.map(t => t.id).sort();
        const newTeamIds = teamIds.map(t => parseInt(t)).sort();
        if (JSON.stringify(existingTeamIds) !== JSON.stringify(newTeamIds)) {
          auditDetails.teamIds = teamIds;
        }
      }
      req.auditDetails = auditDetails;
    }

    if (clientId && project.clientId) {
      await createNotification({
        userId: project.clientId,
        title: "Project Update",
        message: `Project: "${project.name}" details have been updated`,
        type: "project",
        linkId: project.id
      });
    }

    if (teamIds && project.team && project.team.length > 0) {
      for (const member of project.team) {
        await createNotification({
          userId: member.id,
          title: "Project Assignment Update",
          message: `Your assignment for project: "${project.name}" has been updated`,
          type: "project",
          linkId: project.id
        });
      }
    }

    await invalidateProjects();

    const mappedProject = {
      ...project,
      deliverables: project.deliverableItems?.map(d => d.name) || []
    };

    res.status(200).json({
      success: true,
      data: mappedProject
    });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ success: false, message: "Invalid client ID or foreign key constraint failed." });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: Only Admin users can delete projects." });
    }

    const { id } = req.params;
    // Parse the project ID param to verify it is a valid number format
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID format" });
    }

    const existingProject = await prisma.project.findUnique({
      where: { id: numericId }
    });

    if (!existingProject) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    await prisma.project.delete({
      where: { id: numericId }
    });

    await invalidateProjects();

    res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// Bulk delete projects
export const bulkDeleteProjects = async (req, res) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: Only Admin users can delete projects." });
    }

    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No project IDs provided" });
    }

    const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));

    if (numericIds.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid project IDs" });
    }

    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // 1. Set projectId to null in Invoices to avoid foreign key constraints
      await tx.invoice.updateMany({
        where: { projectId: { in: numericIds } },
        data: { projectId: null }
      });

      // 2. Delete Projects (which cascades tasks, milestones, deliverables, documents, activities)
      await tx.project.deleteMany({
        where: { id: { in: numericIds } }
      });
    }, { maxWait: 20000, timeout: 30000 });

    // Logging bulk deletion activity globally
    req.auditDetails = {
      description: `Admin bulk deleted ${numericIds.length} projects`,
      projectIds: numericIds
    };

    await invalidateProjects();

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${numericIds.length} projects`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk update projects
export const bulkUpdateProjects = async (req, res) => {
  try {
    const { ids, status, progress, startDate, dueDate } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No project IDs provided" });
    }

    const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (numericIds.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid project IDs" });
    }

    // Build data payload for fields that are provided
    const data = {};
    if (status !== undefined) data.status = status;
    if (progress !== undefined) data.progress = parseInt(progress);
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    // Fetch projects first to know names, clientIds, and team members for activities/notifications
    const projectsToUpdate = await prisma.project.findMany({
      where: { id: { in: numericIds } },
      include: { team: true }
    });

    await prisma.$transaction(async (tx) => {
      // 1. Perform bulk update
      await tx.project.updateMany({
        where: { id: { in: numericIds } },
        data
      });

      // 2. Log activity and notify for each project
      const fieldsUpdated = Object.keys(data).join(", ");
      for (const project of projectsToUpdate) {
        // Create project activity logs
        await tx.activity.create({
          data: {
            projectId: project.id,
            title: "Project Bulk Updated",
            description: `Updated fields: ${fieldsUpdated}`,
            type: "info"
          }
        });

        // Notifications for Client
        if (project.clientId) {
          await tx.notification.create({
            data: {
              userId: project.clientId,
              title: "Project Updated (Bulk)",
              message: `Project "${project.name}" details were updated by admin.`,
              type: "project",
              linkId: project.id
            }
          });
        }

        // Notifications for Team Members
        if (project.team && project.team.length > 0) {
          for (const member of project.team) {
            await tx.notification.create({
              data: {
                userId: member.id,
                title: "Project Assignment Update",
                message: `Project "${project.name}" details were updated by admin.`,
                type: "project",
                linkId: project.id
              }
            });
          }
        }
      }
    }, { maxWait: 20000, timeout: 30000 });

    // Capture audit details for global audit trail
    req.auditDetails = {
      description: `Admin bulk updated ${projectsToUpdate.length} projects`,
      fieldsUpdated: Object.keys(data),
      projectIds: numericIds
    };

    await invalidateProjects();

    res.status(200).json({
      success: true,
      message: `Successfully updated ${projectsToUpdate.length} projects`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


