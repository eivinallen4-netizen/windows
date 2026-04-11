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
        "relative aspect-[16/9] max-h-[min(36vh,19rem)] w-full overflow-hidden rounded-[2rem] border border-white/80 bg-slate-200 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] sm:aspect-[2/1] sm:max-h-[min(40vh,22rem)]",
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
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/18 via-transparent to-sky-400/12"
        aria-hidden
      />
    </div>
  );
}
