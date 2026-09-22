import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import prisma from "../config/prisma.js";
import path from "path";

async function getS3Client() {
  const envBucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;
  const envRegion = process.env.S3_REGION || process.env.AWS_REGION;
  const envAccessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const envSecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const envEndpoint = process.env.S3_ENDPOINT;

  let bucket, region, accessKeyId, secretAccessKey, endpoint;

  if (envBucket && envRegion && envAccessKeyId && envSecretAccessKey) {
    bucket = envBucket;
    region = envRegion;
    accessKeyId = envAccessKeyId;
    secretAccessKey = envSecretAccessKey;
    endpoint = envEndpoint;
  } else {
    const settings = await prisma.siteSettings.findUnique({
      where: { singletonId: 1 },
      select: {
        s3Bucket: true,
        s3Region: true,
        s3AccessKeyId: true,
        s3SecretAccessKey: true,
        s3Endpoint: true,
      },
    });

    if (
      !settings ||
      !settings.s3Bucket ||
      !settings.s3Region ||
      !settings.s3AccessKeyId ||
      !settings.s3SecretAccessKey
    ) {
      throw new Error("AWS S3 is not fully configured in Env or Site Settings.");
    }

    bucket = settings.s3Bucket;
    region = settings.s3Region;
    accessKeyId = settings.s3AccessKeyId;
    secretAccessKey = settings.s3SecretAccessKey;
    endpoint = settings.s3Endpoint;
  }

  const clientConfig = {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };

  // If a custom endpoint is specified (e.g. MinIO, DigitalOcean Spaces, etc.)
  if (endpoint) {
    clientConfig.endpoint = endpoint;
    // Force path style is often needed for custom endpoints (like minio)
    clientConfig.forcePathStyle = true;
  }

  const client = new S3Client(clientConfig);
  return { client, bucket, region, endpoint };
}

export async function uploadFile(file) {
  console.log("Uploading to S3 Storage");
  const { client, bucket, region, endpoint } = await getS3Client();

  const ext = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "_");
  const key = `documents/${baseName}-${Date.now()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await client.send(command);

  // Return the public URL. S3 standard URL is:
  // https://[bucket].s3.[region].amazonaws.com/[key]
  // Or if custom endpoint is used, we construct using endpoint.
  if (endpoint) {
    // Remove trailing slash if present
    const cleanEndpoint = endpoint.replace(/\/$/, "");
    return `${cleanEndpoint}/${bucket}/${key}`;
  }

  return `https://${bucket}.s3.${region || "us-east-1"}.amazonaws.com/${key}`;
}

export async function deleteFile(fileUrl) {
  if (!fileUrl) return;
  console.log("Deleting from S3 Storage:", fileUrl);
  try {
    const { client, bucket } = await getS3Client();
    
    // Extract key from URL
    // URL pattern: https://[bucket].s3.[region].amazonaws.com/[key]
    // Or [endpoint]/[bucket]/[key]
    let key = "";
    if (fileUrl.includes("amazonaws.com/")) {
      key = fileUrl.split("amazonaws.com/")[1];
    } else {
      // For custom endpoints, path format is: endpoint/bucket/key
      // e.g. http://localhost:9000/my-bucket/documents/...
      const parts = fileUrl.split(`/${bucket}/`);
      if (parts.length > 1) {
        key = parts[1];
      }
    }

    if (!key) {
      console.warn("Could not parse S3 key from URL:", fileUrl);
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
  } catch (error) {
    console.warn("AWS S3 delete failed for", fileUrl, error.message);
  }
}

// Connectivity test helper
export async function testS3Connection(bucket, region, accessKeyId, secretAccessKey, endpoint) {
  try {
    const clientConfig = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    if (endpoint) {
      clientConfig.endpoint = endpoint;
      clientConfig.forcePathStyle = true;
    }

    const client = new S3Client(clientConfig);
    // Put a tiny test file and delete it immediately to verify permissions
    const key = `test-connection-${Date.now()}.txt`;
    
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: "connection-test",
      ContentType: "text/plain",
    }));

    await client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }));

    return { success: true, message: "Successfully connected to AWS S3 bucket!" };
  } catch (err) {
    return { success: false, message: err.message || "Failed to connect to AWS S3" };
  }
}
