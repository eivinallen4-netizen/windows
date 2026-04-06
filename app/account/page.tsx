import type { Metadata } from "next";
import AccountForm from "./AccountForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Account",
};

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(11,111,178,0.18),_transparent_38%),linear-gradient(180deg,_#f8fbff_0%,_#edf4f9_100%)] px-4 py-10">
      <div className="mx-auto flex max-w-5xl justify-center">
        <AccountForm />
      </div>
    </div>
  );
}
