export const publicAreas = [
  "Summerlin",
  "Henderson",
  "Green Valley",
  "Centennial Hills",
  "Southern Highlands",
  "Spring Valley",
  "Enterprise",
  "Skye Canyon",
] as const;

export function getPublicArea(index: number) {
  return publicAreas[index % publicAreas.length];
}
