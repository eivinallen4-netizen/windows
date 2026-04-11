import "server-only";

import { BUSINESS } from "@/lib/marketing-content";
import { readAppConfig } from "@/lib/app-config";
import { toPublicObjectUrl } from "@/lib/object-storage";
import { getPublishedHoursSummary } from "@/lib/public-business";

function resolveMediaUrl(stored: string) {
  const trimmed = String(stored ?? "").trim();
  if (!trimmed) {
    return "";
  }
  return toPublicObjectUrl(trimmed) ?? trimmed;
}

export async function readPublicBusinessSnapshot() {
  const config = await readAppConfig();
  const publicBusiness = config.publicBusiness;

  return {
    ...BUSINESS,
    ...publicBusiness,
    heroBackgroundImageUrl: resolveMediaUrl(publicBusiness.heroBackgroundImageUrl),
    pageBackdropImageUrl: resolveMediaUrl(publicBusiness.pageBackdropImageUrl),
    serviceSectionImageUrls: publicBusiness.serviceSectionImageUrls.map((url) => resolveMediaUrl(url)).filter(Boolean),
    randomBackgroundImageUrls: publicBusiness.randomBackgroundImageUrls
      .map((url) => resolveMediaUrl(url))
      .filter(Boolean),
    sameAs: [publicBusiness.gbpUrl, ...publicBusiness.sameAsLinks].filter(
      (entry): entry is string => Boolean(entry),
    ),
    publishedHoursSummary: getPublishedHoursSummary(publicBusiness.publishedHours),
  };
}
