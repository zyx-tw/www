import { notFound } from "next/navigation"

import { SectionTitle } from "@workspace/ui/components/section-title"
import { cn } from "@workspace/ui/lib/utils"
import { column, enterRow, page } from "@workspace/ui/lib/layout"

import { Hero, HeroTitle } from "@/components/hero"
import { ProjectDiagram } from "@/components/project-diagram"
import { ProjectPicture } from "@/components/project-picture"
import { MarkPalette } from "@/components/mark-palette"
import { NoteMap } from "@/components/note-map"
import { Rich } from "@/components/rich"
import { MAP } from "@/lib/copy"
import { findBody, findSystem, systems } from "@/lib/map"
import { findNote, notes } from "@/lib/notes"
import { pageMetadata } from "@/lib/site"

export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return notes.flatMap(({ slug }) => {
    const found = findBody(slug)
    return found ? [{ system: found.system.slug, slug }] : []
  })
}

/** The note at this address, with its body and system on the map. */
function find(params: { system: string; slug: string }) {
  const system = findSystem(params.system)
  const body = system?.bodies.find(({ slug }) => slug === params.slug)
  const note = findNote(params.slug)
  return system && body?.href && note ? { system, body, note } : undefined
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ system: string; slug: string }>
}) {
  const found = find(await params)
  if (!found) return {}
  return pageMetadata({
    title: found.body.name,
    path: found.body.href!,
    markdown: `${found.body.href}.md`,
    description: found.body.line,
  })
}

/**
 * One note: its title, what is known about it (its number in the log,
 * length, reading time, version, last change, and the earlier versions once
 * there are any), the text in sections with their figures, then its system
 * as a small chart to go on from. The same sections and figures
 * as a project's page (app/works/[slug]/page.tsx).
 */
export default async function NotePage({
  params,
}: {
  params: Promise<{ system: string; slug: string }>
}) {
  const found = find(await params)
  if (!found) notFound()
  const { system, body, note } = found

  const facts = [
    `${body.length?.toLocaleString("en")} ${MAP.length}`,
    `${body.minutes} ${MAP.minutes}`,
    `v${note.version}`,
    `${MAP.updated} ${note.updated}`,
  ].join("   ")
  // The first note that needs this one, written or not.
  const next = systems
    .flatMap(({ bodies }) => bodies)
    .find(({ needs }) => needs?.includes(body.slug))
  // The first version needs no list: the line above already says it.
  const changes = note.changes.length > 1 ? note.changes : []
  const below = enterRow(3 + note.intro.length)

  return (
    <main lang="zh-Hant" className={cn(column, page, "flex-1")}>
      <MarkPalette />
      <Hero
        title={<HeroTitle text={body.name} />}
        subtitle={
          <span className="text-caption">
            <span className="bg-(--mark) px-1 text-background">
              {MAP.log} {note.log}
            </span>
            {"   "}
            {facts}
          </span>
        }
        className="pb-16"
      />
      {changes.length > 0 && (
        <ol className="-mt-5 mb-10 flex flex-col text-caption text-muted-foreground">
          {changes.map(({ version, date, text }) => (
            <li key={version}>
              v{version} {date} {text}
            </li>
          ))}
        </ol>
      )}

      <div className="flex max-w-2xl flex-col gap-y-5">
        {note.intro.map((paragraph, index) => (
          <p key={index} className={cn("text-pretty", enterRow(3 + index))}>
            <Rich text={paragraph} />
          </p>
        ))}
      </div>

      {note.sections.map((section, index) => (
        <section
          key={section.title}
          aria-labelledby={`section-${index}`}
          className={cn("mt-20", below)}
        >
          <SectionTitle id={`section-${index}`} title={section.title} />
          {/* The one line to leave with comes after the first paragraph,
              set apart in the middle of the column. */}
          {[section.body.slice(0, 1), section.body.slice(1)].map(
            (paragraphs, part) =>
              paragraphs.length > 0 && (
                <div key={part}>
                  <div
                    className={cn(
                      "flex max-w-2xl flex-col gap-y-5",
                      (part === 0 || !section.callout) && "mt-5"
                    )}
                  >
                    {paragraphs.map((paragraph, at) => (
                      <p key={at} className="text-pretty">
                        <Rich text={paragraph} />
                      </p>
                    ))}
                  </div>
                  {part === 0 && section.callout && (
                    <p className="my-16 text-center text-title font-medium text-balance">
                      <Rich text={section.callout} />
                    </p>
                  )}
                </div>
              )
          )}
          {section.figure?.kind === "picture" && (
            <ProjectPicture
              src={section.figure.src}
              ratio={section.figure.ratio}
              alt={section.figure.alt}
              className="mt-16"
            />
          )}
          {section.figure?.kind === "diagram" && (
            <ProjectDiagram diagram={section.figure} className="mt-16" />
          )}
          {section.points && (
            <dl className="mt-10 flex max-w-2xl flex-col gap-y-8">
              {section.points.map(({ term, text }) => (
                <div key={term} className="flex flex-col items-start gap-y-2">
                  <dt className="bg-(--mark) px-1 font-medium text-background">
                    {term}
                  </dt>
                  <dd className="text-pretty">
                    <Rich text={text} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      ))}

      <NoteMap
        system={system}
        current={body.slug}
        next={next && { name: next.name, href: next.href }}
        className={cn("mt-20", below)}
      />
    </main>
  )
}
