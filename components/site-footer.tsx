"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { BottomCorners, cornerLink } from "@/components/corners"
import { enterFooter } from "@/lib/layout"

/** The bottom corners: Privacy and Terms, which cover every zyx.tw site. */
export function SiteFooter() {
  const pathname = usePathname()
  const home = pathname === "/"

  return (
    <BottomCorners
      fade={!home}
      className={enterFooter}
      links={
        <>
          <Link
            href="/privacy"
            aria-current={pathname === "/privacy" ? "page" : undefined}
            className={cornerLink}
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            aria-current={pathname === "/terms" ? "page" : undefined}
            className={cornerLink}
          >
            Terms
          </Link>
        </>
      }
    />
  )
}
