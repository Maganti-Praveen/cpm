// Customizes platform access regulations, login retries limits, and password criteria.
// Applies administrative system safety configurations.


import API from './api';

export const getSecuritySettings = () => API.get('/security-settings');
export const updateSecuritySettings = (data) => API.put('/security-settings', data);
