import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { addReview, getUploadsDir, type Review } from "@/lib/reviews";
import type { JobRecord } from "@/lib/jobs";

export type ReviewFormValues = {
  name: string;
  rating: number;
  panels: number;
  acquisitionType: string;
  testimonial: string;
  customerPhoto: FormDataEntryValue | null;
  houseBeforePhoto: FormDataEntryValue | null;
  houseAfterPhoto: FormDataEntryValue | null;
};

type ReviewValidationOptions = {
  requireBeforePhoto?: boolean;
  requireAfterPhoto?: boolean;
};

type CreateReviewOptions = {
  beforePhotoUrl?: string;
};

export function readReviewFormData(formData: FormData): ReviewFormValues {
  return {
    name: String(formData.get("name") ?? "").trim(),
    rating: Number(formData.get("rating")),
    panels: Number(formData.get("panels")),
    acquisitionType: String(formData.get("acquisitionType") ?? "").trim(),
    testimonial: String(formData.get("testimonial") ?? "").trim(),
    customerPhoto: formData.get("customerPhoto"),
    houseBeforePhoto: formData.get("houseBeforePhoto"),
    houseAfterPhoto: formData.get("houseAfterPhoto"),
  };
}

export function validateReviewFormValues(
  values: ReviewFormValues,
  options: ReviewValidationOptions = {}
) {
  const { requireBeforePhoto = true, requireAfterPhoto = false } = options;

  if (!values.name) {
    return "Customer name is required.";
  }
  if (!Number.isInteger(values.rating) || values.rating < 1 || values.rating > 5) {
    return "Rating must be between 1 and 5.";
  }
  if (!Number.isInteger(values.panels) || values.panels <= 0) {
    return "Panels must be a positive number.";
  }
  if (values.acquisitionType !== "They called us" && values.acquisitionType !== "We knocked") {
    return "Invalid acquisition type.";
  }
  if (
    requireBeforePhoto &&
    (!(values.houseBeforePhoto instanceof File) || values.houseBeforePhoto.size <= 0)
  ) {
    return "House before photo is required.";
  }
  if (
    requireAfterPhoto &&
    (!(values.houseAfterPhoto instanceof File) || values.houseAfterPhoto.size <= 0)
  ) {
    return "House after photo is required.";
  }

  return null;
}

export async function uploadPhotoFile(file: File) {
  const uploadsDir = getUploadsDir();
  await fs.mkdir(uploadsDir, { recursive: true });

  const extensionFromName = path.extname(file.name).replace(".", "").toLowerCase();
  const extensionFromType = file.type.split("/")[1]?.toLowerCase();
  const extension = extensionFromName || extensionFromType || "jpg";
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  const filePath = path.join(uploadsDir, filename);
  const bytes = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(bytes));
  return `/uploads/${filename}`;
}

export async function createReviewForJob(
  job: JobRecord,
  techEmail: string,
  values: ReviewFormValues,
  options: CreateReviewOptions = {}
): Promise<Review> {
  const houseBeforePhotoUrl =
    options.beforePhotoUrl ||
    (values.houseBeforePhoto instanceof File && values.houseBeforePhoto.size > 0
      ? await uploadPhotoFile(values.houseBeforePhoto)
      : undefined);

  if (!houseBeforePhotoUrl) {
    throw new Error("House before photo is required.");
  }

  const houseAfterPhotoUrl =
    values.houseAfterPhoto instanceof File && values.houseAfterPhoto.size > 0
      ? await uploadPhotoFile(values.houseAfterPhoto)
      : undefined;
  const customerPhotoUrl =
    values.customerPhoto instanceof File && values.customerPhoto.size > 0
      ? await uploadPhotoFile(values.customerPhoto)
      : undefined;

  const review: Review = {
    id: `${Date.now()}-${randomUUID()}`,
    name: values.name,
    customerPhotoUrl,
    houseBeforePhotoUrl,
    houseAfterPhotoUrl,
    rating: values.rating,
    panels: values.panels,
    acquisitionType: values.acquisitionType as Review["acquisitionType"],
    testimonial: values.testimonial || undefined,
    job_id: job.id,
    tech_email: techEmail,
    createdAt: new Date().toISOString(),
  };

  return addReview(review);
}
