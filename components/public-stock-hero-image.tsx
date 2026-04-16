import Image from "next/image";
import { cn } from "@/lib/utils";

type PublicStockHeroImageProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function PublicStockHeroImage({ src, alt, className, priority, sizes }: PublicStockHeroImageProps) {
  return (
    <div
      className={cn(
        "relative aspect-[16/10] max-h-[min(42vh,24rem)] w-full overflow-hidden rounded-sm border border-white/10 bg-slate-200 shadow-[0_24px_60px_-42px_rgba(8,15,26,0.45)] sm:aspect-[2/1] sm:max-h-[min(42vh,24rem)]",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes ?? "(max-width: 1024px) 100vw, 48rem"}
        priority={priority}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.18),rgba(2,6,23,0.52))]"
        aria-hidden
      />
    </div>
  );
}
