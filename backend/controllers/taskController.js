import prisma from "../config/prisma.js";
import { logActivity } from "../utils/activityLogger.js";
import { dispatch } from "../services/email/emailDispatcher.js";
import { createNotification } from "../utils/notifier.js";
import { getCache, setCache, invalidateTasks } from "../utils/cache.js";

/**
 * Recalculates the project progress percentage based on the completion of its tasks.
 * Note: Progress recalculation is skipped if the project has milestones, as milestoneController handles it.
 * 
 * @param {number|string} projectId - The unique identifier of the project.
 * @returns {Promise<void>}
 */
const refreshProjectProgress = async (projectId) => {
  const pid = parseInt(projectId);
  // Check if the project has milestones; if so, progress calculation is deferred to milestones
  const milestoneCount = await prisma.milestone.count({ where: { projectId: pid } });
  if (milestoneCount > 0) return; // milestones handle progress in milestoneController
  
  // Fetch only status of all tasks associated with this project
  const tasks = await prisma.task.findMany({ where: { projectId: pid }, select: { status: true } });
  if (tasks.length === 0) return;
  
  // Calculate completion percentage based on tasks marked Completed or Done
  const done = tasks.filter(t => t.status === "Completed" || t.status === "Done").length;
  const pct = Math.round((done / tasks.length) * 100);
  
  // Update the project's progress field
  await prisma.project.update({ where: { id: pid }, data: { progress: pct } });
};

/**
 * Retrieves a list of tasks based on filters, search query, role constraints, and pagination.
 * Utilizes caching to optimize response times.
 * 
 * @route GET /api/tasks
 * @param {Object} req - Express request object.
 * @param {Object} req.query - Query parameters.
 * @param {string} [req.query.status] - Filter by task status.
 * @param {string} [req.query.priority] - Filter by priority level.
 * @param {string} [req.query.project] - Filter by project name.
 * @param {string} [req.query.assignee] - Filter by assignee's full name.
 * @param {string} [req.query.search] - Search text matching title, description, or taskKey.
 * @param {string|number} [req.query.page] - Page number for pagination.
 * @param {string|number} [req.query.limit] - Limit of tasks per page.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export const getTasks = async (req, res) => {
  try {
    const { status, priority, project, assignee, search } = req.query;

    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    const cacheKey = `tasks:list:${req.user.role}:${req.user.id}:${status || 'All'}:${priority || 'All'}:${project || 'All'}:${assignee || 'All'}:${search || ''}:p${page || 'all'}:l${limit || 'all'}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    let andConditions = [];

    // Enforce role-based restrictions
    if (req.user.role === "STAFF") {
      andConditions.push({ assigneeId: req.user.id });
    } else if (req.user.role === "CLIENT") {
      andConditions.push({
        project: {
          clientId: req.user.id
        }
      });
    }

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { taskKey: { contains: search, mode: "insensitive" } }
        ]
      });
    }

    if (status && status !== "All Statuses" && status !== "All") {
      andConditions.push({ status: status });
    }

    if (priority && priority !== "All Priorities" && priority !== "All") {
      andConditions.push({ priority: priority });
    }

    if (project && project !== "All Projects" && project !== "All") {
      andConditions.push({
        project: {
          name: project
        }
      });
    }

    if (assignee && assignee !== "Anyone" && assignee !== "All") {
      andConditions.push({
        assignee: {
          fullName: assignee
        }
      });
    }

    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

    let tasks;
    let total;

    if (page && limit) {
      const skip = (page - 1) * limit;
      [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where: whereClause,
          include: {
            project: true,
            assignee: true,
            attachments: true,
            comments: {
              include: { user: true }
            }
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.task.count({ where: whereClause })
      ]);
    } else {
      tasks = await prisma.task.findMany({
        where: whereClause,
        include: {
          project: true,
          assignee: true,
          attachments: true,
          comments: {
            include: { user: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      total = tasks.length;
    }

    // Format tasks to match frontend layout structure
    const formatted = tasks.map((t) => {
      return {
        id: t.id,
        taskKey: t.taskKey,
        title: t.title,
        project: t.project.name,
        assignee: {
          name: t.assignee ? t.assignee.fullName : "Unassigned",
          avatarColor: t.assignee ? (t.assignee.role === "CLIENT" ? "#0284C7" : "#059669") : "#94A3B8",
          initials: t.assignee ? t.assignee.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "??",
          avatar: t.assignee ? t.assignee.avatar : null
        },
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate ? t.dueDate.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }) : "No Due Date",
        description: t.description || "",
        attachments: t.attachments.map(att => ({ name: att.name, size: att.size })),
        comments: t.comments.map(c => ({
          id: c.id,
          text: c.text,
          user: c.user.fullName,
          date: c.createdAt.toLocaleDateString()
        }))
      };
    });

    const responseData = {
      success: true,
      data: formatted,
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

/**
 * Creates a new task, generating a unique task key prefix (e.g., TSK-001) with auto-retry on collision.
 * Logs the action, sends notifications/emails to assignee, recalculates project progress, and invalidates cache.
 * 
 * @route POST /api/tasks
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Task details.
 * @param {string} req.body.title - Title of the task.
 * @param {string} [req.body.description] - Detailed description.
 * @param {number|string} req.body.projectId - Associated project ID.
 * @param {number|string} [req.body.assigneeId] - Assignee user ID (must be a STAFF member).
 * @param {string} [req.body.priority="Medium"] - Priority level.
 * @param {string} [req.body.status="To Do"] - Initial task status.
 * @param {string} [req.body.dueDate] - Optional task deadline.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assigneeId, priority, status, dueDate } = req.body;

    if (assigneeId) {
      const user = await prisma.user.findUnique({ where: { id: parseInt(assigneeId) } });
      if (!user || user.role === "CLIENT") {
        return res.status(400).json({ success: false, message: "Tasks can only be assigned to staff members." });
      }
    }

    let attempts = 0;
    let task = null;

    while (attempts < 5) {
      try {
        const lastTask = await prisma.task.findFirst({
          where: { taskKey: { startsWith: "TSK-" } },
          orderBy: { id: "desc" },
          select: { taskKey: true }
        });

        let nextNum = 1;
        if (lastTask) {
          const numPart = parseInt(lastTask.taskKey.replace("TSK-", ""), 10);
          if (!isNaN(numPart)) {
            nextNum = numPart + 1;
          }
        }
        const taskKey = `TSK-${String(nextNum).padStart(3, '0')}`;

        task = await prisma.task.create({
          data: {
            taskKey,
            title,
            description,
            projectId: parseInt(projectId),
            assigneeId: assigneeId ? parseInt(assigneeId) : null,
            priority: priority || "Medium",
            status: status || "To Do",
            dueDate: dueDate ? new Date(dueDate) : null
          },
          include: {
            project: true,
            assignee: true
          }
        });
        break; // Success!
      } catch (error) {
        if (error.code === "P2002" && error.meta?.target?.includes("taskKey")) {
          attempts++;
          continue;
        }
        throw error;
      }
    }

    if (!task) {
      return res.status(500).json({ success: false, message: "Failed to generate a unique task key. Please try again." });
    }

    await logActivity(task.projectId, `Task Created: ${task.title}`, `Assigned to: ${task.assignee ? task.assignee.fullName : 'Unassigned'}`, "task");

    if (task.assigneeId) {
      await createNotification({
        userId: task.assigneeId,
        title: "New Task Assigned",
        message: `Task assigned: "${task.title}" under project "${task.project?.name || 'N/A'}"`,
        type: "task",
        linkId: task.projectId
      });
    }

    // Email team member about task assignment
    if (task.assignee && task.assignee.email) {
      try {
        dispatch("task-assigned", task.assignee.email, {
          recipientName: task.assignee.fullName,
          taskTitle: task.title,
          taskKey: task.taskKey,
          taskDescription: task.description || "No description",
          priority: task.priority,
          status: task.status,
          dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "TBD",
          projectName: task.project?.name || "N/A",
          loginUrl: process.env.FRONTEND_URL || "http://localhost:5173",
          companyName: "Sai IT Services",
        });
      } catch (err) {
        console.error("[TaskAssignedEmail] Dispatch failed:", err.message);
      }
    }

    await refreshProjectProgress(task.projectId);
    await invalidateTasks();

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Posts a new comment to a specific task. Invalidates task cache to ensure comments update.
 * 
 * @route POST /api/tasks/:taskId/comments
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Route parameters.
 * @param {string} req.params.taskId - Target task ID.
 * @param {Object} req.body - Comment details.
 * @param {string} req.body.text - Content of the comment.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    const userId = req.user.id; // From auth middleware

    const comment = await prisma.comment.create({
      data: {
        text,
        taskId: parseInt(taskId),
        userId: parseInt(userId)
      },
      include: {
        user: true
      }
    });

    await invalidateTasks();

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Updates an existing task's fields. Computes audit details, logs activity,
 * handles notifications/emails if assignee is updated, and refreshes project progress.
 * 
 * @route PUT /api/tasks/:id
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Route parameters.
 * @param {string} req.params.id - Unique ID of the task to update.
 * @param {Object} req.body - Fields to update.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    // Parse the task ID param to verify it is a valid number format
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({ success: false, message: "Invalid task ID format" });
    }
    const { title, description, priority, status, dueDate, assigneeId } = req.body;

    if (assigneeId) {
      const user = await prisma.user.findUnique({ where: { id: parseInt(assigneeId) } });
      if (!user || user.role === "CLIENT") {
        return res.status(400).json({ success: false, message: "Tasks can only be assigned to staff members." });
      }
    }

    const existingTask = await prisma.task.findUnique({
      where: { id: numericId }
    });

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId ? parseInt(assigneeId) : null;
    }

    const task = await prisma.task.update({
      where: { id: numericId },
      data: updateData,
      include: {
        project: true,
        assignee: true
      }
    });

    // Calculate actual diff for the audit log
    if (existingTask) {
      const auditDetails = {};
      if (title !== undefined && title !== existingTask.title) auditDetails.title = title;
      if (description !== undefined && description !== existingTask.description) auditDetails.description = description;
      if (priority !== undefined && priority !== existingTask.priority) auditDetails.priority = priority;
      if (status !== undefined && status !== existingTask.status) auditDetails.status = status;
      if (dueDate !== undefined) {
        const d1 = dueDate ? new Date(dueDate).getTime() : 0;
        const d2 = existingTask.dueDate ? new Date(existingTask.dueDate).getTime() : 0;
        if (d1 !== d2) auditDetails.dueDate = dueDate;
      }
      if (assigneeId !== undefined && (assigneeId ? parseInt(assigneeId) : null) !== existingTask.assigneeId) {
        auditDetails.assigneeId = assigneeId ? parseInt(assigneeId) : null;
      }
      req.auditDetails = auditDetails;
    }

    await logActivity(task.projectId, `Task Updated: ${task.title}`, `Status: ${task.status}`, task.status === 'Completed' || task.status === 'Done' ? 'completed' : 'task');

    if (task.assigneeId && task.assigneeId !== existingTask?.assigneeId) {
      await createNotification({
        userId: task.assigneeId,
        title: "New Task Assigned",
        message: `Task assigned: "${task.title}" under project "${task.project?.name || 'N/A'}"`,
        type: "task",
        linkId: task.projectId
      });
    }

    // Email team member if assignee changed
    if (task.assigneeId && task.assigneeId !== existingTask?.assigneeId && task.assignee && task.assignee.email) {
      try {
        dispatch("task-assigned", task.assignee.email, {
          recipientName: task.assignee.fullName,
          taskTitle: task.title,
          taskKey: task.taskKey,
          taskDescription: task.description || "No description",
          priority: task.priority,
          status: task.status,
          dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "TBD",
          projectName: task.project?.name || "N/A",
          loginUrl: process.env.FRONTEND_URL || "http://localhost:5173",
          companyName: "Sai IT Services",
        });
      } catch (err) {
        console.error("[TaskAssignedEmail] Dispatch failed:", err.message);
      }
    }

    await refreshProjectProgress(task.projectId);
    await invalidateTasks();

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Deletes a single task. Recalculates project progress and invalidates task cache.
 * 
 * @route DELETE /api/tasks/:id
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Route parameters.
 * @param {string} req.params.id - Unique ID of the task to delete.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    // Parse the task ID param to verify it is a valid number format
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({ success: false, message: "Invalid task ID format" });
    }

    const taskToDelete = await prisma.task.findUnique({ where: { id: numericId } });
    if (!taskToDelete) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await prisma.task.delete({
      where: { id: numericId }
    });

    await refreshProjectProgress(taskToDelete.projectId);
    await invalidateTasks();

    res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Deletes multiple tasks in a single database transaction.
 * Recalculates progress for all affected projects and invalidates task cache.
 * 
 * @route POST /api/tasks/bulk-delete
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Request body.
 * @param {Array<number|string>} req.body.ids - Array of task IDs to delete.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export const bulkDeleteTasks = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No task IDs provided" });
    }

    const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (numericIds.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid task IDs" });
    }

    // Fetch the tasks first to find their projectIds for recalculating progress
    const tasksToDelete = await prisma.task.findMany({
      where: { id: { in: numericIds } },
      select: { projectId: true }
    });

    if (tasksToDelete.length === 0) {
      return res.status(404).json({ success: false, message: "No tasks found to delete" });
    }

    // Delete tasks inside transaction
    await prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({
        where: { id: { in: numericIds } }
      });
    }, { maxWait: 20000, timeout: 30000 });

    // Find unique projectIds that were affected
    const affectedProjectIds = Array.from(new Set(tasksToDelete.map(t => t.projectId)));

    // Recalculate progress for all affected projects
    for (const projectId of affectedProjectIds) {
      await refreshProjectProgress(projectId);
    }

    await invalidateTasks();

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${numericIds.length} tasks.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

