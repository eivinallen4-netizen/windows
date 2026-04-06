export type PaneType = "standard" | "specialty" | "french";
export type StoryLevel = "1-2" | "3+";

export type Pricing = {
  paneTypes: Record<PaneType, number>;
  storySurcharge: {
    third_plus: number;
  };
  addons: {
    screen: number;
    track: number;
    hard_water: number;
    interior: number;
  };
  jobMinimum: number;
};

export const defaultPricing: Pricing = {
  paneTypes: {
    standard: 7,
    specialty: 15,
    french: 3,
  },
  storySurcharge: {
    third_plus: 4,
  },
  addons: {
    screen: 3.5,
    track: 4,
    hard_water: 15,
    interior: 5,
  },
  jobMinimum: 150,
};
