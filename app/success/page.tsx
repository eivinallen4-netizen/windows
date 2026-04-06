import SuccessClient from "./SuccessClient";

export const dynamic = "force-dynamic";

type SuccessPageProps = {
  searchParams?: Promise<{
    session_id?: string;
    type?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const resolvedSearchParams = await searchParams;
  const sessionId =
    typeof resolvedSearchParams?.session_id === "string"
      ? resolvedSearchParams.session_id
      : null;
  const type = resolvedSearchParams?.type === "quote" ? "quote" : "purchase";

  return <SuccessClient sessionId={sessionId} type={type} />;
}
