import { notFound } from "next/navigation"

import { SectionTitle } from "@workspace/ui/components/section-title"
import { cn } from "@workspace/ui/lib/utils"
import { column, enterRow, page } from "@workspace/ui/lib/layout"

import { Hero, HeroTitle } from "@/components/hero"
import { ProjectDiagram } from "@/components/project-diagram"
import { Paragraph } from "@/components/rich"
import { Scrolly } from "@/components/scrolly"
import { findBody, findSystem } from "@/lib/map"
import { findNote } from "@/lib/notes"

export const dynamic = "force-static"
export const dynamicParams = false

export const metadata = {
  title: "Scrolly pilot",
  robots: { index: false },
}

/** The pilot is one note. */
const PILOT = "agent-loop"

export function generateStaticParams() {
  const found = findBody(PILOT)
  return found ? [{ system: found.system.slug, slug: PILOT }] : []
}

/**
 * A pilot, not a page of the site: the note's own sections and figures, with
 * every figure that has steps told by scrolling (components/scrolly.tsx).
 * The words are the note's; nothing here is written for it.
 */
export default async function ScrollyPilot({
  params,
}: {
  params: Promise<{ system: string; slug: string }>
}) {
  const { system: systemSlug, slug } = await params
  const system = findSystem(systemSlug)
  const body = system?.bodies.find((each) => each.slug === slug)
  const note = findNote(slug)
  if (!system || !body || !note) notFound()

  return (
    <main lang="zh-Hant" className={cn(column, page, "flex-1")}>
      <Hero
        title={<HeroTitle text={body.name} className="leading-10" />}
        className="pb-20"
      />

      <div className="flex max-w-xl flex-col gap-y-7 leading-8">
        {note.intro.map((paragraph, index) => (
          <div key={index} className={enterRow(3 + index)}>
            <Paragraph text={paragraph} />
          </div>
        ))}
      </div>

      {note.sections.map((section, index) => {
        const figure = section.figure
        const told =
          figure?.kind === "trace" ||
          (figure?.kind === "diagram" && (figure.steps?.length ?? 0) > 0)
        return (
          <section
            key={section.title}
            aria-labelledby={`section-${index}`}
            className="mt-28"
          >
            <SectionTitle
              id={`section-${index}`}
              title={section.title}
              className="leading-8"
            />
            <div className="mt-7 flex max-w-xl flex-col gap-y-7 leading-8">
              {section.body.map((paragraph, at) => (
                <Paragraph key={at} text={paragraph} />
              ))}
            </div>
            {told ? (
              <Scrolly figure={figure} className="mt-10" />
            ) : figure?.kind === "diagram" ? (
              <ProjectDiagram diagram={figure} className="mt-20" />
            ) : null}
          </section>
        )
      })}
    </main>
  )
}
