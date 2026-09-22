// Manages dynamic HTML templates for automated system notifications.
// Provides layouts definitions, preview features, and template reset utilities.


import API from './api';

export const getTemplates = () => API.get('/email-templates');
export const getTemplate = (id) => API.get(`/email-templates/${id}`);
export const createTemplate = (data) => API.post('/email-templates', data);
export const updateTemplate = (id, data) => API.put(`/email-templates/${id}`, data);
export const deleteTemplate = (id) => API.delete(`/email-templates/${id}`);
export const previewTemplate = (id, variables) => API.post(`/email-templates/${id}/preview`, { variables });
export const seedDefaultTemplates = () => API.post('/email-templates/seed');
