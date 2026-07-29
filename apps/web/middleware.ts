import { NextResponse, type NextRequest } from "next/server";

const publicPrefixes = ["/auth/", "/privacy", "/terms", "/_next/", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();
  if (request.cookies.has("cm_session")) return NextResponse.next();
  const signIn = new URL("/auth/sign-in", request.url);
  const safeReturn = `${pathname}${request.nextUrl.search}`;
  if (safeReturn.startsWith("/") && !safeReturn.startsWith("//")) signIn.searchParams.set("returnTo", safeReturn);
  return NextResponse.redirect(signIn);
}

export const config = { matcher: ["/((?!api).*)"] };
