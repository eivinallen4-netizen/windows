import Image from "next/image";
import type { ReactNode } from "react";

function isDirectBackdrop(url: string) {
  return url.startsWith("/uploads/") || url.startsWith("/api/files?");
}

/** Resolved URL for the faint full-page background (`pageBackdropImageUrl` from the public business snapshot). */
export type PublicPageBackgroundImageUrl = string;

type PublicMarketingShellProps = {
  backgroundImageUrl?: PublicPageBackgroundImageUrl;
  children: ReactNode;
};

export function PublicMarketingShell({ backgroundImageUrl, children }: PublicMarketingShellProps) {
  const backdrop = backgroundImageUrl?.trim();
  return (
    <div className="app-page-shell-soft relative overflow-hidden">
      {backdrop ? (
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <Image
            src={backdrop}
            alt=""
            fill
            className="object-cover opacity-[0.06] sm:opacity-[0.09]"
            sizes="100vw"
            unoptimized={isDirectBackdrop(backdrop)}
          />
        </div>
      ) : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
