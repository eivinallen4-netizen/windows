import type { Metadata } from "next";
import AccountForm from "./AccountForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Account",
};

export default function AccountPage() {
  return (
    <div className="app-page-shell px-4 py-10">
      <div className="mx-auto flex max-w-5xl justify-center">
        <AccountForm />
      </div>
    </div>
  );
}
