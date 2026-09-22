// Coordinates billing collections, invoice generation, and credit ledgers.
// Interfaces with payment endpoints to record client financial transactions.


import API from "./api";

export const getInvoices = (params) => API.get("/invoices", { params });

export const getInvoiceById = (id) => API.get(`/invoices/${id}`);

export const createInvoice = (data) => API.post("/invoices", data);

export const updateInvoice = (id, data) => API.put(`/invoices/${id}`, data);

export const deleteInvoice = (id) => API.delete(`/invoices/${id}`);
