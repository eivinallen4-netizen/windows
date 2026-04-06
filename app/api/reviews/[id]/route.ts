import { NextResponse } from "next/server";
import { deleteStoredObject } from "@/lib/object-storage";
import { uploadPhotoFile } from "@/lib/job-review";
import { deleteReviewById, getStoredReviewById, updateReview, type Review } from "@/lib/reviews";

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
    const existing = await getStoredReviewById(id);

    if (!existing) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

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

    let houseBeforePhotoUrl = existing.houseBeforePhotoUrl;
    if (houseBeforePhoto instanceof File && houseBeforePhoto.size > 0) {
      houseBeforePhotoUrl = await uploadPhotoFile(houseBeforePhoto, "reviews");
      if (houseBeforePhotoUrl !== existing.houseBeforePhotoUrl) {
        await deleteStoredObject(existing.houseBeforePhotoUrl);
      }
    }

    let houseAfterPhotoUrl = existing.houseAfterPhotoUrl;
    if (houseAfterPhoto instanceof File && houseAfterPhoto.size > 0) {
      houseAfterPhotoUrl = await uploadPhotoFile(houseAfterPhoto, "reviews");
      if (houseAfterPhotoUrl !== existing.houseAfterPhotoUrl) {
        await deleteStoredObject(existing.houseAfterPhotoUrl);
      }
    }

    let customerPhotoUrl = existing.customerPhotoUrl;
    if (customerPhoto instanceof File && customerPhoto.size > 0) {
      customerPhotoUrl = await uploadPhotoFile(customerPhoto, "reviews");
      if (customerPhotoUrl !== existing.customerPhotoUrl) {
        await deleteStoredObject(existing.customerPhotoUrl);
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

    return NextResponse.json(await updateReview(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update review." }, { status: 500 });
  }
}
