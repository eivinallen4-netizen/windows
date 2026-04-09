import type { Metadata } from "next";
import LeadFunnel from "@/app/signin/LeadFunnel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Request Your Quote",
};

export default function CustomerQuotePage() {
  return <LeadFunnel />;
}
