// Controller logic for managing payment operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import multer from "multer";
import { uploadToCloudinary } from "../services/cloudinaryService.js";
import { dispatch } from "../services/email/emailDispatcher.js";
import { createNotification, notifyAdmins } from "../utils/notifier.js";
import { invalidateTransactions } from "../utils/cache.js";

// Multer in-memory storage for Cloudinary upload
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

// create razorpay order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { invoiceId } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Get Razorpay config
    const gateway = await prisma.paymentGateway.findFirst({
      where: { name: "razorpay" },
    });

    if (!gateway || !gateway.enabled) {
      return res.status(400).json({ success: false, message: "Razorpay is not enabled" });
    }

    const { keyId, secret, secretKey } = gateway.config || {};
    const keySecret = secret || secretKey;

    if (!keyId || !keySecret) {
      return res.status(400).json({ success: false, message: "Razorpay credentials are not configured" });
    }

    // Initialize Razorpay SDK
    const rzp = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await rzp.orders.create({
      amount: Math.round(invoice.amount * 100), // convert to paisa
      currency: "INR",
      receipt: `invoice_${invoice.id}`,
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      keyId,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// verify razorpay signature
export const verifyRazorpaySignature = async (req, res) => {
  try {
    const { invoiceId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Get Razorpay config
    const gateway = await prisma.paymentGateway.findFirst({
      where: { name: "razorpay" },
    });

    if (!gateway) {
      return res.status(400).json({ success: false, message: "Razorpay settings not found" });
    }

    const { secret, secretKey } = gateway.config || {};
    const keySecret = secret || secretKey;

    if (!keySecret) {
      return res.status(400).json({ success: false, message: "Razorpay secret key not configured" });
    }

    // Verify signature
    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature verification failed" });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: parseInt(invoiceId) },
      data: {
        status: "Paid",
        paymentStatus: "PAID",
        paymentMethod: "razorpay",
        transactionId: razorpay_payment_id,
        paidAt: new Date(),
      },
      include: {
        client: true
      }
    });

    await prisma.transaction.create({
      data: {
        transactionId: razorpay_payment_id,
        invoiceId: parseInt(invoiceId),
        clientId: updatedInvoice.clientId,
        amount: updatedInvoice.amount,
        paymentType: "automatic",
        gatewayName: "razorpay",
        status: "Success",
      },
    });

    if (updatedInvoice.client) {
      try {
        dispatch("invoice-paid", updatedInvoice.client.email, {
          clientName: updatedInvoice.client.fullName,
          invoiceNumber: updatedInvoice.invoiceNumber,
          invoiceAmount: updatedInvoice.amount.toString(),
          paidAt: new Date(updatedInvoice.paidAt || new Date()).toLocaleDateString(),
          companyName: "Sai IT Services",
        });
      } catch (err) {
        console.error("[RazorpayPaymentEmail] Dispatch failed:", err.message);
      }
    }

    await invalidateTransactions();
    res.json({ success: true, data: updatedInvoice });
  } catch (error) {
    console.error("Razorpay signature verification error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// submit manual payment proof
export const payManualWithProof = async (req, res) => {
  try {
    const { invoiceId, transactionId, notes } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ success: false, message: "Invoice ID is required" });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Screenshot payment proof is required" });
    }

    // Upload to Cloudinary
    console.log("Uploading payment proof to Cloudinary...");
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: "payment-proofs",
      resourceType: "image",
    });

    const finalTxId = transactionId || `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const updatedInvoice = await prisma.invoice.update({
      where: { id: parseInt(invoiceId) },
      data: {
        status: "Pending",
        paymentStatus: "PENDING_APPROVAL",
        paymentMethod: "manual",
        paymentProof: uploadResult.url,
        transactionId: finalTxId,
        description: notes ? `${invoice.description || ""}\nNotes: ${notes}` : invoice.description,
      },
    });

    await prisma.transaction.create({
      data: {
        transactionId: finalTxId,
        invoiceId: parseInt(invoiceId),
        clientId: invoice.clientId,
        amount: invoice.amount,
        paymentType: "manual",
        gatewayName: "manual",
        status: "Pending",
        paymentProof: uploadResult.url,
      },
    });

    // Dispatch email to all admins
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true }
      });

      const clientUser = await prisma.user.findUnique({
        where: { id: invoice.clientId },
        select: { fullName: true }
      });

      for (const admin of admins) {
        await dispatch("manual-payment-received", admin.email, {
          clientName: clientUser ? clientUser.fullName : "Client",
          invoiceNumber: invoice.invoiceNumber || String(invoice.id),
          invoiceAmount: String(invoice.amount),
          transactionId: finalTxId,
          notes: notes || "None",
          companyName: "Sai IT Services"
        });
      }
    } catch (emailErr) {
      console.error("[ManualPaymentEmail] Failed to send email to admins:", emailErr.message);
    }

    // Alert all admins via in-app notifications
    await notifyAdmins({
      title: "New Manual Payment Proof Submitted",
      message: `Client has uploaded proof for invoice "${invoice.invoiceNumber || invoice.id}". Awaiting verification.`,
      type: "invoice",
      linkId: invoice.id
    });
    
    await invalidateTransactions();
    res.json({ success: true, data: updatedInvoice });
  } catch (error) {
    console.error("Manual payment proof upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// approve/reject manual payment
export const verifyManualPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "approve" | "reject"

    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    let updateData = {};

    if (action === "approve") {
      updateData = {
        status: "Paid",
        paymentStatus: "PAID",
        paidAt: new Date(),
      };
    } else if (action === "reject") {
      updateData = {
        status: "Unpaid",
        paymentStatus: "REJECTED",
      };
    } else {
      return res.status(400).json({ success: false, message: "Invalid action. Choose approve or reject." });
    }

    const updated = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        client: true
      }
    });

    const txn = await prisma.transaction.findFirst({
      where: { invoiceId: parseInt(id), paymentType: "manual", status: "Pending" },
    });

    if (txn) {
      await prisma.transaction.update({
        where: { id: txn.id },
        data: { status: action === "approve" ? "Success" : "Rejected" },
      });
    }

    if (action === "approve" && updated.client) {
      try {
        dispatch("invoice-paid", updated.client.email, {
          clientName: updated.client.fullName,
          invoiceNumber: updated.invoiceNumber,
          invoiceAmount: updated.amount.toString(),
          paidAt: new Date(updated.paidAt || new Date()).toLocaleDateString(),
          companyName: "Sai IT Services",
        });
      } catch (err) {
        console.error("[ManualPaymentEmail] Dispatch failed:", err.message);
      }
    }

    if (updated.clientId) {
      await createNotification({
        userId: updated.clientId,
        title: action === "approve" ? "Manual Payment Approved" : "Manual Payment Rejected",
        message: action === "approve"
          ? `Your manual payment proof for invoice "${updated.invoiceNumber}" was approved.`
          : `Your manual payment proof for invoice "${updated.invoiceNumber}" was rejected. Please review and re-submit.`,
        type: "invoice",
        linkId: updated.id
      });
    }

    await invalidateTransactions();
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Manual verification error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// complete simulated auto payment
export const completeSimulatedPayment = async (req, res) => {
  try {
    const { invoiceId, gatewayName, transactionId } = req.body;

    if (!invoiceId || !gatewayName) {
      return res.status(400).json({ success: false, message: "Invoice ID and Gateway Name are required" });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    if (req.user.role === "CLIENT" && invoice.clientId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized access to this invoice" });
    }

    // Verify the gateway is enabled
    const gateway = await prisma.paymentGateway.findFirst({
      where: { name: gatewayName },
    });

    if (!gateway || !gateway.enabled) {
      return res.status(400).json({ success: false, message: `${gatewayName} gateway is not enabled` });
    }

    const finalTxId = transactionId || `tx_${gatewayName}_${Math.random().toString(36).substr(2, 9)}`;

    const updatedInvoice = await prisma.invoice.update({
      where: { id: parseInt(invoiceId) },
      data: {
        status: "Paid",
        paymentStatus: "PAID",
        paymentMethod: gatewayName,
        transactionId: finalTxId,
        paidAt: new Date(),
      },
      include: {
        client: true
      }
    });

    await prisma.transaction.create({
      data: {
        transactionId: finalTxId,
        invoiceId: parseInt(invoiceId),
        clientId: updatedInvoice.clientId,
        amount: updatedInvoice.amount,
        paymentType: "automatic",
        gatewayName: gatewayName,
        status: "Success",
      },
    });

    if (updatedInvoice.client) {
      try {
        dispatch("invoice-paid", updatedInvoice.client.email, {
          clientName: updatedInvoice.client.fullName,
          invoiceNumber: updatedInvoice.invoiceNumber,
          invoiceAmount: updatedInvoice.amount.toString(),
          paidAt: new Date(updatedInvoice.paidAt || new Date()).toLocaleDateString(),
          companyName: "Sai IT Services",
        });
      } catch (err) {
        console.error("[SimulatedPaymentEmail] Dispatch failed:", err.message);
      }
    }

    await invalidateTransactions();
    res.json({ success: true, data: updatedInvoice });
  } catch (error) {
    console.error("Complete simulated payment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
