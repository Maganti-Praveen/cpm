import prisma from "../config/prisma.js";
import * as localStorage from "./localStorage.js";
import * as cloudinaryStorage from "./cloudinaryStorage.js";
import * as s3Storage from "./s3Storage.js";

class DynamicStorageProvider {
  async getProvider() {
    let provider = process.env.STORAGE_PROVIDER;
    console.log("ENV STORAGE_PROVIDER =", process.env.STORAGE_PROVIDER);

    if (provider) {
      provider = provider.trim().toLowerCase();
      console.log("Normalized Provider =", provider);
      if (provider === "aws") {
        provider = "s3";
      }
    }

    if (!provider) {
      try {
        const settings = await prisma.siteSettings.findUnique({
          where: { singletonId: 1 },
          select: { storageProvider: true }
        });
        provider = settings?.storageProvider || "local";
      } catch (err) {
        console.warn("Failed to fetch storage provider from DB, falling back to local:", err.message);
        provider = "local";
      }
    }

    if (provider) {
      provider = provider.trim().toLowerCase();
      if (provider === "aws") {
        provider = "s3";
      }
    }
    console.log("Selected Storage Provider:", provider);
    switch (provider) {
      case "local":
        return localStorage;
      case "cloudinary":
        return cloudinaryStorage;
      case "s3":
        return s3Storage;
      default:
        return localStorage;
    }
  }

  async uploadFile(file) {
    const provider = await this.getProvider();
    return provider.uploadFile(file);
  }

  async deleteFile(fileUrl) {
    if (!fileUrl) return;
    if (fileUrl.startsWith("http")) {
      if (fileUrl.includes("cloudinary.com")) {
        return cloudinaryStorage.deleteFile(fileUrl);
      } else {
        return s3Storage.deleteFile(fileUrl);
      }
    } else {
      return localStorage.deleteFile(fileUrl);
    }
  }
}

const dynamicProvider = new DynamicStorageProvider();

export function getStorageProvider() {
  return dynamicProvider;
}

