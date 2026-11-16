import Link from "next/link"
import { notFound } from "next/navigation"

import { SectionTitle } from "@workspace/ui/components/section-title"
import { cn } from "@workspace/ui/lib/utils"
import { column, enterRow, page } from "@workspace/ui/lib/layout"

import { Hero, HeroTitle } from "@/components/hero"
import { ProjectDiagram } from "@/components/project-diagram"
import { ProjectDial } from "@/components/project-dial"
import { ProjectLesson } from "@/components/project-lesson"
import { ProjectPicture } from "@/components/project-picture"
import { ProjectQuiz } from "@/components/project-quiz"
import { ProjectTrace } from "@/components/project-trace"
import { NoteMap } from "@/components/note-map"
import { Paragraph, Rich } from "@/components/rich"
import { MAP } from "@/lib/copy"
import { around, type Body, findBody, findSystem } from "@/lib/map"
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
 * kind and depth, length, reading time, version and last change), the notes
 * to know first, the text in sections with their figures, the notes to go
 * on to by the way they are linked, then its system as a small chart. The same
 * sections and figures as a project's page (app/project/[slug]/page.tsx).
 * The list of earlier versions stays in the data and is not shown.
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
    `${MAP.kinds[body.kind]} L${body.level}`,
    `${body.length?.toLocaleString("en")} ${MAP.length}`,
    `${body.minutes} ${MAP.minutes}`,
    `v${note.version}`,
    `${MAP.updated} ${note.updated}`,
  ].join("   ")
  // The notes to know first go above the text; the ones to go on to come
  // after it, each group under the way it is linked.
  const links = around(body)
  const groups = (
    [
      [MAP.deeper, links.deeper],
      [MAP.uses, links.uses],
      [MAP.related, links.related],
    ] as const
  ).filter(([, items]) => items.length > 0)
  const first = links.before.length > 0 ? 4 : 3
  const below = enterRow(first + note.intro.length)

  return (
    <main lang="zh-Hant" className={cn(column, page, "flex-1")}>
      <Hero
        title={<HeroTitle text={body.name} className="leading-10" />}
        subtitle={<span className="text-caption">{facts}</span>}
        className="pb-20"
      />

      {links.before.length > 0 && (
        <nav
          aria-labelledby="before"
          className={cn(
            "mb-14 flex max-w-xl flex-col gap-y-3 leading-8",
            enterRow(3)
          )}
        >
          <h2 id="before" className="text-caption text-muted-foreground">
            {MAP.before}
          </h2>
          <NoteLinks items={links.before} />
        </nav>
      )}

      <div className="flex max-w-xl flex-col gap-y-7 leading-8">
        {note.intro.map((paragraph, index) => (
          <div key={index} className={enterRow(first + index)}>
            <Paragraph text={paragraph} />
          </div>
        ))}
      </div>

      {note.sections.map((section, index) => (
        <section
          key={section.title}
          aria-labelledby={`section-${index}`}
          className={cn("mt-28", below)}
        >
          <SectionTitle
            id={`section-${index}`}
            title={section.title}
            className="leading-8"
          />
          {/* The one line to leave with comes after the first paragraph,
              set apart in the middle of the column. */}
          {[section.body.slice(0, 1), section.body.slice(1)].map(
            (paragraphs, part) =>
              paragraphs.length > 0 && (
                <div key={part}>
                  <div
                    className={cn(
                      "flex max-w-xl flex-col gap-y-7 leading-8",
                      (part === 0 || !section.callout) && "mt-7"
                    )}
                  >
                    {paragraphs.map((paragraph, at) => (
                      <Paragraph key={at} text={paragraph} />
                    ))}
                  </div>
                  {part === 0 && section.callout && (
                    <p className="my-20 text-center text-title leading-10 font-medium text-balance">
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
              className="mt-20"
            />
          )}
          {section.figure?.kind === "diagram" && (
            <ProjectDiagram diagram={section.figure} className="mt-20" />
          )}
          {section.figure?.kind === "lesson" && (
            <ProjectLesson lesson={section.figure} className="mt-14" />
          )}
          {section.figure?.kind === "quiz" && (
            <ProjectQuiz quiz={section.figure} className="mt-14" />
          )}
          {section.figure?.kind === "trace" && (
            <ProjectTrace trace={section.figure} className="mt-14" />
          )}
          {section.figure?.kind === "dial" && (
            <ProjectDial dial={section.figure} className="mt-14" />
          )}
          {section.points && (
            <dl className="mt-14 flex max-w-xl flex-col gap-y-10 leading-8">
              {section.points.map(({ term, text }) => (
                <div key={term} className="flex flex-col items-start gap-y-2">
                  <dt className="bg-(--mark)/20 font-medium text-(--mark)">
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

      {note.sources && (
        <section aria-labelledby="sources" className={cn("mt-28", below)}>
          <SectionTitle id="sources" title={MAP.sources} />
          <ul className="mt-7 flex max-w-xl flex-col gap-y-3 leading-8">
            {note.sources.map(({ title, href, by }) => (
              <li key={href} className="text-pretty">
                <a
                  href={href}
                  className="terminal-link underline decoration-muted-foreground/40 underline-offset-4"
                >
                  {title}
                </a>
                {by && <span className="text-muted-foreground"> {by}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {groups.length > 0 && (
        <section aria-labelledby="beyond" className={cn("mt-28", below)}>
          <SectionTitle id="beyond" title={MAP.beyond} />
          <div className="mt-7 flex max-w-xl flex-col gap-y-10 leading-8">
            {groups.map(([label, items]) => (
              <div key={label} className="flex flex-col gap-y-2">
                <h3 className="text-caption text-muted-foreground">{label}</h3>
                <NoteLinks items={items} />
              </div>
            ))}
          </div>
        </section>
      )}

      <NoteMap
        system={system}
        current={body.slug}
        className={cn("mt-28", below)}
      />
    </main>
  )
}

/** Notes as links, one to a row; a planned one is its name alone. */
function NoteLinks({ items }: { items: Body[] }) {
  return (
    <ul className="flex flex-col gap-y-3">
      {items.map((item) => (
        <li key={item.slug} className="text-pretty">
          {item.href ? (
            <Link
              href={item.href}
              className="terminal-link underline decoration-muted-foreground/40 underline-offset-4"
            >
              {item.name}
            </Link>
          ) : (
            <span className="text-muted-foreground">{item.name}</span>
          )}
        </li>
      ))}
    </ul>
  )
}
