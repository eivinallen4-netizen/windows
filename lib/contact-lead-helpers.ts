import type { ContactRecord } from "@/lib/contacts-store";
import type { QuoteSelections } from "@/lib/quote";

export type ContactQuoteDraft = {
  contactId: string;
  user: { name: string; email: string; address: string };
  selections: QuoteSelections;
  serviceDate: string;
  serviceTime: string;
  notes: string;
};

export function getContactDisplayName(contact: ContactRecord) {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() || "Unnamed lead";
}

export function getPaneTotal(paneCounts?: ContactRecord["paneCounts"]) {
  return Object.values(paneCounts ?? {}).reduce((sum, count) => sum + (Number(count) || 0), 0);
}

export function getContactPaneTotal(contact: ContactRecord) {
  return getPaneTotal(contact.paneCounts) || Number(contact.paneCount ?? contact.windowCount ?? 0) || 0;
}

export function getSelectionPaneTotal(selections: QuoteSelections) {
  return getPaneTotal(selections.paneCounts);
}

export function buildContactSelections(contact: ContactRecord): QuoteSelections {
  const serviceType = contact.serviceType?.toLowerCase() ?? "";
  const homeType = contact.homeType?.toLowerCase() ?? "";
  const standardCount =
    Number(contact.paneCounts?.standard ?? 0) ||
    (contact.paneCounts ? 0 : Number(contact.paneCount ?? contact.windowCount ?? 0) || 0);
  return {
    paneCounts: {
      standard: standardCount,
      specialty: Number(contact.paneCounts?.specialty ?? 0) || 0,
      french: Number(contact.paneCounts?.french ?? 0) || 0,
    },
    storyLevel: homeType.includes("two") || homeType.includes("custom") ? "3+" : "1-2",
    addons: {
      screen: serviceType.includes("screen"),
      track: serviceType.includes("track"),
      hard_water: serviceType.includes("hard"),
      interior: serviceType.includes("inside"),
    },
  };
}

export function buildContactDraft(contact: ContactRecord): ContactQuoteDraft {
  return {
    contactId: contact.id,
    user: {
      name: getContactDisplayName(contact),
      email: contact.email ?? "",
      address: contact.address ?? "",
    },
    selections: buildContactSelections(contact),
    serviceDate: "",
    serviceTime: "",
    notes: contact.notes ?? "",
  };
}

export function isValidLeadEmail(value: string) {
  return /.+@.+\..+/.test(value);
}
