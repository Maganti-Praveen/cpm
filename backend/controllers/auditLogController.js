import prisma from '../config/prisma.js';
import { getCache, setCache } from '../utils/cache.js';

// Function to handle getAuditLogs operations
export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, entity, action, userId } = req.query;

    const cacheKey = `auditlogs:list:${req.user.role}:${req.user.id}:${page}:${limit}:${search || ''}:${entity || ''}:${action || ''}:${userId || ''}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData.logs,
        pagination: cachedData.pagination
      });
    }

    let whereClause = {};

    const isSubAdmin = req.user.role === 'ADMIN' && !!req.user.adminRole;

    if (isSubAdmin) {
      whereClause.userId = req.user.id;
    } else {
      if (userId && userId !== 'All') {
        whereClause.userId = parseInt(userId);
      }
    }

    if (entity && entity !== 'All') {
      whereClause.entity = entity;
    }

    if (action && action !== 'All') {
      whereClause.action = action;
    }

    if (search) {
      whereClause.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    const paginationData = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, { logs, pagination: paginationData }, 3600);

    res.json({
      success: true,
      data: logs,
      pagination: paginationData,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching audit logs' });
  }
};
