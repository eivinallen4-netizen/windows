import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { readTransactions, reconcileTransactionsFromJobs } from "@/lib/transactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== "admin" && session.role !== "rep")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await reconcileTransactionsFromJobs();
    const records = await readTransactions();
    const transactions =
      session.role === "admin"
        ? records
        : records.filter((record) => record.rep?.email?.toLowerCase() === session.email.toLowerCase());

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load transactions." }, { status: 500 });
  }
}
