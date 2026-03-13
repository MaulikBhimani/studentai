import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const origin = request.headers.get("origin") ?? "*";

  // Handle setting CORS headers
  const setCorsHeaders = (res: NextResponse) => {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Credentials", "true");
  };

  // If this is a preflight OPTIONS request, stop and return the headers immediately
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });
    setCorsHeaders(response);
    return response;
  }

  // Otherwise, process the request and attach headers to the response
  const response = NextResponse.next();
  setCorsHeaders(response);
  return response;
}

// Only run this middleware on API routes
export const config = {
  matcher: "/api/:path*",
};
