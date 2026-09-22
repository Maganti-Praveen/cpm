// Stores and modifies custom visual themes, dark/light flags, and color selections.
// Syncs branding setups with the browser layout wrapper.


import API from "./api";

export const getThemes = () => API.get("/themes");

export const createTheme = (data) => API.post("/themes", data);

export const updateTheme = (id, data) => API.put(`/themes/${id}`, data);

export const setDefaultTheme = (id) => API.put(`/themes/default/${id}`);

export const saveUserTheme = (themeId) => API.put("/users/theme", { themeId });
