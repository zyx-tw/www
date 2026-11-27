import { cn } from "@workspace/ui/lib/utils"
import { column, enterRow, page } from "@workspace/ui/lib/layout"

import { SectionTitle } from "@workspace/ui/components/section-title"

import { Hero, HeroTitle } from "@workspace/ui/components/hero"
import type { LegalDoc, Run } from "@/lib/legal"

const LINK = "terminal-link underline underline-offset-4"

/** A run with its marked words in the mark's color, as a note marks them. */
function Marked({ text, mark }: { text: string; mark?: string }) {
  const at = mark ? text.indexOf(mark) : -1
  if (!mark || at < 0) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, at)}
      <mark className="bg-(--mark)/20 text-(--mark)">{mark}</mark>
      {text.slice(at + mark.length)}
    </span>
  )
}

function Paragraph({ runs }: { runs: Run[] }) {
  return (
    <p className="mt-3">
      {runs.map(({ text, href, mark }, index) =>
        href ? (
          <a
            key={index}
            href={href}
            {...(href.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className={LINK}
          >
            {text}
          </a>
        ) : (
          <Marked key={index} text={text} mark={mark} />
        )
      )}
    </p>
  )
}

/** Reading time at 200 words a minute, at least 1. */
function minutes(doc: LegalDoc) {
  const words = doc.sections
    .flatMap(({ paragraphs }) => paragraphs.flat())
    .reduce(
      (sum, { text }) => sum + text.split(/\s+/).filter(Boolean).length,
      0
    )
  return Math.max(1, Math.round(words / 200))
}

/** Privacy and Terms: the title, the date of the last change, the sections. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main className={cn(column, page, "flex-1 text-body")}>
      <Hero
        title={<HeroTitle text={doc.title} />}
        subtitle={
          <span className="flex flex-wrap gap-x-5 text-caption">
            <span>
              updated{" "}
              <time dateTime={doc.updated} className="tabular-nums">
                {doc.updated}
              </time>
            </span>
            <span>sections {doc.sections.length}</span>
            <span>{minutes(doc)} min</span>
          </span>
        }
        className="pb-25"
      />
      {doc.sections.map(({ heading, paragraphs }, index) => (
        <section
          key={heading}
          className={cn(index > 0 && "mt-15", enterRow(3 + index))}
        >
          <SectionTitle title={heading} />
          {paragraphs.map((runs, paragraph) => (
            <Paragraph key={paragraph} runs={runs} />
          ))}
        </section>
      ))}
    </main>
  )
}
