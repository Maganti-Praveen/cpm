// Controller logic for managing projectImport operations.
// Processes incoming requests, performs validation, and communicates with services.

import XLSX from "xlsx";
import prisma from "../config/prisma.js";

// Function to handle parseExcelDate operations
const parseExcelDate = (val) => {
  if (val === undefined || val === null) return null;
  
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  
  if (typeof val === "number") {
    // Excel dates start on December 30, 1899 due to 1900 leap year bug
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(jsDate.getTime()) ? null : jsDate;
  }
  
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return null;
    
    // Check if it's a numeric string representing Excel serial number
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const serial = parseFloat(trimmed);
      const jsDate = new Date(Math.round((serial - 25569) * 86400 * 1000));
      return isNaN(jsDate.getTime()) ? null : jsDate;
    }
    
    const jsDate = new Date(trimmed);
    return isNaN(jsDate.getTime()) ? null : jsDate;
  }
  
  return null;
};

// GET /api/projects/import/template
// Function to handle downloadTemplate operations
export const downloadTemplate = async (req, res) => {
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Projects Template
    const projectData = [
      ["Project Name", "Client", "Status", "Start Date", "End Date", "Progress", "Team Members", "Description", "Deliverables"],
      ["CRM Redesign", "Hari", "In Progress", "2026-06-01", "2026-12-31", "20", "magantipraveensai3@gmail.com, abel.shibum@gmail.com", "Redesign the corporate CRM portal for modern look.", "Design, Development, Migration"],
      ["Billing System API", "Sai", "Planning", "2026-07-15", "2026-09-30", "0", "tarashankarp7@gmail.com", "Build billing REST endpoints.", "Database schema, REST endpoints, Unit tests"]
    ];
    const wsProjects = XLSX.utils.aoa_to_sheet(projectData);
    XLSX.utils.book_append_sheet(wb, wsProjects, "Projects");

    // Sheet 2: Instructions
    const instructionsData = [
      ["Column Name", "Required?", "Accepted Values / Format", "Description"],
      ["Project Name", "Yes", "Any text. Must be unique.", "The unique name of the project."],
      ["Client", "Yes", "Client Email, Full Name, or Company Name", "Matches the client role in Sai CRM (case-insensitive)."],
      ["Status", "No", "Planning, In Progress, Review, Completed", "Defaults to 'Planning' if empty."],
      ["Start Date", "No", "YYYY-MM-DD or Excel date number", "The planned start date of the project."],
      ["End Date", "No", "YYYY-MM-DD or Excel date number", "The planned due date (End Date) of the project."],
      ["Progress", "No", "Integer between 0 and 100", "Defaults to 0 if empty."],
      ["Team Members", "No", "Comma-separated list of Staff/Admin Emails or Full Names", "Matches case-insensitively and assigns staff members to the project."],
      ["Description", "No", "Any text description.", "Detailed description of the project."],
      ["Deliverables", "No", "Comma-separated list of deliverables.", "Key deliverables list for the project."]
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="Project_Import_Template.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/import
// Function to handle importProjects operations
export const importProjects = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Read the workbook with cellDates configuration to preserve dates correctly
    const workbook = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    if (!workbook.SheetNames.length) {
      return res.status(400).json({ success: false, message: "Empty workbook" });
    }

    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    // Decode range
    const ref = sheet["!ref"];
    if (!ref) {
      return res.status(400).json({ success: false, message: "Empty spreadsheet sheet" });
    }

    const range = XLSX.utils.decode_range(ref);
    const headers = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
      headers.push(cell && cell.v ? String(cell.v).trim() : "");
    }

    // Validate headers strictly
    const expectedHeaders = ["Project Name", "Client", "Status", "Start Date", "End Date", "Progress", "Team Members", "Description", "Deliverables"];
    const headersMatch = expectedHeaders.every((h, i) => headers[i] && headers[i].toLowerCase() === h.toLowerCase());
    if (!headersMatch) {
      return res.status(400).json({ success: false, message: "Invalid template format" });
    }

    // Parse data rows
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const dataRows = rows.slice(1); // skip headers

    // Fetch master records for resolving IDs and detecting duplicates
    const allClients = await prisma.user.findMany({ where: { role: "CLIENT" } });
    const allStaff = await prisma.user.findMany({ where: { role: { in: ["STAFF", "ADMIN"] } } });
    const existingProjects = await prisma.project.findMany({ select: { name: true } });
    const existingProjectNames = new Set(existingProjects.map(p => p.name.trim().toLowerCase()));

    // Create mapping of expected header to actual index in columns
    const headerIndices = {};
    expectedHeaders.forEach(eh => {
      headerIndices[eh] = headers.findIndex(h => h.toLowerCase() === eh.toLowerCase());
    });

    const projectsToInsert = [];
    const errors = [];
    let duplicateCount = 0;
    let failedCount = 0;
    const sheetProjectNames = new Set(); // to check duplicates in the uploaded sheet itself

    dataRows.forEach((rowArr, index) => {
      const excelRowNumber = index + 2; // Row 1 is headers in Excel
      
      const getVal = (eh) => {
        const idx = headerIndices[eh];
        const val = rowArr[idx];
        return val !== undefined && val !== null ? val : "";
      };

      const projectName = String(getVal("Project Name")).trim();
      const clientVal = String(getVal("Client")).trim();
      const statusVal = String(getVal("Status")).trim();
      const startDateVal = getVal("Start Date");
      const endDateVal = getVal("End Date");
      const progressVal = getVal("Progress");
      const teamMembersVal = String(getVal("Team Members")).trim();
      const descriptionVal = String(getVal("Description")).trim();
      const deliverablesVal = String(getVal("Deliverables")).trim();

      // Skip entirely empty row
      if (!projectName && !clientVal && !statusVal && !startDateVal && !endDateVal && !progressVal && !teamMembersVal && !descriptionVal && !deliverablesVal) {
        return;
      }

      const rowErrors = [];

      // 1. Project Name validation
      if (!projectName) {
        rowErrors.push("Project Name is required");
      } else {
        const lowerName = projectName.toLowerCase();
        if (existingProjectNames.has(lowerName)) {
          duplicateCount++;
          errors.push({
            row: excelRowNumber,
            message: `A project named '${projectName}' already exists`
          });
          return; // Skip duplicate projects immediately
        }
        if (sheetProjectNames.has(lowerName)) {
          duplicateCount++;
          errors.push({
            row: excelRowNumber,
            message: `Duplicate project name '${projectName}' in import file`
          });
          return; // Skip duplicate projects in sheet
        }
        sheetProjectNames.add(lowerName);
      }

      // 2. Client validation & resolution
      let clientId = null;
      if (!clientVal) {
        rowErrors.push("Client is required");
      } else {
        const clientMatch = allClients.find(c =>
          (c.company && c.company.toLowerCase() === clientVal.toLowerCase()) ||
          c.fullName.toLowerCase() === clientVal.toLowerCase() ||
          c.email.toLowerCase() === clientVal.toLowerCase()
        );
        if (clientMatch) {
          clientId = clientMatch.id;
        } else {
          rowErrors.push(`Client '${clientVal}' not found`);
        }
      }

      // 3. Status validation
      let status = "Planning";
      if (statusVal) {
        const validStatuses = ["Planning", "In Progress", "Review", "Completed"];
        const matched = validStatuses.find(s => s.toLowerCase() === statusVal.toLowerCase());
        if (matched) {
          status = matched;
        } else {
          rowErrors.push(`Invalid status '${statusVal}'`);
        }
      }

      // 4. Progress validation
      let progress = 0;
      if (progressVal !== "") {
        const num = parseInt(progressVal, 10);
        if (isNaN(num) || num < 0 || num > 100) {
          rowErrors.push(`Progress must be a number between 0 and 100`);
        } else {
          progress = num;
        }
      }

      // 5. Date parsing
      let startDate = null;
      if (startDateVal !== "") {
        startDate = parseExcelDate(startDateVal);
        if (!startDate) rowErrors.push("Invalid Start Date format");
      }

      let dueDate = null;
      if (endDateVal !== "") {
        dueDate = parseExcelDate(endDateVal);
        if (!dueDate) rowErrors.push("Invalid End Date format");
      }

      // 6. Team Members parsing
      const teamIds = [];
      if (teamMembersVal) {
        const memberParts = teamMembersVal.split(",").map(m => m.trim()).filter(Boolean);
        for (const part of memberParts) {
          const staffMatch = allStaff.find(s =>
            s.email.toLowerCase() === part.toLowerCase() ||
            s.fullName.toLowerCase() === part.toLowerCase()
          );
          if (staffMatch) {
            teamIds.push(staffMatch.id);
          }
        }
      }

      // 7. Parse optional Description and Deliverables
      const description = descriptionVal || null;
      const deliverables = deliverablesVal
        ? deliverablesVal.split(",").map(d => d.trim()).filter(Boolean)
        : [];

      if (rowErrors.length > 0) {
        failedCount++;
        errors.push({
          row: excelRowNumber,
          message: rowErrors.join(", ")
        });
      } else {
        projectsToInsert.push({
          name: projectName,
          clientId,
          status,
          progress,
          startDate,
          dueDate,
          teamIds,
          description,
          deliverables
        });
      }
    });

    let importedCount = 0;

    // Use a single Prisma transaction to write all successfully validated projects
    if (projectsToInsert.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const proj of projectsToInsert) {
          const created = await tx.project.create({
            data: {
              name: proj.name,
              clientId: proj.clientId,
              status: proj.status,
              progress: proj.progress,
              startDate: proj.startDate,
              dueDate: proj.dueDate,
              description: proj.description,
              deliverableItems: {
                create: (proj.deliverables || []).map(name => ({
                  name,
                  size: "0 KB",
                  status: "Awaiting Submission",
                  stage: "Planning"
                }))
              },
              team: proj.teamIds.length > 0 ? {
                connect: proj.teamIds.map(id => ({ id }))
              } : undefined
            }
          });


          // Log project creation in Activity log
          await tx.activity.create({
            data: {
              projectId: created.id,
              title: "Project Imported",
              description: `Project imported via Excel template by Admin`,
              type: "create"
            }
          });

          // Notify Client
          if (proj.clientId) {
            await tx.notification.create({
              data: {
                userId: proj.clientId,
                title: "New Project Assigned (Import)",
                message: `You have been assigned to project: "${proj.name}"`,
                type: "project",
                linkId: created.id
              }
            });
          }

          // Notify Team Members
          if (proj.teamIds.length > 0) {
            for (const staffId of proj.teamIds) {
              await tx.notification.create({
                data: {
                  userId: staffId,
                  title: "New Project Assignment (Import)",
                  message: `You have been assigned to project: "${proj.name}"`,
                  type: "project",
                  linkId: created.id
                }
              });
            }
          }
        }
      }, { maxWait: 20000, timeout: 30000 });
      importedCount = projectsToInsert.length;
    }

    // Logging bulk import activity globally for audit logs
    req.auditDetails = {
      description: `Admin imported ${importedCount} projects`,
      importedCount,
      failedCount,
      duplicateCount,
      errorsCount: errors.length
    };

    res.status(200).json({
      success: true,
      data: {
        imported: importedCount,
        failed: failedCount,
        duplicate: duplicateCount,
        errors
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/import/template
// Function to handle downloadTaskTemplate operations
export const downloadTaskTemplate = async (req, res) => {
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Tasks Template
    const taskData = [
      ["Task Title", "Project Name", "Assignee", "Priority", "Status", "Due Date", "Description"],
      ["Design Landing Page", "CRM Redesign", "magantipraveensai3@gmail.com", "High", "In Progress", "2026-07-01", "Design modern, responsive landing page mockup"],
      ["Setup Database Migrations", "Billing System API", "abel.shibum@gmail.com", "Medium", "To Do", "2026-07-15", "Initialize prisma migrations and setup relations"]
    ];
    const wsTasks = XLSX.utils.aoa_to_sheet(taskData);
    XLSX.utils.book_append_sheet(wb, wsTasks, "Tasks");

    // Sheet 2: Instructions
    const instructionsData = [
      ["Column Name", "Required?", "Accepted Values / Format", "Description"],
      ["Task Title", "Yes", "Any text title.", "The title/subject of the task."],
      ["Project Name", "Yes", "Must match an existing Project Name in system", "Associates the task with the target project (case-insensitive)."],
      ["Assignee", "No", "Staff/Admin Email or Full Name", "Assigns the task to a staff member (case-insensitive)."],
      ["Priority", "No", "Low, Medium, High", "Defaults to 'Medium' if empty."],
      ["Status", "No", "To Do, In Progress, Review, Completed, Done", "Defaults to 'To Do' if empty."],
      ["Due Date", "No", "YYYY-MM-DD or Excel date number", "The deadline for the task."],
      ["Description", "No", "Any text description.", "Detailed instructions or scope of the task."]
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="Task_Import_Template.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks/import
// Function to handle importTasks operations
export const importTasks = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    if (!workbook.SheetNames.length) {
      return res.status(400).json({ success: false, message: "Empty workbook" });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const ref = sheet["!ref"];
    if (!ref) {
      return res.status(400).json({ success: false, message: "Empty sheet" });
    }

    const range = XLSX.utils.decode_range(ref);
    const headers = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
      headers.push(cell && cell.v ? String(cell.v).trim() : "");
    }

    // Validate headers strictly
    const expectedHeaders = ["Task Title", "Project Name", "Assignee", "Priority", "Status", "Due Date", "Description"];
    const headersMatch = expectedHeaders.every((h, i) => headers[i] && headers[i].toLowerCase() === h.toLowerCase());
    if (!headersMatch) {
      return res.status(400).json({ success: false, message: "Invalid template format" });
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const dataRows = rows.slice(1);

    // Fetch master records
    const allProjects = await prisma.project.findMany({ select: { id: true, name: true } });
    const allStaff = await prisma.user.findMany({ where: { role: { in: ["STAFF", "ADMIN"] } } });
    
    let attempts = 0;
    let importedCount = 0;
    const errors = [];
    let failedCount = 0;

    while (attempts < 5) {
      try {
        const tasksToInsert = [];
        errors.length = 0;
        failedCount = 0;

        // Fetch all existing tasks to generate incremental unique taskKeys
        const allTasks = await prisma.task.findMany({ select: { taskKey: true } });
        let maxTaskNum = 0;
        allTasks.forEach(t => {
          const match = t.taskKey.match(/^TSK-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxTaskNum) maxTaskNum = num;
          }
        });

        const headerIndices = {};
        expectedHeaders.forEach(eh => {
          headerIndices[eh] = headers.findIndex(h => h.toLowerCase() === eh.toLowerCase());
        });

        dataRows.forEach((rowArr, index) => {
          const excelRowNumber = index + 2;
          
          const getVal = (eh) => {
            const idx = headerIndices[eh];
            const val = rowArr[idx];
            return val !== undefined && val !== null ? val : "";
          };

          const title = String(getVal("Task Title")).trim();
          const projectName = String(getVal("Project Name")).trim();
          const assigneeVal = String(getVal("Assignee")).trim();
          const priorityVal = String(getVal("Priority")).trim();
          const statusVal = String(getVal("Status")).trim();
          const dueDateVal = getVal("Due Date");
          const description = String(getVal("Description")).trim() || null;

          if (!title && !projectName && !assigneeVal && !priorityVal && !statusVal && !dueDateVal && !description) {
            return; // skip empty rows
          }

          const rowErrors = [];

          // Title validation
          if (!title) {
            rowErrors.push("Task Title is required");
          }

          // Project Name validation
          let projectId = null;
          if (!projectName) {
            rowErrors.push("Project Name is required");
          } else {
            const matchedProj = allProjects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
            if (matchedProj) {
              projectId = matchedProj.id;
            } else {
              rowErrors.push(`Project '${projectName}' not found`);
            }
          }

          // Assignee validation
          let assigneeId = null;
          if (assigneeVal) {
            const matchedStaff = allStaff.find(s =>
              s.email.toLowerCase() === assigneeVal.toLowerCase() ||
              s.fullName.toLowerCase() === assigneeVal.toLowerCase()
            );
            if (matchedStaff) {
              assigneeId = matchedStaff.id;
            }
          }

          // Priority validation
          let priority = "Medium";
          if (priorityVal) {
            const validPriorities = ["Low", "Medium", "High"];
            const matched = validPriorities.find(p => p.toLowerCase() === priorityVal.toLowerCase());
            if (matched) {
              priority = matched;
            } else {
              rowErrors.push(`Invalid priority '${priorityVal}'`);
            }
          }

          // Status validation
          let status = "To Do";
          if (statusVal) {
            const validStatuses = ["To Do", "In Progress", "Review", "Completed", "Done"];
            const matched = validStatuses.find(s => s.toLowerCase() === statusVal.toLowerCase());
            if (matched) {
              status = matched;
            } else {
              rowErrors.push(`Invalid status '${statusVal}'`);
            }
          }

          // Due Date validation
          let dueDate = null;
          if (dueDateVal !== "") {
            dueDate = parseExcelDate(dueDateVal);
            if (!dueDate) rowErrors.push("Invalid Due Date format");
          }

          if (rowErrors.length > 0) {
            failedCount++;
            errors.push({
              row: excelRowNumber,
              message: rowErrors.join(", ")
            });
          } else {
            // Increment key counter
            maxTaskNum++;
            const taskKey = `TSK-${String(maxTaskNum).padStart(3, "0")}`;
            tasksToInsert.push({
              taskKey,
              title,
              projectId,
              assigneeId,
              priority,
              status,
              dueDate,
              description
            });
          }
        });

        if (tasksToInsert.length > 0) {
          await prisma.$transaction(async (tx) => {
            for (const task of tasksToInsert) {
              const created = await tx.task.create({
                data: {
                  taskKey: task.taskKey,
                  title: task.title,
                  projectId: task.projectId,
                  assigneeId: task.assigneeId,
                  priority: task.priority,
                  status: task.status,
                  dueDate: task.dueDate,
                  description: task.description
                },
                include: { project: true }
              });

              // Log in Project Activity Feed
              await tx.activity.create({
                data: {
                  projectId: created.projectId,
                  title: "Task Imported",
                  description: `Task "${created.title}" (${created.taskKey}) imported via Excel template by Admin`,
                  type: "task"
                }
              });

              // Notify assignee
              if (created.assigneeId) {
                await tx.notification.create({
                  data: {
                    userId: created.assigneeId,
                    title: "New Task Assigned (Import)",
                    message: `You have been assigned to task: "${created.title}" under project: "${created.project.name}"`,
                    type: "task",
                    linkId: created.id
                  }
                });
              }
            }
          }, { maxWait: 20000, timeout: 30000 });
          importedCount = tasksToInsert.length;
        }
        break; // Success!
      } catch (error) {
        if (error.code === "P2002" && (error.meta?.target?.includes("taskKey") || error.message?.includes("taskKey"))) {
          attempts++;
          continue;
        }
        throw error;
      }
    }

    req.auditDetails = {
      description: `Admin imported ${importedCount} tasks`,
      importedCount,
      failedCount,
      errorsCount: errors.length
    };

    res.status(200).json({
      success: true,
      data: {
        imported: importedCount,
        failed: failedCount,
        duplicate: 0,
        errors
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/milestones/import/template
// Function to handle downloadMilestoneTemplate operations
export const downloadMilestoneTemplate = async (req, res) => {
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Milestones Template
    const milestoneData = [
      ["Milestone Title", "Project Name", "Due Date", "Status", "Progress"],
      ["UI/UX Design Mockups", "CRM Redesign", "2026-07-10", "Completed", "100"],
      ["Database Schema Draft", "Billing System API", "2026-08-01", "In Progress", "50"]
    ];
    const wsMilestones = XLSX.utils.aoa_to_sheet(milestoneData);
    XLSX.utils.book_append_sheet(wb, wsMilestones, "Milestones");

    // Sheet 2: Instructions
    const instructionsData = [
      ["Column Name", "Required?", "Accepted Values / Format", "Description"],
      ["Milestone Title", "Yes", "Any text title.", "The title of the milestone."],
      ["Project Name", "Yes", "Must match an existing Project Name in system", "Associates the milestone with the target project (case-insensitive)."],
      ["Due Date", "No", "YYYY-MM-DD or Excel date number", "The planned target date of the milestone."],
      ["Status", "No", "Planning, In Progress, Completed", "Defaults to 'Planning' if empty."],
      ["Progress", "No", "Integer between 0 and 100", "Defaults to 0 if empty."]
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="Milestone_Import_Template.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/milestones/import
// Function to handle importMilestones operations
export const importMilestones = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    if (!workbook.SheetNames.length) {
      return res.status(400).json({ success: false, message: "Empty workbook" });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const ref = sheet["!ref"];
    if (!ref) {
      return res.status(400).json({ success: false, message: "Empty sheet" });
    }

    const range = XLSX.utils.decode_range(ref);
    const headers = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
      headers.push(cell && cell.v ? String(cell.v).trim() : "");
    }

    // Validate headers strictly
    const expectedHeaders = ["Milestone Title", "Project Name", "Due Date", "Status", "Progress"];
    const headersMatch = expectedHeaders.every((h, i) => headers[i] && headers[i].toLowerCase() === h.toLowerCase());
    if (!headersMatch) {
      return res.status(400).json({ success: false, message: "Invalid template format" });
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const dataRows = rows.slice(1);

    // Fetch master records
    const allProjects = await prisma.project.findMany({ select: { id: true, name: true } });

    const headerIndices = {};
    expectedHeaders.forEach(eh => {
      headerIndices[eh] = headers.findIndex(h => h.toLowerCase() === eh.toLowerCase());
    });

    const milestonesToInsert = [];
    const errors = [];
    let failedCount = 0;

    dataRows.forEach((rowArr, index) => {
      const excelRowNumber = index + 2;

      const getVal = (eh) => {
        const idx = headerIndices[eh];
        const val = rowArr[idx];
        return val !== undefined && val !== null ? val : "";
      };

      const title = String(getVal("Milestone Title")).trim();
      const projectName = String(getVal("Project Name")).trim();
      const dateVal = getVal("Due Date");
      const statusVal = String(getVal("Status")).trim();
      const progressVal = getVal("Progress");

      if (!title && !projectName && !dateVal && !statusVal && !progressVal) {
        return; // skip empty rows
      }

      const rowErrors = [];

      // Title validation
      if (!title) {
        rowErrors.push("Milestone Title is required");
      }

      // Project validation
      let projectId = null;
      if (!projectName) {
        rowErrors.push("Project Name is required");
      } else {
        const matchedProj = allProjects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
        if (matchedProj) {
          projectId = matchedProj.id;
        } else {
          rowErrors.push(`Project '${projectName}' not found`);
        }
      }

      // Date validation
      let date = null;
      if (dateVal !== "") {
        date = parseExcelDate(dateVal);
        if (!date) rowErrors.push("Invalid Due Date format");
      }

      // Status validation
      let status = "Planning";
      if (statusVal) {
        const validStatuses = ["Planning", "In Progress", "Completed"];
        const matched = validStatuses.find(s => s.toLowerCase() === statusVal.toLowerCase());
        if (matched) {
          status = matched;
        } else {
          rowErrors.push(`Invalid status '${statusVal}'`);
        }
      }

      // Progress validation
      let progress = 0;
      if (progressVal !== "") {
        const num = parseInt(progressVal, 10);
        if (isNaN(num) || num < 0 || num > 100) {
          rowErrors.push("Progress must be an integer between 0 and 100");
        } else {
          progress = num;
        }
      }

      if (rowErrors.length > 0) {
        failedCount++;
        errors.push({
          row: excelRowNumber,
          message: rowErrors.join(", ")
        });
      } else {
        milestonesToInsert.push({
          title,
          projectId,
          date,
          status,
          progress
        });
      }
    });

    let importedCount = 0;
    if (milestonesToInsert.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const milestone of milestonesToInsert) {
          const created = await tx.milestone.create({
            data: {
              title: milestone.title,
              projectId: milestone.projectId,
              date: milestone.date,
              status: milestone.status,
              progress: milestone.progress
            }
          });

          // Log in Project Activity Feed
          await tx.activity.create({
            data: {
              projectId: created.projectId,
              title: "Milestone Imported",
              description: `Milestone "${created.title}" imported via Excel template by Admin`,
              type: "info"
            }
          });
        }
      }, { maxWait: 20000, timeout: 30000 });
      importedCount = milestonesToInsert.length;
    }

    req.auditDetails = {
      description: `Admin imported ${importedCount} milestones`,
      importedCount,
      failedCount,
      errorsCount: errors.length
    };

    res.status(200).json({
      success: true,
      data: {
        imported: importedCount,
        failed: failedCount,
        duplicate: 0,
        errors
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

