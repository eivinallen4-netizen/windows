import type { Metadata } from "next";
import FinishJobClient from "./FinishJobClient";

type FinishJobPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FinishJobPage({ params }: FinishJobPageProps) {
  const { id } = await params;
  return <FinishJobClient jobId={id} />;
}

export const metadata: Metadata = {
  title: "Finish Job",
};
