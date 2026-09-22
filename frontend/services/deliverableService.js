// Manages client project files submission and formal sign-offs.
// Integrates client review status changes with backend storage configurations.


import API from "./api";

export const getDeliverables = (projectId) => API.get(`/deliverables`, { params: { projectId } });

export const uploadDeliverable = (formData) => {
  return API.post("/deliverables", formData);
};

export const updateDeliverable = (id, data) => API.put(`/deliverables/${id}`, data);

export const deleteDeliverable = (id) => API.delete(`/deliverables/${id}`);
export const getActivities = (projectId) => API.get(`/activities`, { params: { projectId } });
