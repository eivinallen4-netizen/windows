import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";

const scriptPdfPath = "/window%20cleaning%20%20pitch.pdf";
export const metadata: Metadata = {
  title: "Script",
};

export default function ScriptPage() {
  return (
    <div className="app-page-shell">
      <SiteHeader />
      <main className="px-4 py-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="app-surface-panel">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Script
                </p>
                <h1 className="truncate text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                  Window Cleaning Pitch
                </h1>
              </div>
              <a
                href={scriptPdfPath}
                target="_blank"
                rel="noreferrer"
                className="app-link-pill shrink-0"
              >
                Open
              </a>
            </div>

            <iframe
              src={scriptPdfPath}
              title="Window Cleaning Pitch PDF"
              width="100%"
              height="900"
              className="block min-h-[82vh] w-full border-0 bg-white"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
