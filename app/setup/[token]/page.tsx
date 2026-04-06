import type { Metadata } from "next";
import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Set Up Account",
};

type SetupPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SetupPage({ params }: SetupPageProps) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(11,111,178,0.18),_transparent_38%),linear-gradient(180deg,_#f8fbff_0%,_#edf4f9_100%)] flex items-center justify-center px-4 py-10">
      <SetupForm token={token} />
    </div>
  );
}
