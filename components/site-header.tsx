"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  cornerLink,
  CornerLabel,
  CornerTip,
  TopCorners,
} from "@/components/corners"
import { enter } from "@/lib/layout"

import { PAGES } from "@/lib/site"

const NAV = PAGES.filter((page) => page.nav)

/**
 * The steps from the home page to `pathname`: the page it belongs to, then
 * each step under it that has a name (`names` maps the path under the page
 * to a name): a project, a system, or a system and its note.
 */
function trailOf(pathname: string, names: Record<string, string>) {
  const page = PAGES.find(
    ({ path }) =>
      path !== "/" && (pathname === path || pathname.startsWith(`${path}/`))
  )
  if (!page) return []
  const parts = pathname.slice(page.path.length + 1).split("/")
  const steps = parts.flatMap((_, index) => {
    const under = parts.slice(0, index + 1).join("/")
    const label = names[under]
    return label ? [{ label, href: `${page.path}/${under}` }] : []
  })
  return [{ label: page.label, href: page.path }, ...steps].map(
    (step, index, all) =>
      index === all.length - 1 ? { label: step.label } : step
  )
}

export function SiteHeader({
  projectNames,
}: {
  /** Each project's name by slug, for the last step of its page's trail. */
  projectNames: Record<string, string>
}) {
  const pathname = usePathname()
  // Nothing scrolls under the home's corners, so they need no fade.
  const home = pathname === "/"

  return (
    <TopCorners
      home="/"
      label="zyx, home"
      fade={!home}
      trail={trailOf(pathname, projectNames)}
      className={enter}
      foldNav
      nav={
        <nav aria-label="Main">
          <ul className="flex gap-7">
            {NAV.map(({ path, label, tip }) => {
              const current =
                pathname === path || pathname.startsWith(`${path}/`)
              return (
                <li key={path} className="flex">
                  <CornerTip tip={tip}>
                    <Link
                      href={path}
                      aria-current={current ? "page" : undefined}
                      className={cornerLink}
                    >
                      <CornerLabel current={current}>{label}</CornerLabel>
                    </Link>
                  </CornerTip>
                </li>
              )
            })}
          </ul>
        </nav>
      }
    />
  )
}
