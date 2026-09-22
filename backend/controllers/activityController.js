import prisma from "../config/prisma.js";
import { getCache, setCache } from "../utils/cache.js";

// Fetch activity feed for a project
export const getActivities = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId required" });
    }

    const cacheKey = `activities:list:${projectId}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const activities = await prisma.activity.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { createdAt: "desc" }
    });

    await setCache(cacheKey, activities, 3600);

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
