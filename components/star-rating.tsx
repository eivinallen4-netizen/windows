import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  className?: string;
};

export function StarRating({ rating, className }: StarRatingProps) {
  return (
    <div aria-label={`${rating} out of 5 stars`} className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating;
        return (
          <Star
            key={star}
            className="size-4"
            fill={filled ? "currentColor" : "transparent"}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}