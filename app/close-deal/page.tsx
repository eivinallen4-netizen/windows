import { Suspense } from "react";
import CloseDealClient from "./CloseDealClient";

export const dynamic = "force-dynamic";

export default function CloseDealPage() {
  return (
    <Suspense fallback={null}>
      <CloseDealClient />
    </Suspense>
  );
}
