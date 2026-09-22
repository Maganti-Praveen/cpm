// Configures the platform's SMTP server credentials and tests mail connections.
// Supports setup validation for system notification deliveries.


import API from './api';

export const getEmailSettings = () => API.get('/email-settings');
export const updateEmailSettings = (data) => API.put('/email-settings', data);
export const testEmailConnection = (email) => API.post('/email-settings/test', { email });
export const getEmailStatus = () => API.get('/email-settings/status');
export const getEmailLogs = () => API.get('/email-settings/logs');
