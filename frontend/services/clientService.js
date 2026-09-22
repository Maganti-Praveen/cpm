// Supports administrator workflows for onboarding clients and editing active client directories.
// Handles creating new client profiles and toggling status options.


import API from "./api";

export const getClients = () => API.get("/clients");

export const createClient = (data) => API.post("/clients", data);
