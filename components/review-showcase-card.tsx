"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, Shrink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Review } from "@/lib/reviews";
import { StarRating } from "./star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ReviewShowcaseCardProps = {
  review: Review;
};

export function ReviewShowcaseCard({ review }: ReviewShowcaseCardProps) {
  const [position, setPosition] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hasAfter = Boolean(review.houseAfterPhotoUrl);
  const cardRef = useRef<HTMLElement>(null);
  const beforeIsUpload = review.houseBeforePhotoUrl.startsWith("/uploads/");
  const afterIsUpload = review.houseAfterPhotoUrl?.startsWith("/uploads/") ?? false;

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!cardRef.current || typeof document === "undefined") {
        setIsFullscreen(false);
        return;
      }
      setIsFullscreen(document.fullscreenElement === cardRef.current);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    if (!cardRef.current || typeof document === "undefined") {
      return;
    }

    if (!document.fullscreenElement) {
      await cardRef.current.requestFullscreen();
      setIsFullscreen(true);
      return;
    }

    await document.exitFullscreen();
    setIsFullscreen(false);
  }

  return (
    <article ref={cardRef} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-black shadow-lg sm:aspect-[16/10]">
      <Image
        src={review.houseBeforePhotoUrl}
        alt={`${review.name} house before cleaning`}
        fill
        className="object-cover"
        unoptimized={beforeIsUpload}
      />

      {hasAfter && review.houseAfterPhotoUrl && (
        <>
          <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
            <Image
              src={review.houseAfterPhotoUrl}
              alt={`${review.name} house after cleaning`}
              fill
              className="object-cover"
              unoptimized={afterIsUpload}
            />
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-white/95"
            style={{ left: `${position}%` }}
          />
          <div
            className="pointer-events-none absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white"
            style={{ left: `${position}%` }}
          >
            <div className="flex items-center gap-1">
              <ChevronLeft className="size-4" />
              <ChevronRight className="size-4" />
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
            className="absolute inset-0 z-20 h-full w-full cursor-col-resize opacity-0 touch-pan-x"
            aria-label="Before after slider"
          />
        </>
      )}

      <div className="absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/85 via-black/55 to-transparent p-3 text-white sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-10 border border-white/40 sm:size-12">
              <AvatarImage src={review.customerPhotoUrl} alt={review.name} />
              <AvatarFallback className="bg-white/90">
                <Image src="/logo.png" alt="BlueSky logo" width={24} height={24} className="size-6 object-contain" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-none tracking-tight sm:text-lg">{review.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-white/20 text-xs text-white hover:bg-white/20">
                  {review.acquisitionType}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-xs text-white hover:bg-white/20">
                  {review.panels} panels
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <StarRating rating={review.rating} className="text-yellow-300" />
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              onClick={toggleFullscreen}
              className="bg-black/65 text-white hover:bg-black/80"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Shrink className="size-4" /> : <Expand className="size-4" />}
            </Button>
          </div>
        </div>

        {review.testimonial && (
          <p className="mt-3 max-w-2xl rounded-lg bg-black/35 px-3 py-2 text-xs leading-snug text-white/95 sm:text-sm">
            &quot;{review.testimonial}&quot;
          </p>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setPosition(0)}
            disabled={!hasAfter}
            className="bg-black/65 text-white hover:bg-black/80"
          >
            Before
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setPosition(100)}
            disabled={!hasAfter}
            className="bg-black/65 text-white hover:bg-black/80"
          >
            {hasAfter ? "After" : "Single"}
          </Button>
        </div>
      </div>
    </article>
  );
}
