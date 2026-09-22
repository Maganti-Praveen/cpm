// Coordinates file management, uploads, and removal actions within shared folders.
// Bridges frontend file interactions with cloud storage resources.


import API from "./api";

export const getDocuments = (projectId) => API.get(`/documents`, { params: { projectId } });

export const uploadDocument = (formData) => {
  return API.post("/documents", formData);
};

export const deleteDocument = (id) => API.delete(`/documents/${id}`);

export const updateDocument = (id, formData) => {
  return API.put(`/documents/${id}`, formData);
};

// Check if Cloudinary is configured (requires auth)
export const checkCloudinaryStatus = () => API.get("/site-settings/cloudinary-status");
