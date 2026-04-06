"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, Upload } from "lucide-react";
import { Review } from "@/lib/reviews";
import { StarRating } from "./star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  name: string;
  rating: number;
  panels: number;
  acquisitionType: "They called us" | "We knocked";
  testimonial: string;
  customerPhoto: File | null;
  houseBeforePhoto: File | null;
  houseAfterPhoto: File | null;
};

type AdminPanelProps = {
  initialReviews: Review[];
  className?: string;
};

const initialForm: FormState = {
  name: "",
  rating: 5,
  panels: 0,
  acquisitionType: "They called us",
  testimonial: "",
  customerPhoto: null,
  houseBeforePhoto: null,
  houseAfterPhoto: null,
};

export function AdminPanel({ initialReviews, className }: AdminPanelProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<string>("");
  const [uploadKey, setUploadKey] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadReviews() {
    const response = await fetch("/api/reviews", { cache: "no-store" });
    if (!response.ok) {
      setStatus("Failed to load reviews.");
      return;
    }
    const data = (await response.json()) as Review[];
    setReviews(data);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId && !form.houseBeforePhoto) {
      setStatus("House before photo is required.");
      return;
    }

    setStatus(editingId ? "Updating review..." : "Saving review...");
    const body = new FormData();
    body.append("name", form.name.trim());
    body.append("rating", String(form.rating));
    body.append("panels", String(form.panels));
    body.append("acquisitionType", form.acquisitionType);
    if (form.testimonial.trim()) {
      body.append("testimonial", form.testimonial.trim());
    }
    if (form.customerPhoto) {
      body.append("customerPhoto", form.customerPhoto);
    }
    if (form.houseBeforePhoto) {
      body.append("houseBeforePhoto", form.houseBeforePhoto);
    }
    if (form.houseAfterPhoto) {
      body.append("houseAfterPhoto", form.houseAfterPhoto);
    }

    const response = await fetch(editingId ? `/api/reviews/${editingId}` : "/api/reviews", {
      method: editingId ? "PUT" : "POST",
      body,
    });
    if (!response.ok) {
      const errorText = await response.text();
      setStatus(`${editingId ? "Failed to update review." : "Failed to save review."} ${errorText}`);
      return;
    }

    setForm(initialForm);
    setUploadKey((prev) => prev + 1);
    setEditingId(null);
    setStatus(editingId ? "Updated." : "Saved.");
    await loadReviews();
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setStatus("Delete failed.");
      return;
    }
    setStatus("Deleted.");
    await loadReviews();
  }

  function startEdit(review: Review) {
    setEditingId(review.id);
    setForm({
      name: review.name,
      rating: review.rating,
      panels: review.panels,
      acquisitionType: review.acquisitionType,
      testimonial: review.testimonial ?? "",
      customerPhoto: null,
      houseBeforePhoto: null,
      houseAfterPhoto: null,
    });
    setUploadKey((prev) => prev + 1);
    setStatus(`Editing ${review.name}. Upload new photos to replace existing ones.`);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setUploadKey((prev) => prev + 1);
    setStatus("");
  }

  useEffect(() => {
    if (initialReviews.length === 0) {
      loadReviews().catch(() => {
        setStatus("Failed to load reviews.");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`grid w-full gap-6 lg:grid-cols-[1.1fr,1fr] ${className ?? ""}`}>
      <Card className="h-fit border border-slate-800 bg-[#0f172a] text-white">
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription className="text-slate-400">
            Before photo required. After and profile photos optional.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Customer Name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="bg-[#1e293b] border-slate-800 text-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="house-before" className="text-slate-300">House Before Photo (required)</Label>
                <Input
                  id="house-before"
                  key={`before-${uploadKey}`}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, houseBeforePhoto: event.target.files?.[0] ?? null }))
                  }
                  className="bg-[#1e293b] border-slate-800 text-slate-200 file:text-slate-200"
                />
                {editingId ? (
                  <p className="text-xs text-slate-400">Leave blank to keep the existing before photo.</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="house-after" className="text-slate-300">House After Photo (optional)</Label>
                <Input
                  id="house-after"
                  key={`after-${uploadKey}`}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, houseAfterPhoto: event.target.files?.[0] ?? null }))
                  }
                  className="bg-[#1e293b] border-slate-800 text-slate-200 file:text-slate-200"
                />
                {editingId ? (
                  <p className="text-xs text-slate-400">Leave blank to keep the existing after photo.</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile" className="text-slate-300">Profile Photo (optional)</Label>
              <Input
                id="profile"
                key={`pfp-${uploadKey}`}
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, customerPhoto: event.target.files?.[0] ?? null }))
                }
                className="bg-[#1e293b] border-slate-800 text-slate-200 file:text-slate-200"
              />
              {editingId ? (
                <p className="text-xs text-slate-400">Leave blank to keep the existing profile photo.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Star Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    type="button"
                    size="icon-sm"
                    variant={star <= form.rating ? "default" : "outline"}
                    onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
                    aria-label={`Set ${star} star rating`}
                  >
                    {star}
                  </Button>
                ))}
              </div>
              <StarRating rating={form.rating} className="text-amber-500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="panels" className="text-slate-300">Number of Panels</Label>
              <Input
                id="panels"
                required
                min={1}
                type="number"
                value={form.panels}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, panels: Number(event.target.value) || 0 }))
                }
                className="bg-[#1e293b] border-slate-800 text-white"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-slate-300">Acquisition Type</Label>
              <RadioGroup
                value={form.acquisitionType}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, acquisitionType: value as FormState["acquisitionType"] }))
                }
                className="grid gap-2 sm:grid-cols-2"
              >
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 border-slate-800 bg-[#0f172a]">
                  <RadioGroupItem value="They called us" id="called" />
                  <span className="text-sm text-slate-200">They Called</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 border-slate-800 bg-[#0f172a]">
                  <RadioGroupItem value="We knocked" id="knocked" />
                  <span className="text-sm text-slate-200">We Knocked</span>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testimonial" className="text-slate-300">Testimonial (optional)</Label>
              <Textarea
                id="testimonial"
                rows={3}
                value={form.testimonial}
                onChange={(event) => setForm((prev) => ({ ...prev, testimonial: event.target.value }))}
                className="bg-[#1e293b] border-slate-800 text-white"
              />
            </div>

            <Button type="submit" className="w-full">
              <Upload className="size-4" />
              {editingId ? "Update Review" : "Save Review"}
            </Button>

            {editingId ? (
              <Button type="button" variant="outline" className="w-full" onClick={cancelEdit}>
                Cancel Edit
              </Button>
            ) : null}

            {status && <p className="text-sm text-slate-400">{status}</p>}
          </form>
        </CardContent>
      </Card>

      <Card className="border border-slate-800 bg-[#0f172a] text-white">
        <CardHeader>
          <CardTitle>Existing Reviews</CardTitle>
          <CardDescription className="text-slate-400">{reviews.length} total records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-slate-800 bg-[#0f172a] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar>
                      <AvatarImage src={review.customerPhotoUrl} alt={review.name} />
                    <AvatarFallback className="bg-[#1e293b]">
                      <Image src="/logo.png" alt="PureBin logo" width={20} height={20} className="size-5 object-contain" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{review.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{review.panels} panels</p>
                    <StarRating rating={review.rating} className="mt-1 text-amber-500" />
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge
                        variant="secondary"
                        className="border border-slate-700 bg-[#111b33] text-slate-200 hover:bg-[#111b33]"
                      >
                        {review.acquisitionType}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border border-slate-700 bg-[#0b1222] text-slate-300"
                      >
                        {review.houseAfterPhotoUrl ? "Before + After" : "Before only"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    onClick={() => startEdit(review)}
                    aria-label={`Edit ${review.name}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="destructive"
                    onClick={() => handleDelete(review.id)}
                    aria-label={`Delete ${review.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <Separator className="my-3" />
              <p className="line-clamp-2 text-xs text-slate-400">
                {review.testimonial ? `"${review.testimonial}"` : "No testimonial provided."}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
