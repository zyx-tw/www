import { cn } from "@/lib/utils"
import { column, enterRow, page } from "@/lib/layout"

import { Hero, HeroTitle } from "@/components/hero"
import { SITE } from "@/lib/copy"
import { hosts } from "@/lib/hosts"
import { pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({ title: SITE.title, path: "/site" })

export const dynamic = "force-static"

const LINK =
  "terminal-link underline decoration-muted-foreground/40 underline-offset-4"

/**
 * Every site under zyx.tw: its address, which opens it in a new tab, and
 * what it is for. Each line enters as its own row after the title.
 */
export default function SitePage() {
  return (
    <main className={cn(column, page)}>
      <Hero
        title={<HeroTitle text={SITE.title} />}
        subtitle={<span className="text-caption">sites {hosts.length}</span>}
      />
      <ul className="mt-10 flex flex-col gap-y-3">
        {hosts.map(({ host, purpose }, index) => (
          <li
            key={host}
            className={cn("flex gap-x-5 max-sm:flex-col", enterRow(index + 3))}
          >
            <a
              href={`https://${host}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(LINK, "w-44 shrink-0 self-start")}
            >
              {host}
            </a>
            <span className="text-muted-foreground">{purpose}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
