/** Resolve stored app-config image refs for display in the browser (client or server). */
export function storedMediaToDisplayUrl(stored: string | undefined | null): string {
  const value = String(stored ?? "").trim();
  if (!value) {
    return "";
  }
  if (value.startsWith("r2:")) {
    return `/api/files?key=${encodeURIComponent(value.slice(3))}`;
  }
  return value;
}
