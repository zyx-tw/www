"use client"

import { usePathname, useRouter } from "next/navigation"

import { PageDecode } from "./page-decode"

/**
 * PageDecode on the Next.js App Router: the decoder follows the router's
 * path, and a link it holds for the scramble out leaves through router.push,
 * so navigation stays client side. Mount it once in the root layout.
 */
export function NextPageDecode() {
  const pathname = usePathname()
  const router = useRouter()
  return (
    <PageDecode pathname={pathname} navigate={(href) => router.push(href)} />
  )
}
