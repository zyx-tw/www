import { NextResponse, type NextRequest } from "next/server"

// The only POST to `/` is the createShortLink server action, which always
// carries a Next-Action header. Answer any other POST here, so bots and
// broken clients do not reach the action pipeline and fail there.
export function proxy(request: NextRequest) {
  if (request.method === "POST" && !request.headers.has("next-action")) {
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/",
}
