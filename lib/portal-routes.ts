export type AppRole = "admin" | "rep" | "tech";
export type AppPortal = "admin" | "rep" | "tech";

const PORTAL_ORDER: AppPortal[] = ["rep", "tech", "admin"];

const REP_PORTAL_PATHS = new Set([
  "/rep",
  "/schedule",
  "/portal-quote",
  "/close-deal",
  "/save-quote",
  "/success",
  "/rep-stats",
  "/script",
]);

export function getHomePathForRole(role: AppRole) {
  if (role === "admin") return "/admin";
  if (role === "tech") return "/tech";
  return "/rep";
}

export function getSchedulePathForRole(role: AppRole) {
  if (role === "tech") return "/tech/schedule";
  return "/schedule";
}

export function isAdminPortalPath(pathname: string) {
  return pathname.startsWith("/admin");
}

export function isTechPortalPath(pathname: string) {
  return pathname.startsWith("/tech");
}

export function isRepPortalPath(pathname: string) {
  return REP_PORTAL_PATHS.has(pathname);
}

export function getPortalForPathname(pathname: string): AppPortal {
  if (isAdminPortalPath(pathname)) return "admin";
  if (isTechPortalPath(pathname)) return "tech";
  return "rep";
}

export function getPortalLabel(portal: AppPortal) {
  if (portal === "admin") return "Admin";
  if (portal === "tech") return "Tech";
  return "Rep";
}

export function getNextPortal(portal: AppPortal) {
  const index = PORTAL_ORDER.indexOf(portal);
  return PORTAL_ORDER[(index + 1) % PORTAL_ORDER.length];
}

export function getPreviousPortal(portal: AppPortal) {
  const index = PORTAL_ORDER.indexOf(portal);
  return PORTAL_ORDER[(index - 1 + PORTAL_ORDER.length) % PORTAL_ORDER.length];
}
