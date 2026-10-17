import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, PUBLIC_API_PREFIXES, PUBLIC_PAGES, REFRESH_COOKIE } from "@/lib/auth/config";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // The sample-only Calls preview is deliberately unauthenticated in local development.
  // In every other environment it is unavailable; the actual Calls route remains protected below.
  if (pathname === "/calls/preview") {
    return process.env.NODE_ENV === "development" ? NextResponse.next() : new Response(null, { status: 404 });
  }

  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  const claims = await verifyAccessToken(req.cookies.get(ACCESS_COOKIE)?.value);
  const isPublicPage = PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublicPage) return claims ? NextResponse.redirect(new URL("/", req.url)) : NextResponse.next();
  if (claims) {
    if ((pathname === "/invites" || pathname.startsWith("/invites/")) && claims.role !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const next = encodeURIComponent(pathname + search);
  const target = req.cookies.has(REFRESH_COOKIE) ? `/api/auth/refresh?next=${next}` : `/login?next=${next}`;
  return NextResponse.redirect(new URL(target, req.url));
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"] };
