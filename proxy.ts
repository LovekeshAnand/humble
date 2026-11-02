import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

// One address for production. Browser saves are tied to the address, so a visit on the
// *.vercel.app URL would show an empty Saved list; send it to the real domain instead.
const CANONICAL_HOST = "humble.kelados.in";

// Clerk makes the session available to server code. No page requires sign in.
export default clerkMiddleware((_auth, req) => {
  const host = req.headers.get("host") ?? "";
  if (process.env.VERCEL_ENV === "production" && host.endsWith(".vercel.app")) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
