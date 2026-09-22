// Processes user submissions from the public-facing contact form.
// Supports admin actions for reviewing, marking, and organizing inquiries.


import API from "./api";

export const getContactSubmissions = () => API.get("/contacts");

export const createContactSubmission = (data) => API.post("/contacts", data);

export const updateContactSubmission = (id, data) => API.put(`/contacts/${id}`, data);

export const deleteContactSubmission = (id) => API.delete(`/contacts/${id}`);

export const replyContactSubmission = (id, data) => API.post(`/contacts/${id}/reply`, data);

export const getContactReplies = (id) => API.get(`/contacts/${id}/replies`);

export const getSuspensionInquiries = () => API.get("/contacts/suspension-inquiries");

export const reactivateSuspendedUser = (id) => API.post(`/contacts/suspension-inquiries/${id}/reactivate`);

