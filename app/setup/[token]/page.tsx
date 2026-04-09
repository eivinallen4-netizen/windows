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
    <div className="app-page-shell flex items-center justify-center px-4 py-10">
      <SetupForm token={token} />
    </div>
  );
}
