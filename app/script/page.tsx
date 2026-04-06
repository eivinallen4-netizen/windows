import { SiteHeader } from "@/components/site-header";

const scriptPdfPath = "/window%20cleaning%20%20pitch.pdf";

export default function ScriptPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(11,111,178,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f3f7fb_55%,_#eef4f8_100%)]">
      <SiteHeader />
      <main className="px-4 py-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/88 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0b6fb2]">
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
                className="shrink-0 rounded-full border border-[#0b6fb2]/20 bg-[#0b6fb2]/8 px-4 py-2 text-sm font-semibold text-[#0b6fb2] transition hover:bg-[#0b6fb2]/12"
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
