// Interfaces with Stripe, PayPal, and bank configurations for online payments.
// Supplies checkout views with enabled gateway keys and connection statuses.


import API from "./api";

export const getAllPaymentGateways = () => API.get("/payment-gateways");

export const getEnabledPaymentGateways = () => API.get("/payment-gateways/enabled");

export const updatePaymentGateway = (id, data) => API.put(`/payment-gateways/${id}`, data);

// For QR code upload (multipart form data)
export const updatePaymentGatewayWithFile = (id, formData) =>
  API.put(`/payment-gateways/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
