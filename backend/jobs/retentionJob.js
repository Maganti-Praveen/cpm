// This file implements automatic database cleanup and email log archiving.
// It exposes functions to delete stale audit logs and store old email logs to JSONL files.

import fs from "fs";
import path from "path";
import prisma from "../config/prisma.js";

/**
 * Starts a background data retention job that runs every 24 hours
 */
export function startRetentionJob() {
  // Notify startup of retention monitoring job
  console.log("[Retention Job] Initialized and scheduled to run every 24 hours.");

  // Execute cleanup immediately on server boot and schedule periodic runs
  runRetentionCleanup();
  setInterval(runRetentionCleanup, 24 * 60 * 60 * 1000);
}

/**
 * Performs cleanup of audit logs and archives old email logs
 */
async function runRetentionCleanup() {
  console.log("[Retention Job] Starting scheduled cleanup and archiving tasks...");
  try {
    const now = new Date();

    // Calculate dates threshold for 90 days log retention
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    // Auto-delete database audit log entries older than 90 days
    const deletedAudits = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo }
      }
    });
    console.log(`[Retention Job] Successfully deleted ${deletedAudits.count} audit logs older than 90 days.`);

    // Calculate dates threshold for 30 days email logs archiving
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Retrieve email log entries that are older than 30 days
    const logsToArchive = await prisma.emailLog.findMany({
      where: {
        timestamp: { lt: thirtyDaysAgo }
      }
    });

    // Check if there are logs requiring file archiving
    if (logsToArchive.length > 0) {
      // Formulate target folder path for file storage
      const archiveDir = path.join(process.cwd(), "archive");
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      // Establish target log filename path
      const archivePath = path.join(archiveDir, "email_logs_archive.jsonl");
      
      // Open writable file stream to append parsed records
      const stream = fs.createWriteStream(archivePath, { flags: "a" });
      for (const log of logsToArchive) {
        stream.write(JSON.stringify(log) + "\n");
      }
      stream.end();

      // Prune successfully archived logs from target database table
      const deletedEmails = await prisma.emailLog.deleteMany({
        where: {
          id: { in: logsToArchive.map(l => l.id) }
        }
      });

      console.log(`[Retention Job] Successfully archived and deleted ${deletedEmails.count} email logs older than 30 days.`);
    } else {
      console.log("[Retention Job] No old email logs found to archive.");
    }
  } catch (error) {
    console.error("[Retention Job] Error running data retention tasks:", error.message);
  }
}
