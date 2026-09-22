// Controller logic for managing transaction operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { logActivity } from "../utils/activityLogger.js";
import { getCache, setCache, invalidateTransactions } from "../utils/cache.js";
import { createNotification } from "../utils/notifier.js";
import { dispatch } from "../services/email/emailDispatcher.js";

// Create transaction (manual or automatic)
export const createTransaction = async (req, res) => {
  try {
    const { invoiceId, amount, paymentType, gatewayName, paymentProof } = req.body;
    const clientId = req.user.id; // User must be authenticated

    if (!invoiceId || !amount || !paymentType || !gatewayName) {
      return res.status(400).json({ success: false, message: "Missing required transaction fields" });
    }

    // Verify invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    if (invoice.clientId !== clientId && req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized access to this invoice" });
    }

    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const status = paymentType === "manual" ? "Pending" : "Success";

    const transaction = await prisma.transaction.create({
      data: {
        transactionId,
        invoiceId: parseInt(invoiceId),
        clientId,
        amount: parseFloat(amount),
        paymentType,
        gatewayName,
        status,
        paymentProof: paymentProof || null,
      },
    });

    // Update invoice status accordingly
    const newInvoiceStatus = paymentType === "manual" ? "Pending" : "Paid";
    await prisma.invoice.update({
      where: { id: parseInt(invoiceId) },
      data: { status: newInvoiceStatus },
    });

    // Log project activity if applicable
    if (invoice.projectId) {
      const activityTitle = paymentType === "manual" 
        ? `Manual payment submitted for invoice ${invoice.invoiceNumber}`
        : `Automatic payment successful for invoice ${invoice.invoiceNumber}`;
      
      const activityDesc = paymentType === "manual"
        ? `Payment of ₹${parseFloat(amount).toLocaleString()} is awaiting verification.`
        : `Payment of ₹${parseFloat(amount).toLocaleString()} processed successfully.`;

      await logActivity(invoice.projectId, activityTitle, activityDesc, "info");
    }

    await invalidateTransactions();

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Retrieve all transactions (Admin view)
export const getTransactions = async (req, res) => {
  try {
    const { paymentType, search } = req.query;

    if (req.user.role !== "ADMIN" && req.user.role !== "STAFF" && req.user.role !== "CLIENT") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const userRole = req.user.role;
    const userId = req.user.id;
    const cacheKey = `transactions:list:${userRole}:${userId}:${paymentType || "all"}:${search || ""}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    let whereClause = {};

    if (req.user.role === "CLIENT") {
      whereClause.clientId = req.user.id;
    }

    if (paymentType) {
      whereClause.paymentType = paymentType;
    }

    if (search) {
      const searchConditions = [
        { transactionId: { contains: search, mode: "insensitive" } },
        { paymentProof: { contains: search, mode: "insensitive" } },
        { invoice: { invoiceNumber: { contains: search, mode: "insensitive" } } },
      ];

      if (req.user.role !== "CLIENT") {
        searchConditions.push(
          { client: { fullName: { contains: search, mode: "insensitive" } } },
          { client: { email: { contains: search, mode: "insensitive" } } },
          { client: { company: { contains: search, mode: "insensitive" } } }
        );
      }

      whereClause.OR = searchConditions;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    await setCache(cacheKey, transactions, 3600);

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify/Accept/Reject manual payment (Admin view)
export const verifyManualPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "Success" | "Rejected"

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only administrators can verify manual payments" });
    }

    if (status !== "Success" && status !== "Rejected") {
      return res.status(400).json({ success: false, message: "Invalid verification status" });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: { invoice: { include: { client: true } } },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction record not found" });
    }

    if (transaction.paymentType !== "manual" || transaction.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Transaction is not a pending manual payment" });
    }

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    // Update corresponding invoice
    const newInvoiceStatus = status === "Success" ? "Paid" : "Unpaid";
    await prisma.invoice.update({
      where: { id: transaction.invoiceId },
      data: { status: newInvoiceStatus },
    });

    // Log project activity
    if (transaction.invoice.projectId) {
      const activityTitle = status === "Success"
        ? `Manual payment approved for invoice ${transaction.invoice.invoiceNumber}`
        : `Manual payment rejected for invoice ${transaction.invoice.invoiceNumber}`;
      
      const activityDesc = status === "Success"
        ? `Payment of ₹${transaction.amount.toLocaleString()} was accepted by Admin.`
        : `Payment of ₹${transaction.amount.toLocaleString()} was rejected by Admin. Invoice marked as unpaid.`;

      await logActivity(transaction.invoice.projectId, activityTitle, activityDesc, status === "Success" ? "completed" : "info");
    }

    await invalidateTransactions();

    // Notify corresponding client
    if (transaction.invoice && transaction.invoice.clientId) {
      await createNotification({
        userId: transaction.invoice.clientId,
        title: status === "Success" ? "Manual Payment Approved" : "Manual Payment Rejected",
        message: status === "Success"
          ? `Your manual payment proof for invoice "${transaction.invoice.invoiceNumber}" was approved.`
          : `Your manual payment proof for invoice "${transaction.invoice.invoiceNumber}" was rejected. Please review and re-submit.`,
        type: "invoice",
        linkId: transaction.invoice.id
      });

      if (status === "Success" && transaction.invoice.client) {
        try {
          dispatch("invoice-paid", transaction.invoice.client.email, {
            clientName: transaction.invoice.client.fullName,
            invoiceNumber: transaction.invoice.invoiceNumber || String(transaction.invoice.id),
            invoiceAmount: String(transaction.invoice.amount),
            paidAt: new Date().toLocaleDateString(),
            companyName: "Sai IT Services",
          });
        } catch (err) {
          console.error("[ManualPaymentEmail] Dispatch failed:", err.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: updatedTransaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
