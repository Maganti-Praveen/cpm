// Audits incoming financial records and verifies payment authorization codes.
// Updates billing lists when payments clear external processors.


import API from "./api";

export const getTransactions = (params) => API.get("/transactions", { params });

export const createTransaction = (data) => API.post("/transactions", data);

export const verifyTransaction = (id, data) => API.put(`/transactions/${id}/verify`, data);
