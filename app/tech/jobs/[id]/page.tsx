import type { Metadata } from "next";
import StartJobClient from "./StartJobClient";

type StartJobPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StartJobPage({ params }: StartJobPageProps) {
  const { id } = await params;
  return <StartJobClient jobId={id} />;
}

export const metadata: Metadata = {
  title: "Job Details",
};
