// Service class or helper functions for cloudinary business logic.
// Contains operations for database queries, transformations, and system actions.

import { v2 as cloudinary } from "cloudinary";
import prisma from "../config/prisma.js";

// Cloudinary integration where credentials are read from SiteSettings DB rather than env variables.

// get cloudinary config from db
async function getCloudinaryCredentials() {
  const envCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const envApiKey = process.env.CLOUDINARY_API_KEY;
  const envApiSecret = process.env.CLOUDINARY_API_SECRET;

  if (envCloudName && envApiKey && envApiSecret) {
    return {
      cloudinaryCloudName: envCloudName,
      cloudinaryApiKey: envApiKey,
      cloudinaryApiSecret: envApiSecret,
    };
  }

  const settings = await prisma.siteSettings.findUnique({
    where: { singletonId: 1 },
    select: {
      cloudinaryCloudName: true,
      cloudinaryApiKey: true,
      cloudinaryApiSecret: true,
    },
  });
  return settings;
}

// setup cloudinary sdk with credentials
async function configureCloudinary() {
  const creds = await getCloudinaryCredentials();
  if (
    !creds ||
    !creds.cloudinaryCloudName ||
    !creds.cloudinaryApiKey ||
    !creds.cloudinaryApiSecret
  ) {
    return false;
  }
  cloudinary.config({
    cloud_name: creds.cloudinaryCloudName,
    api_key: creds.cloudinaryApiKey,
    api_secret: creds.cloudinaryApiSecret,
  });
  return true;
}

// public helpers

// check if config fields are populated
export async function isCloudinaryConfigured() {
  const creds = await getCloudinaryCredentials();
  return !!(
    creds &&
    creds.cloudinaryCloudName &&
    creds.cloudinaryApiKey &&
    creds.cloudinaryApiSecret
  );
}

// upload a file buffer to cloudinary
export async function uploadToCloudinary(fileBuffer, options = {}) {
  const configured = await configureCloudinary();
  if (!configured) {
    throw new Error("Cloudinary is not configured. Please set up credentials in Site Settings.");
  }

  const { folder = "sai-crp", publicId, resourceType = "auto" } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

// delete a file from cloudinary using its public ID
export async function deleteFromCloudinary(publicId, resourceType = "image") {
  if (!publicId) return;
  const configured = await configureCloudinary();
  if (!configured) {
    console.warn("Cloudinary not configured — skipping remote delete for", publicId);
    return;
  }
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.warn("Cloudinary delete failed for", publicId, err.message);
  }
}

// ping cloudinary to test configuration validity
export async function testCloudinaryConnection(cloudName, apiKey, apiSecret) {
  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    // A lightweight API call to verify credentials
    await cloudinary.api.ping();
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message || "Invalid Cloudinary credentials" };
  }
}
