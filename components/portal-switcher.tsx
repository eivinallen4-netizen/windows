"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getHomePathForRole,
  getNextPortal,
  getPortalForPathname,
  getPortalLabel,
  getPreviousPortal,
  type AppRole,
} from "@/lib/portal-routes";

type PortalSwitcherProps = {
  role: AppRole;
  className?: string;
};

export function PortalSwitcher({ role, className }: PortalSwitcherProps) {
  const pathname = usePathname();
  const activePortal = getPortalForPathname(pathname);

  if (role !== "admin") {
    return (
      <div className={className}>
        <div className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold">
          {getPortalLabel(activePortal)}
        </div>
      </div>
    );
  }

  const previousPortal = getPreviousPortal(activePortal);
  const nextPortal = getNextPortal(activePortal);
  const previousHref = getHomePathForRole(previousPortal);
  const nextHref = getHomePathForRole(nextPortal);

  return (
    <div className={className}>
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1 shadow-sm">
        <Button asChild variant="ghost" size="icon" className="size-8 rounded-full" aria-label={`Switch to ${getPortalLabel(previousPortal)} portal`}>
          <Link href={previousHref}>
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-20 text-center text-sm font-semibold">
          {getPortalLabel(activePortal)}
        </div>
        <Button asChild variant="ghost" size="icon" className="size-8 rounded-full" aria-label={`Switch to ${getPortalLabel(nextPortal)} portal`}>
          <Link href={nextHref}>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
