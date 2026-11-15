import { notFound } from "next/navigation"

import { SectionTitle } from "@workspace/ui/components/section-title"
import { cn } from "@workspace/ui/lib/utils"
import { column, enterRow, page } from "@workspace/ui/lib/layout"

import { Hero, HeroTitle } from "@/components/hero"
import { ProjectDiagram } from "@/components/project-diagram"
import { ProjectPicture } from "@/components/project-picture"
import { Rows } from "@/components/rows"
import { MAP } from "@/lib/copy"
import { findBody, findSystem, systemPath, systems } from "@/lib/map"
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
 * One note: its title, what is known about it (length, reading time,
 * version, last change), the text in sections with their figures, then its
 * changes and the notes around it on the map. The same sections and figures
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
  const linked = (item: (typeof systems)[number]["bodies"][number]) => ({
    value: item.name,
    href: item.href ?? `${systemPath(findBody(item.slug)!.system)}`,
  })
  const before = (body.needs ?? []).flatMap((slug) => {
    const item = findBody(slug)?.body
    return item ? [{ label: MAP.after, ...linked(item) }] : []
  })
  const after = systems
    .flatMap(({ bodies }) => bodies)
    .filter(({ needs }) => needs?.includes(body.slug))
    .map((item) => ({ label: MAP.next, ...linked(item) }))
  const around = [
    ...before,
    ...after,
    { label: MAP.back, value: system.name, href: systemPath(system) },
  ]
  const below = enterRow(3 + note.intro.length)

  return (
    <main lang="zh-Hant" className={cn(column, page, "flex-1")}>
      <Hero
        title={<HeroTitle text={body.name} />}
        subtitle={<span className="text-caption">{facts}</span>}
        className="pb-10"
      />

      <div className="flex max-w-2xl flex-col gap-y-5">
        {note.intro.map((paragraph, index) => (
          <p key={index} className={cn("text-pretty", enterRow(3 + index))}>
            {paragraph}
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
          <div className="mt-5 flex max-w-2xl flex-col gap-y-5">
            {section.body.map((paragraph, at) => (
              <p key={at} className="text-pretty">
                {paragraph}
              </p>
            ))}
          </div>
          {section.figure?.kind === "picture" && (
            <ProjectPicture
              src={section.figure.src}
              ratio={section.figure.ratio}
              alt={section.figure.alt}
              className="mt-10"
            />
          )}
          {section.figure?.kind === "diagram" && (
            <ProjectDiagram diagram={section.figure} className="mt-10" />
          )}
          {section.points && (
            <Rows
              className="mt-10"
              rows={section.points.map(({ term, text }) => ({
                label: term,
                value: text,
              }))}
            />
          )}
        </section>
      ))}

      <section aria-labelledby="around-heading" className={cn("mt-20", below)}>
        <SectionTitle id="around-heading" title={MAP.title} />
        <Rows className="mt-5" rows={around} />
      </section>

      <section aria-labelledby="changes-heading" className={cn("mt-20", below)}>
        <SectionTitle id="changes-heading" title={MAP.changes} />
        <Rows
          className="mt-5"
          rows={note.changes.map(({ version, date, text }) => ({
            label: `v${version}`,
            value: `${date}   ${text}`,
          }))}
        />
      </section>
    </main>
  )
}
