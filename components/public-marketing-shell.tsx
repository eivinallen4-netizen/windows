import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function isDirectBackdrop(url: string) {
  return url.startsWith("/uploads/") || url.startsWith("/api/files?");
}

export type PublicPageBackgroundImageUrl = string;

type PublicMarketingShellProps = {
  backgroundImageUrl?: PublicPageBackgroundImageUrl;
  children: ReactNode;
  theme?: "dark" | "light";
};

export function PublicMarketingShell({
  backgroundImageUrl,
  children,
  theme = "dark",
}: PublicMarketingShellProps) {
  const backdrop = backgroundImageUrl?.trim();
  const isDark = theme === "dark";

  return (
    <div className={cn("relative overflow-hidden", isDark ? "marketing-site" : "marketing-page-light")}>
      {backdrop ? (
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <Image
            src={backdrop}
            alt=""
            fill
            className={cn("object-cover", isDark ? "opacity-[0.07]" : "opacity-[0.05]")}
            sizes="100vw"
            unoptimized={isDirectBackdrop(backdrop)}
          />
          <div
            className={cn(
              "absolute inset-0",
              isDark
                ? "bg-[linear-gradient(180deg,rgba(7,16,24,0.86),rgba(10,11,14,0.95))]"
                : "bg-[linear-gradient(180deg,rgba(243,241,236,0.92),rgba(235,232,226,0.97))]",
            )}
          />
        </div>
      ) : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
