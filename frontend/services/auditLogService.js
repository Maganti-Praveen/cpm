// Pulls system activity records and logs of administrator actions from the backend database.
// Supports security tracking and compliance monitoring across the organization.


import api from "./api";

const auditLogService = {
  getAuditLogs: async (page = 1, limit = 15, search = '', entity = 'All', action = 'All', userId = 'All') => {
    let url = `/audit-logs?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (entity !== 'All') url += `&entity=${encodeURIComponent(entity)}`;
    if (action !== 'All') url += `&action=${encodeURIComponent(action)}`;
    if (userId !== 'All') url += `&userId=${encodeURIComponent(userId)}`;
    
    const response = await api.get(url);
    return response.data;
  },
};

export default auditLogService;
