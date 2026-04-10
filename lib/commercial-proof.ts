export type CommercialProofItem = {
  id: string;
  title: string;
  propertyType: string;
  scope: string;
  challenge: string;
  result: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export const commercialProofItems: CommercialProofItem[] = [];
