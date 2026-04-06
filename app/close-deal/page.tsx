import type { Metadata } from "next";
import { Suspense } from "react";
import CloseDealClient from "./CloseDealClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Close Deal",
};

export default function CloseDealPage() {
  return (
    <Suspense fallback={null}>
      <CloseDealClient />
    </Suspense>
  );
}
