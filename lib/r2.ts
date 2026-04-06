import "server-only";

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucketName = process.env.R2_BUCKET_NAME;

let client: S3Client | null = null;

function getClient() {
  if (client) {
    return client;
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  return client;
}

export function hasR2Config() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
  );
}

export async function uploadToR2(key: string, body: Buffer, contentType?: string) {
  if (!hasR2Config() || !bucketName) {
    throw new Error("R2 is not configured.");
  }

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function deleteFromR2(key: string) {
  if (!hasR2Config() || !bucketName) {
    return;
  }

  await getClient().send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

export async function getSignedR2DownloadUrl(key: string, expiresIn = 3600) {
  if (!hasR2Config() || !bucketName) {
    throw new Error("R2 is not configured.");
  }

  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
    { expiresIn }
  );
}

export async function getSignedR2UploadUrl(key: string, contentType?: string, expiresIn = 300) {
  if (!hasR2Config() || !bucketName) {
    throw new Error("R2 is not configured.");
  }

  return getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );
}
