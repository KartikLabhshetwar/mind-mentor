import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublicPath = path === "/" || path === "/register" || path === "/signin";
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}

export const config = {
  matcher: [
    "/",
    "/register",
    "/signin",
    "/home",
    "/dashboard",
    "/resources",
    "/timer",
    "/analytics",
    "/settings",
    "/profile",
    "/chat",
    "/insights",
    "/insights/knowledge-graph",
    "/settings/reminders",
  ],
}; 