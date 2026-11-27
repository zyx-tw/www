import { NextResponse, type NextRequest } from "next/server"

const ACTION_CONTENT_TYPES = [
  "multipart/form-data",
  "application/x-www-form-urlencoded",
]

// The only POST this app takes is the createShortLink server action. It always
// carries a Next-Action header and a form body. Answer any other POST here, on
// every path, so bots and broken clients do not reach the action pipeline and
// fail there (for example with `Invalid forward reference.`).
export function proxy(request: NextRequest) {
  if (request.method !== "POST") return NextResponse.next()

  if (!request.headers.has("next-action")) {
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    })
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? ""
  if (!ACTION_CONTENT_TYPES.some((type) => contentType.startsWith(type))) {
    return new NextResponse(null, { status: 400 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
