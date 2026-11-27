import { HomeShell } from "@/components/home-shell"
import { HOME } from "@/lib/copy"
import { systems } from "@/lib/map"
import { hosts } from "@/lib/hosts"
import { projects } from "@/lib/projects"
import { pageMetadata, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site"

const BODIES = systems.flatMap(({ bodies }) => bodies)
/** How much is under each page, for the shell's `ls`. */
const COUNTS = {
  project: projects.length,
  site: hosts.length,
  map: BODIES.filter(({ href }) => href).length,
}

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
 * The home is the mark, in characters, over the stars, filling the viewport
 * under the corners. At its foot a small shell has already run `ls`: every
 * page as a link, with how much is under it. Everything else about Loki is
 * on Info.
 */
export default function Home() {
  return (
    <main className="pointer-events-none fixed inset-0">
      <h1 className="sr-only">{HOME.title}</h1>
      <p className="sr-only">{SITE_DESCRIPTION}</p>
      <HomeShell counts={COUNTS} />
    </main>
  )
}
