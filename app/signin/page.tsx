import SignInForm from "./SignInForm";

export const dynamic = "force-dynamic";

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(11,111,178,0.18),_transparent_38%),linear-gradient(180deg,_#f8fbff_0%,_#edf4f9_100%)] flex items-center justify-center px-4 py-10">
      <SignInForm nextPath={nextPath} />
    </div>
  );
}
