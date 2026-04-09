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
      <body className="app-page-shell antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10">
          <section className="app-surface-panel w-full p-8 sm:p-10">
            <div className="space-y-5">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600">
                <AlertOctagon className="size-7" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  Global Error
                </p>
                <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                  A fatal error was caught before the app could white-screen.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Reload this screen to retry. If it keeps happening, the error is now at least trapped in
                  a controlled fallback instead of crashing the entire app shell.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Reload App
                </button>
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground transition hover:bg-accent"
                >
                  Go Home
                </Link>
              </div>
              {error.digest ? (
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
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
