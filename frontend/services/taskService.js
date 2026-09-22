// Handles task allocations, priority flags, checklists, and activity log entries.
// Feeds kanban boards and assignees task trackers.

import API from "./api";

export const getTasks = (params) => API.get("/tasks", { params });

export const createTask = (data) => API.post("/tasks", data);

export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);

export const deleteTask = (id) => API.delete(`/tasks/${id}`);

export const bulkDeleteTasks = (ids) => API.post("/tasks/bulk-delete", { ids });

export const createComment = (taskId, data) => API.post(`/tasks/${taskId}/comments`, data);

// Uploads a task checklist CSV/Excel file using FormData to batch-import new project tasks.
export const importTasks = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/tasks/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Downloads the CSV template format as a binary blob for client import workflows.
export const downloadTaskTemplate = () => {
  return API.get("/tasks/import/template", {
    responseType: "blob",
  });
};

