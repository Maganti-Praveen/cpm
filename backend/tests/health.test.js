// This file defines automated integration tests for backend service diagnostic status routes.
// It uses supertest to assert active database and cache status fields responses.

import { jest } from "@jest/globals";

// Mock ml-regression to prevent ESM import issues with is-any-array in Jest
jest.mock("ml-regression", () => {
  return {
    SimpleLinearRegression: class {
      predict() { return 0; }
    }
  };
});

import request from "supertest";
import app from "../server.js";

describe("GET /health", () => {
  it("should return server health status", async () => {
    // Dispatch query request to the health monitoring path
    const res = await request(app).get("/health");
    
    // Assert response status code is successful
    expect(res.statusCode).toBe(200);
    
    // Verify response body properties presence
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("database");
    expect(res.body).toHaveProperty("redis");

    // Verify security headers are set by helmet
    expect(res.headers).not.toHaveProperty("x-frame-options"); // Relying on frameAncestors instead
    expect(res.headers).toHaveProperty("x-content-type-options");
    expect(res.headers).toHaveProperty("referrer-policy");
    expect(res.headers).toHaveProperty("content-security-policy");
  }, 30000);
});
