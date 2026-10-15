import { NextResponse, type NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/calls/preview"] };
