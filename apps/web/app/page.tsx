import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"
import { enterRow, page } from "@workspace/ui/lib/layout"

import { HomeMark } from "@/components/home-mark"
import { HomeShell } from "@/components/home-shell"
import { HOME } from "@/lib/copy"
import { systems } from "@/lib/map"
import { projects } from "@/lib/projects"
import { pageMetadata, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site"

const BODIES = systems.flatMap(({ bodies }) => bodies)
const COUNTS = [
  { label: "projects", count: projects.length, href: "/project" },
  {
    label: "notes",
    count: BODIES.filter(({ kind }) => !kind).length,
    href: "/map",
  },
  {
    label: "courses",
    count: BODIES.filter(({ kind }) => kind).length,
    href: "/map",
  },
]

export const dynamic = "force-static"

// The home's canonical and Markdown alternate live here, not in the root
// layout, so the not-found page does not inherit them. The title is the site
// name alone, absolute because a layout's title template skips the page in
// its own segment.
export const metadata = {
  ...pageMetadata({ path: "/" }),
  title: { absolute: SITE_NAME },
}

/**
 * The home is the mark, in characters, over the pond, filling the viewport
 * under the corners, with one line of counts at its foot as on the map.
 * Everything else about Loki is on Info. "/" opens a small shell over it, as an easter egg.
 */
export default function Home() {
  return (
    <main className="fixed inset-0">
      <h1 className="sr-only">{HOME.title}</h1>
      <p className="sr-only">{SITE_DESCRIPTION}</p>
      <HomeMark />
      {/* What the site holds, where the map keeps its instruments. */}
      <nav
        aria-label="Contents"
        className={cn(
          page,
          "pointer-events-none absolute inset-(--bezel) flex flex-col justify-end px-(--gutter)",
          enterRow(1)
        )}
      >
        <ul
          data-no-feed
          className="pointer-events-auto flex w-fit flex-wrap gap-x-5 text-caption text-muted-foreground"
        >
          {COUNTS.map(({ label, count, href }) => (
            <li key={label}>
              <Link href={href} className="terminal-link">
                {label} {count}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <HomeShell />
    </main>
  )
}
