"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(11,111,178,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f3f7fb_55%,_#eef4f8_100%)]">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-3xl items-center px-4 py-10">
        <section className="w-full rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur sm:p-10">
          <div className="space-y-5">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600">
              <AlertTriangle className="size-7" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0b6fb2]">
                Something Broke
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                The page hit an error, but the app stayed up.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Try the action again or reset this screen. The error was caught so the rest of the app
                does not crash out.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" className="gap-2" onClick={reset}>
                <RotateCcw className="size-4" />
                Try Again
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/">Back Home</Link>
              </Button>
            </div>
            {error.digest ? (
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Error digest: {error.digest}
              </p>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
