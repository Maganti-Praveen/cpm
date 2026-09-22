import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinaryService.js";
import path from "path";

export async function uploadFile(file) {
  console.log("Cloudinary upload function called");
  const result = await uploadToCloudinary(file.buffer, {
    folder: "sai-crp/documents",
    resourceType: "auto",
  });

  return result.url;
}

export async function deleteFile(fileUrl) {
  if (!fileUrl) return;
  console.log("Deleting from Cloudinary Storage:", fileUrl);
  try {
    const urlParts = fileUrl.split("/upload/");
    if (urlParts.length > 1) {
      let publicId = urlParts[1];
      // Remove version prefix (v1234567890/)
      publicId = publicId.replace(/^v\d+\//, "");
      // Remove file extension
      publicId = publicId.replace(/\.[^/.]+$/, "");

      const ext = path.extname(fileUrl).toLowerCase();
      const isImage = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"].includes(ext);
      const resourceType = isImage ? "image" : "raw";

      await deleteFromCloudinary(publicId, resourceType);
    }
  } catch (error) {
    console.warn("Cloudinary delete failed:", error.message);
  }
}
