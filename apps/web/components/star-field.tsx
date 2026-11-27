"use client"

import { usePathname } from "next/navigation"

import { StarField } from "@workspace/ui/components/star-field"

/**
 * The sky behind the map and its notes; other pages have none. It lives in
 * the root layout, so the same sky carries on from the map to a note: the
 * map turns it, and a note lets it drift, with the stars kept to the margins.
 */
export function MapSky() {
  const pathname = usePathname()
  if (pathname !== "/map" && !pathname.startsWith("/map/")) return null
  return <StarField margins={/^\/map\/[^/]+\/[^/]+/.test(pathname)} />
}
