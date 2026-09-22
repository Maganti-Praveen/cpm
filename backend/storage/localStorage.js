import fs from "fs";
import path from "path";

export async function uploadFile(file) {
  console.log("Local Storage upload function called");

  const dir = process.env.UPLOAD_PATH || "uploads/documents";

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const ext = path.extname(file.originalname);
  const baseName = path
    .basename(file.originalname, ext)
    .replace(/\s+/g, "_");

  const filename = `${baseName}-${Date.now()}${ext}`;

  fs.writeFileSync(path.join(dir, filename), file.buffer);

  return `/uploads/documents/${filename}`;
}

export async function deleteFile(fileUrl) {
  if (!fileUrl) return;
  console.log("Deleting from Local Storage:", fileUrl);
  try {
    const relativePath = fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
    const filePath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn("Local storage file delete failed:", error.message);
  }
}

