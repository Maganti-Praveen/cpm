import { jest } from "@jest/globals";

// Mocking external modules and dependencies
jest.mock("ml-regression", () => ({
  SimpleLinearRegression: class {
    predict() { return 0; }
  }
}));

jest.mock("../utils/cache.js", () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(null),
  invalidateDocuments: jest.fn().mockResolvedValue(null)
}));

jest.mock("../utils/activityLogger.js", () => ({
  logActivity: jest.fn().mockResolvedValue(null)
}));

jest.mock("../services/cloudinaryService.js", () => ({
  isCloudinaryConfigured: jest.fn().mockResolvedValue(true),
  uploadToCloudinary: jest.fn().mockResolvedValue({ url: "http://cloudinary.mock/doc.pdf" }),
  deleteFromCloudinary: jest.fn().mockResolvedValue(null)
}));

jest.mock("../config/prisma.js", () => {
  global.mockPrisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    document: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    }
  };
  return {
    __esModule: true,
    default: global.mockPrisma
  };
});

import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../server.js";

const mockPrisma = global.mockPrisma;

const JWT_SECRET = process.env.JWT_SECRET || "sai-crp-jwt-secret-key-2026";

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET);
};

describe("Documents API endpoints", () => {
  let adminToken;
  let staffToken;
  let clientToken;

  const mockAdminUser = { id: 1, fullName: "Admin User", role: "ADMIN", isSuperAdmin: true, status: "Active" };
  const mockStaffUser = { id: 2, fullName: "Staff User", role: "STAFF", isSuperAdmin: false, status: "Active" };
  const mockClientUser = { id: 3, fullName: "Client User", role: "CLIENT", isSuperAdmin: false, status: "Active" };

  beforeEach(() => {
    jest.clearAllMocks();
    adminToken = generateToken(mockAdminUser.id);
    staffToken = generateToken(mockStaffUser.id);
    clientToken = generateToken(mockClientUser.id);
  });

  describe("GET /api/documents", () => {
    it("should return a list of documents for an admin", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrisma.document.findMany.mockResolvedValue([
        {
          id: 1,
          title: "Mock Doc",
          description: "A description",
          type: "LINK",
          fileUrl: "",
          linkUrl: "http://example.com",
          projectId: 10,
          createdAt: new Date(),
          project: {
            name: "Mock Project",
            client: { fullName: "Client John", company: "Acme Corp" },
            team: [{ fullName: "Staff Jane" }]
          },
          uploadedBy: { fullName: "Admin User", role: "ADMIN" }
        }
      ]);

      const res = await request(app)
        .get("/api/documents")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].title).toBe("Mock Doc");
      expect(mockPrisma.document.findMany).toHaveBeenCalled();
    });

    it("should handle error gracefully", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrisma.document.findMany.mockRejectedValue(new Error("Database connection error"));

      const res = await request(app)
        .get("/api/documents")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Database connection error");
    });
  });

  describe("POST /api/documents", () => {
    it("should allow staff to create a document for an assigned project", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockStaffUser);
      mockPrisma.project.findFirst.mockResolvedValue({ id: 10 }); // Project exists and user has access
      mockPrisma.document.create.mockResolvedValue({
        id: 101,
        title: "Test doc",
        description: "Test description",
        type: "LINK",
        fileUrl: "",
        linkUrl: "http://google.com",
        projectId: 10,
        createdAt: new Date(),
        uploadedBy: { fullName: "Staff User" },
        project: {
          name: "Mock Project",
          client: { fullName: "Client John", company: "Acme Corp" },
          team: [{ fullName: "Staff Jane" }]
        }
      });

      const res = await request(app)
        .post("/api/documents")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          title: "Test doc",
          description: "Test description",
          type: "LINK",
          linkUrl: "http://google.com",
          projectId: "10"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Test doc");
    });

    it("should reject staff if they are not assigned to the project", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockStaffUser);
      mockPrisma.project.findFirst.mockResolvedValue(null); // Not assigned

      const res = await request(app)
        .post("/api/documents")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          title: "Test doc",
          type: "LINK",
          linkUrl: "http://google.com",
          projectId: "10"
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Forbidden");
    });
  });

  describe("PUT /api/documents/:id", () => {
    it("should update document for Admin user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 101,
        title: "Old Title",
        projectId: 10,
        type: "LINK"
      });
      mockPrisma.document.update.mockResolvedValue({
        id: 101,
        title: "New Title",
        description: "Updated description",
        type: "LINK",
        fileUrl: "",
        linkUrl: "http://google.com",
        projectId: 10,
        createdAt: new Date(),
        uploadedBy: { fullName: "Admin User" },
        project: {
          name: "Mock Project",
          client: { fullName: "Client John", company: "Acme Corp" },
          team: []
        }
      });

      const res = await request(app)
        .put("/api/documents/101")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "New Title",
          description: "Updated description"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("New Title");
    });
  });

  describe("DELETE /api/documents/:id", () => {
    it("should delete document if user is Admin", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 101,
        title: "Doc to delete",
        projectId: 10,
        type: "LINK"
      });
      mockPrisma.document.delete.mockResolvedValue({ id: 101 });

      const res = await request(app)
        .delete("/api/documents/101")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Document deleted successfully");
    });
  });

  describe("GET /api/documents/download/:id", () => {
    it("should redirect to fileUrl if it is a cloud URL", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 101,
        type: "FILE",
        fileUrl: "http://mock-cloudinary/some-file.pdf"
      });

      const res = await request(app)
        .get("/api/documents/download/101")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe("http://mock-cloudinary/some-file.pdf");
    });
  });
});
