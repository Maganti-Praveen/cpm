// Middleware handler for managing auditMiddleware operations.
// Intercepts and filters HTTP requests before they reach route handlers.

import prisma from '../config/prisma.js';
import { invalidatePattern } from '../utils/cache.js';

// Function to handle auditMiddleware operations
export const auditMiddleware = async (req, res, next) => {
  res.on('finish', async () => {
    // Only log if the user is an admin and the method is a modifying one
    if (req.user && req.user.role === 'ADMIN' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      // Don't log if it failed (unless you want to log failed attempts too)
      if (res.statusCode >= 200 && res.statusCode < 400) {
        try {
          // Identify entity and nested IDs from URL
          const urlParts = req.originalUrl.split('?')[0].split('/').filter(Boolean);
          let entity = 'unknown';
          let entityId = null;

          if (urlParts.length >= 2) {
            entity = urlParts[1] || 'unknown';
            if (urlParts.length === 3) {
              entityId = urlParts[2];
            } else if (urlParts.length > 3) {
              const subPath = urlParts[2];
              if (['default', 'status', 'toggle', 'assign', 'update'].includes(subPath) || isNaN(Number(subPath))) {
                entityId = urlParts[3] || subPath;
              } else {
                entityId = subPath;
              }
            }
          }

          // Mask sensitive details
          let safeDetails = req.auditDetails || { ...req.body };
          if (safeDetails.password) delete safeDetails.password;
          if (safeDetails.token) delete safeDetails.token;

          let action = req.method;
          if (req.method === 'POST') action = 'CREATED';
          if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATED';
          if (req.method === 'DELETE') action = 'DELETED';

          let details = null;
          if (Object.keys(safeDetails).length > 0) {
            details = safeDetails;
          } else {
            // Provide a description for actions that do not have a request body
            let description = '';
            const rawUrl = req.originalUrl.split('?')[0];
            
            if (rawUrl.includes('/themes/default/')) {
              description = 'Set theme as default';
            } else if (rawUrl.includes('/users/theme')) {
              description = 'Updated user theme preference';
            } else if (action === 'DELETED') {
              description = `Deleted ${entity.replace(/s$/, '')} record`;
            } else {
              description = `${action.toLowerCase()} operation performed`;
              description = description.charAt(0).toUpperCase() + description.slice(1);
            }
            
            details = { description };
          }

          await prisma.auditLog.create({
            data: {
              userId: req.user.id,
              action,
              entity: entity.toUpperCase(),
              entityId: entityId ? String(entityId) : null,
              details,
            },
          });

          await invalidatePattern("auditlogs:list:*");
        } catch (error) {
          console.error('Failed to create audit log:', error);
        }
      }
    }
  });

  next();
};
