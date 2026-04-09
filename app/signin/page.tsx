import type { Metadata } from "next";
import SignInForm from "./SignInForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sign In",
};

type SignInPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextPath =
    typeof resolvedSearchParams?.next === "string" && resolvedSearchParams.next.startsWith("/")
      ? resolvedSearchParams.next
      : "/";

  return (
    <div className="app-page-shell flex items-center justify-center px-4 py-10">
      <SignInForm nextPath={nextPath} />
    </div>
  );
}
