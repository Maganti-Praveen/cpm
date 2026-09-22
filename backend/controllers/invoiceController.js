// Controller logic for managing invoice operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { logActivity } from "../utils/activityLogger.js";
import { dispatch } from "../services/email/emailDispatcher.js";
import { createNotification, notifyAdmins } from "../utils/notifier.js";
import { getCache, setCache, invalidateInvoices } from "../utils/cache.js";

// Fetch invoices
export const getInvoices = async (req, res) => {
  try {
    const { status, clientId, search } = req.query;

    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    const userRole = req.user.role;
    const userId = req.user.id;
    const cacheKey = `invoices:list:${userRole}:${userId}:${status || "all"}:${clientId || "all"}:${search || ""}:p${page || "all"}:l${limit || "all"}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    let whereClause = {};

    // Enforce role-based restrictions
    if (req.user.role === "CLIENT") {
      whereClause.clientId = req.user.id;
    }

    // Filter by status
    if (status && status !== "All") {
      whereClause.status = status;
    }

    // Filter by client (Admin/Staff view)
    if (clientId && clientId !== "All") {
      whereClause.clientId = parseInt(clientId);
    }

    // Search by invoice number or client name/company
    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { client: { fullName: { contains: search, mode: "insensitive" } } },
        { client: { company: { contains: search, mode: "insensitive" } } }
      ];
    }

    let invoices;
    let total;

    if (page && limit) {
      const skip = (page - 1) * limit;
      [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where: whereClause,
          include: {
            client: {
              select: {
                id: true,
                fullName: true,
                email: true,
                company: true,
                phone: true
              }
            },
            project: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          },
          orderBy: { issueDate: "desc" },
          skip,
          take: limit
        }),
        prisma.invoice.count({ where: whereClause })
      ]);
    } else {
      invoices = await prisma.invoice.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              id: true,
              fullName: true,
              email: true,
              company: true,
              phone: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        },
        orderBy: { issueDate: "desc" }
      });
      total = invoices.length;
    }

    const responseData = {
      success: true,
      data: invoices,
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

// Fetch invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    // Parse the invoice ID param to verify it is a valid number format
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format" });
    }
    const invoice = await prisma.invoice.findUnique({
      where: { id: numericId },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // If client is logged in, ensure they can only view their own invoice
    if (req.user.role === "CLIENT" && invoice.clientId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized access to this invoice" });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create invoice
export const createInvoice = async (req, res) => {
  try {
    // Only Admin can create invoices
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only administrators can create invoices" });
    }

    const { invoiceNumber, amount, status, dueDate, clientId, projectId, description } = req.body;

    if (!amount || !clientId || !dueDate) {
      return res.status(400).json({ success: false, message: "Amount, client, and due date are required" });
    }

    // Verify client exists and has role CLIENT
    const clientUser = await prisma.user.findUnique({
      where: { id: parseInt(clientId) }
    });

    if (!clientUser || clientUser.role !== "CLIENT") {
      return res.status(400).json({ success: false, message: "Selected user is not a valid client" });
    }

    let attempts = 0;
    let invoice = null;
    let finalInvoiceNumber = invoiceNumber;

    while (attempts < 5) {
      try {
        if (!invoiceNumber) {
          const year = new Date().getFullYear();
          const prefix = `INV-${year}-`;
          const lastInvoice = await prisma.invoice.findFirst({
            where: { invoiceNumber: { startsWith: prefix } },
            orderBy: { id: "desc" },
            select: { invoiceNumber: true },
          });
          let nextNum = 1001;
          if (lastInvoice) {
            const numPart = parseInt(lastInvoice.invoiceNumber.replace(prefix, ""), 10);
            if (!isNaN(numPart)) nextNum = numPart + 1;
          }
          finalInvoiceNumber = `${prefix}${nextNum}`;
        }

        invoice = await prisma.invoice.create({
          data: {
            invoiceNumber: finalInvoiceNumber,
            amount: parseFloat(amount),
            status: status || "Unpaid",
            dueDate: new Date(dueDate),
            clientId: parseInt(clientId),
            projectId: projectId ? parseInt(projectId) : null,
            description: description || null
          },
          include: {
            client: true,
            project: true
          }
        });
        break; // Success!
      } catch (error) {
        if (error.code === "P2002" && !invoiceNumber) {
          attempts++;
          if (attempts >= 5) throw error;
        } else {
          throw error;
        }
      }
    }

    await createNotification({
      userId: invoice.clientId,
      title: "New Invoice Issued",
      message: `Invoice ${invoice.invoiceNumber} has been issued. Amount: ₹${invoice.amount.toLocaleString()}`,
      type: "invoice",
      linkId: invoice.id
    });

    // Log activity if tied to a project
    if (projectId) {
      await logActivity(
        projectId,
        `Invoice ${finalInvoiceNumber} created`,
        `Amount: ₹${parseFloat(amount).toLocaleString()} for client ${clientUser.fullName}`,
        "info"
      );
    }

    // Send invoice email to client
    try {
      dispatch("invoice-created", clientUser.email, {
        clientName: clientUser.fullName,
        invoiceNumber: finalInvoiceNumber,
        invoiceAmount: parseFloat(amount).toLocaleString(),
        dueDate: new Date(dueDate).toLocaleDateString(),
        description: description || "Services rendered",
        paymentLink: process.env.FRONTEND_URL || "http://localhost:5173",
        companyName: "Sai IT Services",
      });
    } catch (_) { /* email failure is non-critical */ }

    await invalidateInvoices();

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ success: false, message: "Invoice number already exists" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    // Parse the invoice ID param to verify it is a valid number format
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format" });
    }
    const { invoiceNumber, amount, status, dueDate, clientId, projectId, description } = req.body;

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: numericId }
    });

    if (!existingInvoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    let updateData = {};

    // Role-based update permission
    if (req.user.role === "CLIENT") {
      // Clients can only update the status to "Paid" for their own invoices (simulating a checkout/payment success)
      if (existingInvoice.clientId !== req.user.id) {
        return res.status(403).json({ success: false, message: "Unauthorized to update this invoice" });
      }
      if (status === "Paid") {
        updateData.status = "Paid";
      } else {
        return res.status(400).json({ success: false, message: "Clients can only mark invoices as Paid" });
      }
    } else if (req.user.role === "ADMIN") {
      // Admin can update anything
      if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber;
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (status !== undefined) updateData.status = status;
      if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
      if (clientId !== undefined) updateData.clientId = parseInt(clientId);
      if (projectId !== undefined) updateData.projectId = projectId ? parseInt(projectId) : null;
      if (description !== undefined) updateData.description = description;
    } else {
      return res.status(403).json({ success: false, message: "Permission denied" });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: numericId },
      data: updateData,
      include: {
        client: true,
        project: true
      }
    });

    // Calculate actual diff for the audit log
    if (existingInvoice) {
      const auditDetails = {};
      if (invoiceNumber !== undefined && invoiceNumber !== existingInvoice.invoiceNumber) {
        auditDetails.invoiceNumber = invoiceNumber;
      }
      if (amount !== undefined && parseFloat(amount) !== existingInvoice.amount) {
        auditDetails.amount = parseFloat(amount);
      }
      if (status !== undefined && status !== existingInvoice.status) {
        auditDetails.status = status;
      }
      if (dueDate !== undefined) {
        const d1 = new Date(dueDate).getTime();
        const d2 = existingInvoice.dueDate ? new Date(existingInvoice.dueDate).getTime() : 0;
        if (d1 !== d2) auditDetails.dueDate = dueDate;
      }
      if (clientId !== undefined && parseInt(clientId) !== existingInvoice.clientId) {
        auditDetails.clientId = parseInt(clientId);
      }
      if (projectId !== undefined && (projectId ? parseInt(projectId) : null) !== existingInvoice.projectId) {
        auditDetails.projectId = projectId ? parseInt(projectId) : null;
      }
      if (description !== undefined && description !== existingInvoice.description) {
        auditDetails.description = description;
      }
      req.auditDetails = auditDetails;
    }

    if (status === "Paid" && existingInvoice.status !== "Paid") {
      await createNotification({
        userId: updatedInvoice.clientId,
        title: "Invoice Payment Successful",
        message: `Payment of ₹${updatedInvoice.amount.toLocaleString()} for Invoice ${updatedInvoice.invoiceNumber} was successfully processed.`,
        type: "invoice",
        linkId: updatedInvoice.id
      });

      await notifyAdmins({
        title: "Invoice Paid",
        message: `Client "${updatedInvoice.client?.fullName || 'Client'}" paid Invoice ${updatedInvoice.invoiceNumber}. Amount: ₹${updatedInvoice.amount.toLocaleString()}`,
        type: "invoice",
        linkId: updatedInvoice.id
      });
    }

    // Log activity if project was and remains tied
    if (updatedInvoice.projectId && status === "Paid" && existingInvoice.status !== "Paid") {
      await logActivity(
        updatedInvoice.projectId,
        `Invoice ${updatedInvoice.invoiceNumber} Paid`,
        `Payment of ₹${updatedInvoice.amount.toLocaleString()} marked as completed.`,
        "completed"
      );
    }

    // Email client on successful payment
    if (status === "Paid" && existingInvoice.status !== "Paid" && updatedInvoice.client) {
      try {
        dispatch("invoice-paid", updatedInvoice.client.email, {
          clientName: updatedInvoice.client.fullName,
          invoiceNumber: updatedInvoice.invoiceNumber,
          invoiceAmount: updatedInvoice.amount.toString(),
          paidAt: new Date().toLocaleDateString(),
          companyName: "Sai IT Services",
        });
      } catch (err) {
        console.error("[InvoicePaidEmail] Dispatch failed:", err.message);
      }
    }

    await invalidateInvoices();

    res.status(200).json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    // Parse the invoice ID param to verify it is a valid number format
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format" });
    }

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only administrators can delete invoices" });
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: numericId }
    });

    if (!existingInvoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    await prisma.invoice.delete({
      where: { id: numericId }
    });

    // Log activity if tied to project
    if (existingInvoice.projectId) {
      await logActivity(
        existingInvoice.projectId,
        `Invoice deleted`,
        `Invoice ${existingInvoice.invoiceNumber} removed from project record.`,
        "info"
      );
    }

    await invalidateInvoices();

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
