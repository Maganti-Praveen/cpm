// Manages client project metadata, staff assignments, and budget variables.
// Connects management dashboards with core project profiles.

import API from "./api";

export const getProjects = (params) => API.get("/projects", { params });

export const getProjectById = (id) => API.get(`/projects/${id}`);

export const createProject = (data) => API.post("/projects", data);

export const updateProject = (id, data) => API.put(`/projects/${id}`, data);

export const deleteProject = (id) => API.delete(`/projects/${id}`);

// Uploads a project CSV/Excel file using FormData to batch-import new project profiles.
export const importProjects = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/projects/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Triggers batch deletion requests for all selected project IDs.
export const bulkDeleteProjects = (ids) => API.delete("/projects/bulk-delete", { data: { ids } });

// Sends batch field updates (e.g. status, dates, staff) to be applied across multiple projects.
export const bulkUpdateProjects = (data) => API.put("/projects/bulk-update", data);

// Downloads the CSV template format as a binary blob for client import workflows.
export const downloadImportTemplate = () => {
  return API.get("/projects/import/template", {
    responseType: "blob",
  });
};


