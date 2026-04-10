import "server-only";

import { BUSINESS } from "@/lib/marketing-content";
import { getPublishedHoursSummary } from "@/lib/public-business";
import { readAppConfig } from "@/lib/app-config";

export async function readPublicBusinessSnapshot() {
  const config = await readAppConfig();
  const publicBusiness = config.publicBusiness;

  return {
    ...BUSINESS,
    ...publicBusiness,
    sameAs: [publicBusiness.gbpUrl, ...publicBusiness.sameAsLinks].filter(
      (entry): entry is string => Boolean(entry),
    ),
    publishedHoursSummary: getPublishedHoursSummary(publicBusiness.publishedHours),
  };
}
