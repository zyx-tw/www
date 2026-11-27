import { cn } from "@workspace/ui/lib/utils"
import { column, enterRow, page } from "@workspace/ui/lib/layout"

import { GitLog } from "@/components/git-log"
import { SectionTitle } from "@workspace/ui/components/section-title"

import { Hero, HeroTitle } from "@workspace/ui/components/hero"
import { INFO, HOME } from "@/lib/copy"
import { getGithubStatus } from "@/lib/github"
import { FACTS, ME, SECTIONS, type Entry } from "@/lib/resume"
import { pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({ title: INFO.title, path: "/info" })

// The GitHub status is fetched on the server and the page regenerated in the
// background every 5 minutes (ISR), so the SSR HTML carries real events
// instead of "Loading…". force-static keeps the route prerendered even though
// the GitHub fetch carries an Authorization header, which Next would
// otherwise read as a dynamic signal.
export const revalidate = 300
export const dynamic = "force-static"

// Every line enters as its own row, 25ms apart, as on Project: the title is
// row 1, the counts row 2, then each fact, then each section's heading, its
// entries and the fold for the rest, and the GitHub status last.
const FIRST_FACT_ROW = 3
let nextRow = FIRST_FACT_ROW + FACTS.length
const SECTION_ROWS = SECTIONS.map(({ entries, more }) => {
  const heading = nextRow
  nextRow += 1 + entries.length + (more ? 1 : 0)
  return heading
})
const STATUS_ROW = nextRow

const LINK =
  "terminal-link underline decoration-muted-foreground/40 underline-offset-4"

/**
 * Titles as displayed: "Wi-Fi" keeps its hyphen and "6 GHz" its space on one
 * line. The data, and so the Markdown, keeps plain characters.
 */
function unbroken(text: string) {
  return text
    .replace(/Wi-Fi/g, "Wi\u2011Fi")
    .replace(/(\d) GHz/g, "$1\u00a0GHz")
}

/**
 * A value that links when it has an address. Another site and a file open
 * in a new tab; a page of this site opens in place.
 */
function Value({ text, href }: { text: string; href?: string }) {
  if (!href) return <>{text}</>
  const away = href.startsWith("http") || href.endsWith(".pdf")
  return (
    <a
      href={href}
      {...(away ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={LINK}
    >
      {text}
    </a>
  )
}

/** One line of a list: when, what with the line under it, and where. */
function Row({ entry, className }: { entry: Entry; className?: string }) {
  const { when, what, note, authors, where, href } = entry
  return (
    <li className={cn("flex gap-x-5", className)}>
      <span className="w-28 shrink-0 text-caption whitespace-nowrap text-muted-foreground tabular-nums">
        {/* What is still going on is marked, as a note marks its terms. */}
        {/now$/i.test(when) ? (
          <span className="bg-(--mark)/20 text-(--mark)">{when}</span>
        ) : (
          when
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-x-5 sm:flex-row sm:justify-between">
        <span className="text-pretty">
          {unbroken(what)}
          {note && <span className="block text-muted-foreground">{note}</span>}
          {/* A paper's authors in print order, his own name standing out. */}
          {authors && (
            <span className="block text-muted-foreground">
              {authors.map((author, index) => (
                <span key={author}>
                  {index > 0 && ", "}
                  <span
                    className={cn(
                      "whitespace-nowrap",
                      author === ME && "text-foreground"
                    )}
                  >
                    {author}
                  </span>
                </span>
              ))}
            </span>
          )}
        </span>
        {/* At most 16rem wide from sm, so a long name wraps in its own
            column instead of squeezing the one beside it. */}
        <span className="shrink-0 text-pretty text-muted-foreground sm:max-w-64 sm:text-right">
          <Value text={where} href={href} />
        </span>
      </div>
    </li>
  )
}

/**
 * Info reads as a CV: the name, a few facts, then Education, Experience,
 * Publications, Projects and Awards, each newest first, and last what he is
 * doing now on GitHub.
 */
export default async function InfoPage() {
  const status = await getGithubStatus()

  return (
    <main className={cn(column, page, "flex-1")}>
      {/* Under the name, what the page holds, as the map counts its
          systems: each count goes to its section. */}
      <Hero
        title={<HeroTitle text={HOME.title} />}
        subtitle={
          <span className="flex flex-wrap gap-x-5 text-caption">
            {SECTIONS.map(({ id, title, entries, more }) => (
              <a key={id} href={`#${id}`} className="terminal-link">
                {title.toLowerCase()} {entries.length + (more?.length ?? 0)}
              </a>
            ))}
          </span>
        }
        className="pb-25"
      />

      {/* Facts: a muted label column, then the value. */}
      <dl className="flex flex-col gap-y-3">
        {FACTS.map(({ label, value, href }, index) => (
          <div
            key={label}
            className={cn("flex gap-x-5", enterRow(FIRST_FACT_ROW + index))}
          >
            <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
            <dd>
              <Value text={value} href={href} />
            </dd>
          </div>
        ))}
      </dl>

      {SECTIONS.map(({ id, title, entries, more }, index) => {
        const first = SECTION_ROWS[index]! + 1
        return (
          <section
            key={id}
            id={id}
            aria-labelledby={`${id}-heading`}
            className="mt-20 scroll-mt-30"
          >
            <SectionTitle
              id={`${id}-heading`}
              title={title}
              className={enterRow(first - 1)}
            />
            <ol className="mt-5 flex flex-col gap-y-3">
              {entries.map((entry, row) => (
                <Row
                  key={`${entry.when} ${entry.what}`}
                  entry={entry}
                  className={enterRow(first + row)}
                />
              ))}
            </ol>
            {/* The rest of a long list opens in place, under the same
                columns: the count stands where the entries' text starts,
                and takes taps 40px tall. */}
            {more && (
              <details className={cn("mt-3", enterRow(first + entries.length))}>
                <summary className="relative ml-33 w-fit cursor-pointer list-none terminal-link text-muted-foreground after:absolute after:inset-x-0 after:-inset-y-2 [&::-webkit-details-marker]:hidden">
                  {more.length} more
                </summary>
                <ol className="mt-3 flex flex-col gap-y-3">
                  {more.map((entry) => (
                    <Row key={`${entry.when} ${entry.what}`} entry={entry} />
                  ))}
                </ol>
              </details>
            )}
          </section>
        )
      })}

      <GitLog data={status} className={cn("mt-20", enterRow(STATUS_ROW))} />
    </main>
  )
}
