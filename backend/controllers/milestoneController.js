// Controller logic for managing milestone operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { logActivity } from "../utils/activityLogger.js";
import { getCache, setCache, invalidateMilestones } from "../utils/cache.js";

// update project progress — uses milestones if any exist, otherwise falls back to task completion %
const updateProjectProgress = async (projectId) => {
  const pid = parseInt(projectId);
  const milestones = await prisma.milestone.findMany({ where: { projectId: pid } });

  if (milestones.length > 0) {
    const totalProgress = milestones.reduce((sum, m) => sum + m.progress, 0);
    const avgProgress = Math.round(totalProgress / milestones.length);
    await prisma.project.update({ where: { id: pid }, data: { progress: avgProgress } });
    return;
  }

  // no milestones — calculate from tasks
  const tasks = await prisma.task.findMany({ where: { projectId: pid }, select: { status: true } });
  if (tasks.length === 0) return;
  const done = tasks.filter(t => t.status === "Completed" || t.status === "Done").length;
  const pct = Math.round((done / tasks.length) * 100);
  await prisma.project.update({ where: { id: pid }, data: { progress: pct } });
};

// Get milestones — optionally filtered by projectId, status, search
export const getMilestones = async (req, res) => {
  try {
    const { projectId, status, search } = req.query;

    const cacheKey = `milestones:list:${projectId || 'all'}:${status || 'all'}:${search || ''}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    let whereClause = {};

    if (projectId) {
      whereClause.projectId = parseInt(projectId);
    }

    if (status && status !== "All" && status !== "All Statuses") {
      whereClause.status = status;
    }

    if (search) {
      whereClause.title = { contains: search, mode: "insensitive" };
    }

    const milestones = await prisma.milestone.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: { date: "asc" }
    });

    await setCache(cacheKey, milestones, 3600);

    res.status(200).json({
      success: true,
      data: milestones
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a milestone
export const createMilestone = async (req, res) => {
  try {
    const { title, date, status, progress, projectId } = req.body;

    const milestone = await prisma.milestone.create({
      data: {
        title,
        date: date ? new Date(date) : null,
        status: status || "Planning",
        progress: progress ? parseInt(progress) : 0,
        projectId: parseInt(projectId)
      }
    });

    await updateProjectProgress(projectId);

    await logActivity(projectId, `Milestone Created: ${milestone.title}`, `Status: ${milestone.status}`, "info");

    await invalidateMilestones();

    res.status(201).json({
      success: true,
      data: milestone
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a milestone
export const updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, status, progress } = req.body;

    const currentMilestone = await prisma.milestone.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentMilestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    const milestone = await prisma.milestone.update({
      where: { id: parseInt(id) },
      data: {
        title,
        date: date ? new Date(date) : undefined,
        status,
        progress: progress !== undefined ? parseInt(progress) : undefined
      }
    });

    // Calculate actual diff for the audit log
    if (currentMilestone) {
      const auditDetails = {};
      if (title !== undefined && title !== currentMilestone.title) auditDetails.title = title;
      if (status !== undefined && status !== currentMilestone.status) auditDetails.status = status;
      if (progress !== undefined && parseInt(progress) !== currentMilestone.progress) {
        auditDetails.progress = parseInt(progress);
      }
      if (date !== undefined) {
        const d1 = date ? new Date(date).getTime() : 0;
        const d2 = currentMilestone.date ? new Date(currentMilestone.date).getTime() : 0;
        if (d1 !== d2) auditDetails.date = date;
      }
      req.auditDetails = auditDetails;
    }

    await updateProjectProgress(currentMilestone.projectId);

    await logActivity(currentMilestone.projectId, `Milestone Updated: ${milestone.title}`, `Status: ${milestone.status} (${milestone.progress}%)`, "info");

    await invalidateMilestones();

    res.status(200).json({
      success: true,
      data: milestone
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a milestone
export const deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;

    const currentMilestone = await prisma.milestone.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentMilestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    await prisma.milestone.delete({
      where: { id: parseInt(id) }
    });

    await updateProjectProgress(currentMilestone.projectId);

    await logActivity(currentMilestone.projectId, `Milestone Deleted: ${currentMilestone.title}`, ``, "info");

    await invalidateMilestones();

    res.status(200).json({
      success: true,
      message: "Milestone deleted successfully"
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const bulkDeleteMilestones = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No milestone IDs provided" });
    }

    const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (numericIds.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid milestone IDs" });
    }

    // Fetch milestones first to find projectIds for progress update
    const milestonesToDelete = await prisma.milestone.findMany({
      where: { id: { in: numericIds } },
      select: { projectId: true, title: true }
    });

    if (milestonesToDelete.length === 0) {
      return res.status(404).json({ success: false, message: "No milestones found to delete" });
    }

    // Delete milestones in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.milestone.deleteMany({
        where: { id: { in: numericIds } }
      });
    }, { maxWait: 20000, timeout: 30000 });

    // Recalculate progress for all unique affected projects
    const affectedProjectIds = Array.from(new Set(milestonesToDelete.map(m => m.projectId)));
    for (const projectId of affectedProjectIds) {
      await updateProjectProgress(projectId);
      await logActivity(projectId, "Milestones Bulk Deleted", `${milestonesToDelete.filter(m => m.projectId === projectId).length} milestones deleted by Admin`, "info");
    }

    await invalidateMilestones();

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${numericIds.length} milestones.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
