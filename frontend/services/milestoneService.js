// Manages progress thresholds, timelines, and phase boundaries of client projects.
// Supports scheduling targets and completion tracking controls.

import API from "./api";

export const getMilestones = (params) => API.get("/milestones", { params });

export const createMilestone = (data) => API.post("/milestones", data);

export const updateMilestone = (id, data) => API.put(`/milestones/${id}`, data);

export const deleteMilestone = (id) => API.delete(`/milestones/${id}`);

export const bulkDeleteMilestones = (ids) => API.post("/milestones/bulk-delete", { ids });

// Uploads a CSV/Excel file using FormData to batch-import milestones.
export const importMilestones = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/milestones/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Requests the default sample file template as a binary blob for client-side download.
export const downloadMilestoneTemplate = () => {
  return API.get("/milestones/import/template", {
    responseType: "blob",
  });
};

