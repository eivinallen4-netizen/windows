import { promises as fs } from "fs";
import path from "path";
import { deleteStoredObject, toPublicObjectUrl } from "@/lib/object-storage";
import { hasTursoConfig, tursoExecute } from "@/lib/turso";

export type AcquisitionType = "They called us" | "We knocked";

export type Review = {
  id: string;
  customerPhotoUrl?: string;
  houseBeforePhotoUrl: string;
  houseAfterPhotoUrl?: string;
  name: string;
  rating: number;
  panels: number;
  acquisitionType: AcquisitionType;
  testimonial?: string;
  job_id?: string;
  tech_email?: string;
  createdAt: string;
};

type StoredReview = Partial<Review> & {
  photoUrl?: string;
  housePhotoUrl?: string;
  acquisitionType?: string;
};

const dataDir = path.join(process.cwd(), "data");
const dataFilePath = path.join(dataDir, "reviews.json");

function normalizeReview(item: StoredReview): Review | null {
  const acquisitionRaw = String(item.acquisitionType ?? "").toLowerCase();
  const acquisitionType: AcquisitionType =
    acquisitionRaw.includes("knock") ? "We knocked" : "They called us";

  const houseBeforePhotoUrl =
    item.houseBeforePhotoUrl || item.housePhotoUrl || item.photoUrl || "/uploads/sample-house-1.svg";

  if (!item.id || !item.name || !item.rating || !item.panels || !item.createdAt) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    rating: item.rating,
    panels: item.panels,
    acquisitionType,
    testimonial: item.testimonial,
    job_id: item.job_id,
    tech_email: item.tech_email,
    createdAt: item.createdAt,
    houseBeforePhotoUrl,
    houseAfterPhotoUrl: item.houseAfterPhotoUrl,
    customerPhotoUrl: item.customerPhotoUrl || item.photoUrl,
  };
}

function materializeReview(review: Review): Review {
  return {
    ...review,
    customerPhotoUrl: toPublicObjectUrl(review.customerPhotoUrl),
    houseBeforePhotoUrl: toPublicObjectUrl(review.houseBeforePhotoUrl) || "/uploads/sample-house-1.svg",
    houseAfterPhotoUrl: toPublicObjectUrl(review.houseAfterPhotoUrl),
  };
}

async function getStoredReviews(): Promise<Review[]> {
  if (hasTursoConfig()) {
    const result = await tursoExecute("SELECT data FROM reviews ORDER BY created_at DESC, id DESC");
    return result.rows
      .map((row) => {
        try {
          return normalizeReview(JSON.parse(String(row.data)) as StoredReview);
        } catch {
          return null;
        }
      })
      .filter((entry): entry is Review => Boolean(entry));
  }

  try {
    const raw = await fs.readFile(dataFilePath, "utf8");
    const parsed = JSON.parse(raw) as StoredReview[];
    return parsed
      .map(normalizeReview)
      .filter((entry): entry is Review => Boolean(entry));
  } catch {
    return [];
  }
}

export async function getReviews(): Promise<Review[]> {
  const reviews = await getStoredReviews();
  return reviews.map(materializeReview);
}

export async function getStoredReviewById(id: string): Promise<Review | null> {
  const reviews = await getStoredReviews();
  return reviews.find((review) => review.id === id) ?? null;
}

export async function saveReviews(reviews: Review[]) {
  if (hasTursoConfig()) {
    await tursoExecute("DELETE FROM reviews");
    for (const review of reviews) {
      await tursoExecute({
        sql: "INSERT INTO reviews (id, created_at, job_id, tech_email, data) VALUES (?, ?, ?, ?, ?)",
        args: [
          review.id,
          review.createdAt,
          review.job_id ?? null,
          review.tech_email ?? null,
          JSON.stringify(review),
        ],
      });
    }
    return;
  }

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(reviews, null, 2), "utf8");
}

export async function addReview(review: Review): Promise<Review> {
  const reviews = await getStoredReviews();
  reviews.push(review);
  await saveReviews(reviews);
  return materializeReview(review);
}

export async function updateReview(review: Review): Promise<Review> {
  const reviews = await getStoredReviews();
  const index = reviews.findIndex((entry) => entry.id === review.id);
  if (index === -1) {
    throw new Error("Review not found.");
  }
  reviews[index] = review;
  await saveReviews(reviews);
  return materializeReview(review);
}

export async function deleteReviewById(id: string): Promise<Review | null> {
  const reviews = await getStoredReviews();
  const target = reviews.find((review) => review.id === id) ?? null;

  if (!target) {
    return null;
  }

  const remaining = reviews.filter((review) => review.id !== id);
  await saveReviews(remaining);

  await deleteStoredObject(target.customerPhotoUrl);
  await deleteStoredObject(target.houseBeforePhotoUrl);
  await deleteStoredObject(target.houseAfterPhotoUrl);

  return materializeReview(target);
}
