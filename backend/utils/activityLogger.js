// Utility helper functions for managing activityLogger.
// Provides common reusable methods used across the backend application.

import prisma from "../config/prisma.js";
import { deleteCache, invalidateDashboardAndAnalytics } from "./cache.js";

// Function to handle logActivity operations
export const logActivity = async (projectId, title, description = "", type = "info") => {
  try {
    await prisma.activity.create({
      data: {
        title,
        description,
        type,
        projectId: parseInt(projectId)
      }
    });
    
    // Invalidate activities list cache and dashboard/analytics caches
    if (projectId) {
      await deleteCache(`activities:list:${projectId}`);
    }
    await invalidateDashboardAndAnalytics();
  } catch (error) {
    console.error("Failed to log activity:", error.message);
  }
};
