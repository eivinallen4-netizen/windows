import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { uploadPhotoFile } from "@/lib/job-review";
import { addReview, getReviews, type Review } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const reviews = await getReviews();
  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  try {
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
    if (!(houseBeforePhoto instanceof File) || houseBeforePhoto.size <= 0) {
      return NextResponse.json({ error: "House before photo is required." }, { status: 400 });
    }

    const houseBeforePhotoUrl = await uploadPhotoFile(houseBeforePhoto, "reviews");
    const houseAfterPhotoUrl =
      houseAfterPhoto instanceof File && houseAfterPhoto.size > 0
        ? await uploadPhotoFile(houseAfterPhoto, "reviews")
        : undefined;
    const customerPhotoUrl =
      customerPhoto instanceof File && customerPhoto.size > 0
        ? await uploadPhotoFile(customerPhoto, "reviews")
        : undefined;

    const review: Review = {
      id: `${Date.now()}-${randomUUID()}`,
      name,
      customerPhotoUrl,
      houseBeforePhotoUrl,
      houseAfterPhotoUrl,
      rating,
      panels,
      acquisitionType,
      testimonial: testimonial || undefined,
      createdAt: new Date().toISOString(),
    };

    const saved = await addReview(review);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create review." }, { status: 500 });
  }
}
