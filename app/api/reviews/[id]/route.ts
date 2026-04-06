import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { deleteReviewById, getReviews, getUploadsDir, saveReviews, Review } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = await deleteReviewById(id);

  if (!deleted) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const reviews = await getReviews();
    const index = reviews.findIndex((review) => review.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const existing = reviews[index];
    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const rating = Number(formData.get("rating"));
    const panels = Number(formData.get("panels"));
    const acquisitionType = String(formData.get("acquisitionType") ?? "").trim();
    const testimonial = String(formData.get("testimonial") ?? "").trim();
    const customerPhoto = formData.get("customerPhoto");
    const houseBeforePhoto = formData.get("houseBeforePhoto");
    const houseAfterPhoto = formData.get("houseAfterPhoto");

    if (!name) {
      return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }
    if (!Number.isInteger(panels) || panels <= 0) {
      return NextResponse.json({ error: "Panels must be a positive number." }, { status: 400 });
    }
    if (acquisitionType !== "They called us" && acquisitionType !== "We knocked") {
      return NextResponse.json({ error: "Invalid acquisition type." }, { status: 400 });
    }

    async function uploadFile(file: File) {
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

    async function removeUpload(url?: string) {
      if (!url || !url.startsWith("/uploads/")) {
        return;
      }
      const filename = path.basename(url);
      const filePath = path.join(getUploadsDir(), filename);
      try {
        await fs.unlink(filePath);
      } catch {
        // File may be static sample or already removed.
      }
    }

    let houseBeforePhotoUrl = existing.houseBeforePhotoUrl;
    if (houseBeforePhoto instanceof File && houseBeforePhoto.size > 0) {
      houseBeforePhotoUrl = await uploadFile(houseBeforePhoto);
      if (houseBeforePhotoUrl !== existing.houseBeforePhotoUrl) {
        await removeUpload(existing.houseBeforePhotoUrl);
      }
    }

    let houseAfterPhotoUrl = existing.houseAfterPhotoUrl;
    if (houseAfterPhoto instanceof File && houseAfterPhoto.size > 0) {
      houseAfterPhotoUrl = await uploadFile(houseAfterPhoto);
      if (houseAfterPhotoUrl !== existing.houseAfterPhotoUrl) {
        await removeUpload(existing.houseAfterPhotoUrl);
      }
    }

    let customerPhotoUrl = existing.customerPhotoUrl;
    if (customerPhoto instanceof File && customerPhoto.size > 0) {
      customerPhotoUrl = await uploadFile(customerPhoto);
      if (customerPhotoUrl !== existing.customerPhotoUrl) {
        await removeUpload(existing.customerPhotoUrl);
      }
    }

    const updated: Review = {
      ...existing,
      name,
      rating,
      panels,
      acquisitionType,
      testimonial: testimonial || undefined,
      houseBeforePhotoUrl,
      houseAfterPhotoUrl,
      customerPhotoUrl,
    };

    reviews[index] = updated;
    await saveReviews(reviews);

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Unable to update review." }, { status: 500 });
  }
}
