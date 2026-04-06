"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertOctagon } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(11,111,178,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f3f7fb_55%,_#eef4f8_100%)] antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10">
          <section className="w-full rounded-[2rem] border border-white/70 bg-white/92 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur sm:p-10">
            <div className="space-y-5">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600">
                <AlertOctagon className="size-7" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0b6fb2]">
                  Global Error
                </p>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  A fatal error was caught before the app could white-screen.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  Reload this screen to retry. If it keeps happening, the error is now at least trapped in
                  a controlled fallback instead of crashing the entire app shell.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#0b6fb2] px-5 text-sm font-semibold text-white transition hover:bg-[#095d96]"
                >
                  Reload App
                </button>
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Go Home
                </Link>
              </div>
              {error.digest ? (
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Error digest: {error.digest}
                </p>
              ) : null}
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
