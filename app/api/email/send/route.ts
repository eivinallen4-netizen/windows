import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

type Payload = {
  to?: string;
  subject?: string;
  message?: string;
};

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as Payload;
    if (!body.to || !isValidEmail(body.to)) {
      return NextResponse.json({ error: "Valid recipient email is required." }, { status: 400 });
    }
    if (!body.subject?.trim()) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }
    if (!body.message?.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const html = body.message.replace(/\n/g, "<br/>");
    await sendEmail({ to: body.to.trim(), subject: body.subject.trim(), html });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to send email." }, { status: 500 });
  }
}
