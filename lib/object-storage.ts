import "server-only";

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { deleteFromR2, getSignedR2UploadUrl, hasR2Config, uploadToR2 } from "@/lib/r2";
import { storedMediaToDisplayUrl } from "@/lib/stored-media-url";

const R2_REF_PREFIX = "r2:";
const uploadsDir = path.join(process.cwd(), "public", "uploads");

function getFileExtension(file: File) {
  const extensionFromName = path.extname(file.name).replace(".", "").toLowerCase();
  const extensionFromType = file.type.split("/")[1]?.toLowerCase();
  return extensionFromName || extensionFromType || "jpg";
}

export function getUploadsDir() {
  return uploadsDir;
}

export function isR2StoredRef(value?: string | null) {
  return Boolean(value?.startsWith(R2_REF_PREFIX));
}

export function getObjectKeyFromStoredRef(value: string) {
  return value.startsWith(R2_REF_PREFIX) ? value.slice(R2_REF_PREFIX.length) : value;
}

export function toPublicObjectUrl(value?: string | null) {
  if (!value) {
    return undefined;
  }

  if (isR2StoredRef(value)) {
    return storedMediaToDisplayUrl(value);
  }

  return value;
}

export async function uploadPhotoFileToStorage(file: File, prefix = "uploads") {
  const extension = getFileExtension(file);
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (hasR2Config()) {
    const key = `${prefix}/${filename}`;
    await uploadToR2(key, bytes, file.type || undefined);
    return `${R2_REF_PREFIX}${key}`;
  }

  await fs.mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, bytes);
  return `/uploads/${filename}`;
}

export async function deleteStoredObject(value?: string | null) {
  if (!value) {
    return;
  }

  if (isR2StoredRef(value)) {
    await deleteFromR2(getObjectKeyFromStoredRef(value));
    return;
  }

  if (!value.startsWith("/uploads/")) {
    return;
  }

  const filename = path.basename(value);
  const filePath = path.join(uploadsDir, filename);
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore missing local files.
  }
}

export async function createPresignedUpload(prefix: string, contentType?: string) {
  if (!hasR2Config()) {
    throw new Error("R2 is not configured.");
  }

  const key = `${prefix}/${randomUUID()}`;
  const url = await getSignedR2UploadUrl(key, contentType);
  return { key, url };
}
