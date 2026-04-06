import { promises as fs } from "fs";
import path from "path";

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
const uploadsDir = path.join(process.cwd(), "public", "uploads");

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadsDir, { recursive: true });

  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, "[]", "utf8");
  }
}

export async function getReviews(): Promise<Review[]> {
  await ensureStorage();
  const raw = await fs.readFile(dataFilePath, "utf8");

  try {
    const parsed = JSON.parse(raw) as StoredReview[];
    const normalized = parsed.reduce<Review[]>((acc, item) => {
        const acquisitionRaw = String(item.acquisitionType ?? "").toLowerCase();
        const acquisitionType: AcquisitionType =
          acquisitionRaw.includes("knock")
            ? "We knocked"
            : "They called us";

        const houseBeforePhotoUrl =
          item.houseBeforePhotoUrl || item.housePhotoUrl || item.photoUrl || "/uploads/sample-house-1.svg";

        if (!item.id || !item.name || !item.rating || !item.panels || !item.createdAt) {
          return acc;
        }

        acc.push({
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
        });
        return acc;
      }, []);

    return normalized.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function saveReviews(reviews: Review[]) {
  await ensureStorage();
  await fs.writeFile(dataFilePath, JSON.stringify(reviews, null, 2), "utf8");
}

export async function addReview(review: Review): Promise<Review> {
  const reviews = await getReviews();
  reviews.push(review);
  await saveReviews(reviews);
  return review;
}

export async function deleteReviewById(id: string): Promise<Review | null> {
  const reviews = await getReviews();
  const target = reviews.find((review) => review.id === id) ?? null;

  if (!target) {
    return null;
  }

  const remaining = reviews.filter((review) => review.id !== id);
  await saveReviews(remaining);

  const urls = [target.customerPhotoUrl, target.houseBeforePhotoUrl, target.houseAfterPhotoUrl];
  for (const url of urls) {
    if (!url || !url.startsWith("/uploads/")) {
      continue;
    }
    const filename = path.basename(url);
    const filePath = path.join(uploadsDir, filename);
    try {
      await fs.unlink(filePath);
    } catch {
      // File may be static sample or already removed.
    }
  }

  return target;
}

export function getUploadsDir() {
  return uploadsDir;
}
