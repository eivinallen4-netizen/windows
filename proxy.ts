import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth";
import {
  getHomePathForRole,
  isAdminPortalPath,
  isRepPortalPath,
  isTechPortalPath,
} from "@/lib/portal-routes";

const PUBLIC_PATHS = ["/signin"];
const PUBLIC_PREFIXES = ["/_next", "/api/auth", "/setup", "/api/users/onboard"];
const PUBLIC_FILES = ["/favicon.ico", "/logo.png", "/robots.txt", "/sitemap.xml"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_FILES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const session = await verifySessionToken(token);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (isAdminPortalPath(pathname) && session.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = getHomePathForRole(session.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isTechPortalPath(pathname) && session.role !== "tech" && session.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = getHomePathForRole(session.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isRepPortalPath(pathname) && session.role !== "rep" && session.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = getHomePathForRole(session.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png).*)"],
};
