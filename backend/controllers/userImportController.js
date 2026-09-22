import XLSX from "xlsx";
import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { dispatch } from "../services/email/emailDispatcher.js";
import { getDefaultTemplates } from "../services/email/templateParser.js";

// GET /api/users/import/client/template
export const downloadClientTemplate = async (req, res) => {
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Clients Template
    const clientData = [
      ["Full Name", "Email", "Company", "Phone", "Status", "Password"],
      ["Hari", "devara2266@gmail.com", "TCS", "9876543210", "Active", ""],
      ["Sai", "sai254026@gmail.com", "Wipo", "555-0199", "Active", "securepass123"]
    ];
    const wsClients = XLSX.utils.aoa_to_sheet(clientData);
    XLSX.utils.book_append_sheet(wb, wsClients, "Clients");

    // Sheet 2: Instructions
    const instructionsData = [
      ["Column Name", "Required?", "Accepted Values / Format", "Description"],
      ["Full Name", "Yes", "Any text name.", "The client's full contact name."],
      ["Email", "Yes", "Valid unique email address.", "Used for login and notifications."],
      ["Company", "No", "Any text company name.", "Defaults to 'Independent' if empty."],
      ["Phone", "No", "Telephone numbers/digits.", "Primary contact number."],
      ["Status", "No", "Active, Inactive", "Defaults to 'Active' if empty."],
      ["Password", "No", "Minimum 6 characters.", "Password for client login. If left blank, a secure random password will be auto-generated and displayed in the summary."]
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="Client_Import_Template.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/users/import/client
export const importClients = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    if (!workbook.SheetNames.length) {
      return res.status(400).json({ success: false, message: "Empty workbook" });
    }

    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

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

    const expectedHeaders = ["Full Name", "Email", "Company", "Phone", "Status", "Password"];
    const headersMatch = expectedHeaders.every((h, i) => headers[i] && headers[i].toLowerCase() === h.toLowerCase());
    if (!headersMatch) {
      return res.status(400).json({ success: false, message: "Invalid template format" });
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const dataRows = rows.slice(1); // skip headers

    const existingUsers = await prisma.user.findMany({ select: { email: true } });
    const existingEmails = new Set(existingUsers.map(u => u.email.trim().toLowerCase()));

    const headerIndices = {};
    expectedHeaders.forEach(eh => {
      headerIndices[eh] = headers.findIndex(h => h.toLowerCase() === eh.toLowerCase());
    });

    const clientsToInsert = [];
    const errors = [];
    let duplicateCount = 0;
    let failedCount = 0;
    const sheetEmails = new Set();

    dataRows.forEach((rowArr, index) => {
      const excelRowNumber = index + 2;
      
      const getVal = (eh) => {
        const idx = headerIndices[eh];
        const val = rowArr[idx];
        return val !== undefined && val !== null ? val : "";
      };

      const fullName = String(getVal("Full Name")).trim();
      const email = String(getVal("Email")).trim();
      const company = String(getVal("Company")).trim();
      const phone = String(getVal("Phone")).trim();
      const statusVal = String(getVal("Status")).trim();
      const passwordVal = String(getVal("Password")).trim();

      if (!fullName && !email && !company && !phone && !statusVal && !passwordVal) {
        return; // skip empty row
      }

      const rowErrors = [];

      if (!fullName) {
        rowErrors.push("Full Name is required");
      }

      if (!email) {
        rowErrors.push("Email is required");
      } else {
        const lowerEmail = email.toLowerCase();
        if (!/\S+@\S+\.\S+/.test(lowerEmail)) {
          rowErrors.push("Invalid email format");
        } else if (existingEmails.has(lowerEmail)) {
          duplicateCount++;
          errors.push({
            row: excelRowNumber,
            message: `User with email '${email}' already exists`
          });
          return;
        } else if (sheetEmails.has(lowerEmail)) {
          duplicateCount++;
          errors.push({
            row: excelRowNumber,
            message: `Duplicate email '${email}' inside spreadsheet`
          });
          return;
        }
        sheetEmails.add(lowerEmail);
      }

      let status = "Active";
      if (statusVal) {
        const matched = ["Active", "Inactive"].find(s => s.toLowerCase() === statusVal.toLowerCase());
        if (matched) {
          status = matched;
        } else {
          rowErrors.push(`Invalid status '${statusVal}'`);
        }
      }

      const plainPassword = passwordVal || crypto.randomBytes(6).toString("hex");

      if (rowErrors.length > 0) {
        failedCount++;
        errors.push({
          row: excelRowNumber,
          message: rowErrors.join(", ")
        });
      } else {
        clientsToInsert.push({
          fullName,
          email: email.toLowerCase(),
          company: company || "Independent",
          phone: phone || null,
          status,
          plainPassword
        });
      }
    });

    const importedUsers = [];

    if (clientsToInsert.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const c of clientsToInsert) {
          const hashedPassword = await bcrypt.hash(c.plainPassword, 10);
          const created = await tx.user.create({
            data: {
              fullName: c.fullName,
              email: c.email,
              password: hashedPassword,
              role: "CLIENT",
              company: c.company,
              phone: c.phone,
              status: c.status
            }
          });
          importedUsers.push({
            id: created.id,
            fullName: created.fullName,
            email: created.email,
            plainPassword: c.plainPassword
          });
        }
      }, {
        maxWait: 20000,
        timeout: 30000
      });

      // Dispatch welcome emails outside transaction to avoid rollback issues
      importedUsers.forEach(c => {
        try {
          dispatch("client-welcome", c.email, {
            clientName: c.fullName,
            email: c.email,
            temporaryPassword: c.plainPassword,
            loginUrl: process.env.FRONTEND_URL || "http://localhost:5173",
            companyName: "Sai IT Services"
          });
        } catch (err) {
          console.error(`[ImportClients] Welcome email failed for ${c.email}:`, err.message);
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        imported: importedUsers.length,
        duplicate: duplicateCount,
        failed: failedCount,
        errors,
        importedUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/import/staff/template
export const downloadStaffTemplate = async (req, res) => {
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Staff Template
    const staffData = [
      ["Full Name", "Email", "Role", "Admin Role", "Permissions", "Phone", "Status", "Password"],
      ["Maganti Praveen Sai", "magantipraveensai3@gmail.com", "Admin", "Project Lead", "projects, clients, tasks", "1234567890", "Active", ""],
      ["Mundapuzha Abel Shibu John", "abel.shibum@gmail.com", "Staff", "", "", "9876543210", "Active", ""],
      ["Sumanth", "tarashankarp7@gmail.com", "Staff", "", "", "555-0199", "Active", "staffpass123"]
    ];
    const wsStaff = XLSX.utils.aoa_to_sheet(staffData);
    XLSX.utils.book_append_sheet(wb, wsStaff, "Staff");

    // Sheet 2: Instructions
    const instructionsData = [
      ["Column Name", "Required?", "Accepted Values / Format", "Description"],
      ["Full Name", "Yes", "Any text name.", "The staff member's full name."],
      ["Email", "Yes", "Valid unique email address.", "Used for login and notifications."],
      ["Role", "No", "Staff, Admin", "Defaults to 'Staff' if empty. Set to 'Admin' to create sub-admin accounts."],
      ["Admin Role", "No", "Any text designation title.", "Required only if Role is 'Admin'. Specifies designation (e.g. 'Project Manager')."],
      ["Permissions", "No", "Comma-separated list: projects, clients, staff, tasks, documents, invoices, support, contact_reviews, analytics, email_config, admin_management, payment_gateways, content_settings, settings_theme", "Only applicable if Role is 'Admin'. Specifies module page accesses."],
      ["Phone", "No", "Telephone numbers/digits.", "Primary contact number."],
      ["Status", "No", "Active, Inactive", "Defaults to 'Active' if empty."],
      ["Password", "No", "Minimum 6 characters.", "Password for staff login. If left blank, a secure random password will be auto-generated and displayed in the summary."]
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="Staff_Import_Template.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/users/import/staff
export const importStaff = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    if (!workbook.SheetNames.length) {
      return res.status(400).json({ success: false, message: "Empty workbook" });
    }

    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

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

    const expectedHeaders = ["Full Name", "Email", "Role", "Admin Role", "Permissions", "Phone", "Status", "Password"];
    const headersMatch = expectedHeaders.every((h, i) => headers[i] && headers[i].toLowerCase() === h.toLowerCase());
    if (!headersMatch) {
      return res.status(400).json({ success: false, message: "Invalid template format" });
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const dataRows = rows.slice(1);

    const existingUsers = await prisma.user.findMany({ select: { email: true } });
    const existingEmails = new Set(existingUsers.map(u => u.email.trim().toLowerCase()));

    const headerIndices = {};
    expectedHeaders.forEach(eh => {
      headerIndices[eh] = headers.findIndex(h => h.toLowerCase() === eh.toLowerCase());
    });

    const staffToInsert = [];
    const errors = [];
    let duplicateCount = 0;
    let failedCount = 0;
    const sheetEmails = new Set();

    dataRows.forEach((rowArr, index) => {
      const excelRowNumber = index + 2;

      const getVal = (eh) => {
        const idx = headerIndices[eh];
        const val = rowArr[idx];
        return val !== undefined && val !== null ? val : "";
      };

      const fullName = String(getVal("Full Name")).trim();
      const email = String(getVal("Email")).trim();
      const roleVal = String(getVal("Role")).trim();
      const adminRole = String(getVal("Admin Role")).trim();
      const permissionsVal = String(getVal("Permissions")).trim();
      const phone = String(getVal("Phone")).trim();
      const statusVal = String(getVal("Status")).trim();
      const passwordVal = String(getVal("Password")).trim();

      if (!fullName && !email && !roleVal && !adminRole && !permissionsVal && !phone && !statusVal && !passwordVal) {
        return;
      }

      const rowErrors = [];

      if (!fullName) {
        rowErrors.push("Full Name is required");
      }

      if (!email) {
        rowErrors.push("Email is required");
      } else {
        const lowerEmail = email.toLowerCase();
        if (!/\S+@\S+\.\S+/.test(lowerEmail)) {
          rowErrors.push("Invalid email format");
        } else if (existingEmails.has(lowerEmail)) {
          duplicateCount++;
          errors.push({
            row: excelRowNumber,
            message: `User with email '${email}' already exists`
          });
          return;
        } else if (sheetEmails.has(lowerEmail)) {
          duplicateCount++;
          errors.push({
            row: excelRowNumber,
            message: `Duplicate email '${email}' inside spreadsheet`
          });
          return;
        }
        sheetEmails.add(lowerEmail);
      }

      let role = "STAFF";
      if (roleVal) {
        if (roleVal.toLowerCase() === "admin") {
          role = "ADMIN";
        } else if (roleVal.toLowerCase() === "staff") {
          role = "STAFF";
        } else {
          rowErrors.push(`Invalid role '${roleVal}' (must be Staff or Admin)`);
        }
      }

      if (role === "ADMIN" && !adminRole) {
        rowErrors.push("Admin Role (designation) is required for Sub-Admin profiles");
      }

      const permissions = {};
      if (role === "ADMIN" && permissionsVal) {
        const validPerms = [
          "projects", "clients", "staff", "tasks", "documents", "invoices",
          "support", "contact_reviews", "analytics", "email_config",
          "admin_management", "payment_gateways", "content_settings", "settings_theme"
        ];
        const rawPerms = permissionsVal.split(",").map(p => p.trim().toLowerCase()).filter(Boolean);
        rawPerms.forEach(rp => {
          const matched = validPerms.find(vp => vp.toLowerCase() === rp);
          if (matched) {
            permissions[matched] = true;
          }
        });
      }

      let status = "Active";
      if (statusVal) {
        const matched = ["Active", "Inactive"].find(s => s.toLowerCase() === statusVal.toLowerCase());
        if (matched) {
          status = matched;
        } else {
          rowErrors.push(`Invalid status '${statusVal}'`);
        }
      }

      const plainPassword = passwordVal || crypto.randomBytes(6).toString("hex");

      if (rowErrors.length > 0) {
        failedCount++;
        errors.push({
          row: excelRowNumber,
          message: rowErrors.join(", ")
        });
      } else {
        staffToInsert.push({
          fullName,
          email: email.toLowerCase(),
          role,
          adminRole: role === "ADMIN" ? adminRole : null,
          permissions: role === "ADMIN" ? permissions : null,
          phone: phone || null,
          status,
          plainPassword
        });
      }
    });

    const importedUsers = [];

    if (staffToInsert.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const s of staffToInsert) {
          const hashedPassword = await bcrypt.hash(s.plainPassword, 10);
          const created = await tx.user.create({
            data: {
              fullName: s.fullName,
              email: s.email,
              password: hashedPassword,
              role: s.role,
              adminRole: s.adminRole,
              permissions: s.permissions,
              phone: s.phone,
              status: s.status
            }
          });
          importedUsers.push({
            id: created.id,
            fullName: created.fullName,
            email: created.email,
            role: created.role,
            plainPassword: s.plainPassword,
            permissions: created.permissions
          });
        }
      }, {
        maxWait: 20000,
        timeout: 30000
      });

      // Dispatch welcome emails outside transaction
      importedUsers.forEach(s => {
        try {
          let templateSlug = "staff-welcome";
          let nameKey = "staffName";
          const variables = {
            email: s.email,
            loginUrl: process.env.FRONTEND_URL || "http://localhost:5173",
            companyName: "Sai IT Services",
            temporaryPassword: s.plainPassword
          };

          if (s.role === "ADMIN") {
            templateSlug = "subadmin-welcome";
            nameKey = "adminName";
            variables[nameKey] = s.fullName;
            
            let permissionsStr = "None";
            if (s.permissions && typeof s.permissions === 'object') {
              const perms = s.permissions;
              const activePages = Object.keys(perms).filter(k => perms[k] === true || perms[k] === 'true');
              if (activePages.length > 0) {
                permissionsStr = activePages.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ");
              }
            }
            variables.permissionsList = permissionsStr;
          } else {
            variables[nameKey] = s.fullName;
          }

          dispatch(templateSlug, s.email, variables);
        } catch (err) {
          console.error(`[ImportStaff] Welcome email failed for ${s.email}:`, err.message);
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        imported: importedUsers.length,
        duplicate: duplicateCount,
        failed: failedCount,
        errors,
        importedUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
