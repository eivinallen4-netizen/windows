import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { readContacts, writeContacts, type ContactRecord } from "@/lib/contacts-store";

export const runtime = "nodejs";

type ContactPayload = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  paneCounts?: {
    standard?: number;
    specialty?: number;
    french?: number;
  };
  paneCount?: number;
  windowCount?: number;
  bestTimeToCall?: string;
  homeType?: string;
  serviceType?: string;
  notes?: string;
  source?: string;
};

type ContactPatchPayload = {
  id?: string;
  updates?: ContactPayload;
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

function normalizePaneCount(body: ContactPayload) {
  if (body.paneCounts) {
    const total = Object.values(body.paneCounts).reduce((sum, count) => sum + (Number(count) || 0), 0);
    if (total > 0) {
      return Math.round(total);
    }
  }
  return typeof body.windowCount === "number" && Number.isFinite(body.windowCount) && body.windowCount > 0
    ? Math.round(body.windowCount)
    : typeof body.paneCount === "number" && Number.isFinite(body.paneCount) && body.paneCount > 0
      ? Math.round(body.paneCount)
      : undefined;
}

function normalizePaneCounts(body: ContactPayload) {
  if (!body.paneCounts) {
    return undefined;
  }

  const normalized = {
    standard: Number(body.paneCounts.standard ?? 0) || 0,
    specialty: Number(body.paneCounts.specialty ?? 0) || 0,
    french: Number(body.paneCounts.french ?? 0) || 0,
  };

  return Object.values(normalized).some((count) => count > 0) ? normalized : undefined;
}

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

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
    const normalizedWindowCount = normalizePaneCount(body);
    const normalizedPaneCounts = normalizePaneCounts(body);

    if (!body.email && !body.phone?.trim()) {
      return NextResponse.json({ error: "A phone number or email is required." }, { status: 400 });
    }

    if (body.email && !isValidEmail(body.email)) {
      return NextResponse.json({ error: "Email must be valid." }, { status: 400 });
    }

    const brevo = body.email ? await createBrevoContact(body) : undefined;
    const record: ContactRecord = {
      id: globalThis.crypto?.randomUUID?.() ?? `contact_${Date.now()}`,
      email: body.email?.trim().toLowerCase() || undefined,
      firstName: body.firstName?.trim() || undefined,
      lastName: body.lastName?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
      address: body.address?.trim() || undefined,
      paneCounts: normalizedPaneCounts,
      paneCount: normalizedWindowCount,
      windowCount: normalizedWindowCount,
      bestTimeToCall: body.bestTimeToCall?.trim() || undefined,
      homeType: body.homeType?.trim() || undefined,
      serviceType: body.serviceType?.trim() || undefined,
      notes: body.notes?.trim() || undefined,
      source: body.source?.trim() || undefined,
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

export async function PATCH(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as ContactPatchPayload;
    if (!body.id || !body.updates) {
      return NextResponse.json({ error: "Contact id and updates are required." }, { status: 400 });
    }

    if (body.updates.email && !isValidEmail(body.updates.email)) {
      return NextResponse.json({ error: "Email must be valid." }, { status: 400 });
    }

    const contacts = await readContacts();
    const index = contacts.findIndex((contact) => contact.id === body.id);
    if (index === -1) {
      return NextResponse.json({ error: "Contact not found." }, { status: 404 });
    }

    const current = contacts[index];
    const normalizedPaneCount = normalizePaneCount(body.updates);
    const normalizedPaneCounts = normalizePaneCounts(body.updates);
    const updated: ContactRecord = {
      ...current,
      email: body.updates.email?.trim().toLowerCase() || undefined,
      firstName: body.updates.firstName?.trim() || undefined,
      lastName: body.updates.lastName?.trim() || undefined,
      phone: body.updates.phone?.trim() || undefined,
      address: body.updates.address?.trim() || undefined,
      paneCounts: normalizedPaneCounts ?? current.paneCounts,
      paneCount: normalizedPaneCount ?? current.paneCount,
      windowCount: normalizedPaneCount ?? current.windowCount,
      bestTimeToCall: body.updates.bestTimeToCall?.trim() || undefined,
      homeType: body.updates.homeType?.trim() || undefined,
      serviceType: body.updates.serviceType?.trim() || undefined,
      notes: body.updates.notes?.trim() || undefined,
      source: body.updates.source?.trim() || current.source,
    };

    contacts[index] = updated;
    await writeContacts(contacts);

    return NextResponse.json({ contact: updated });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unable to update contact.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
