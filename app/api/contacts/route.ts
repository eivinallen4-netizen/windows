import { NextResponse } from "next/server";
import { readContacts, writeContacts, type ContactRecord } from "@/lib/contacts-store";

export const runtime = "nodejs";

type ContactPayload = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

async function createBrevoContact(payload: ContactPayload) {
  const apiKey = process.env.key_brovo;
  if (!apiKey) {
    throw new Error("Missing Brevo API key.");
  }

  const attributes: Record<string, string> = {};
  if (payload.firstName?.trim()) attributes.FIRSTNAME = payload.firstName.trim();
  if (payload.lastName?.trim()) attributes.LASTNAME = payload.lastName.trim();
  if (payload.phone?.trim()) attributes.PHONE = payload.phone.trim();

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      email: payload.email,
      attributes: Object.keys(attributes).length ? attributes : undefined,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Brevo contact creation failed.");
  }

  return (await response.json()) as { id?: number };
}

export async function GET() {
  try {
    const contacts = await readContacts();
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load contacts." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactPayload;
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const brevo = await createBrevoContact(body);
    const record: ContactRecord = {
      id: globalThis.crypto?.randomUUID?.() ?? `contact_${Date.now()}`,
      email: body.email.trim().toLowerCase(),
      firstName: body.firstName?.trim() || undefined,
      lastName: body.lastName?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
      created_at: new Date().toISOString(),
      brevo: { id: brevo?.id },
    };

    const contacts = await readContacts();
    contacts.unshift(record);
    await writeContacts(contacts);

    return NextResponse.json({ contact: record });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unable to save contact.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
