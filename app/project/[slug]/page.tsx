import { notFound } from "next/navigation"

import { SectionTitle } from "@/components/section-title"
import { cn } from "@/lib/utils"
import { column, enterRow, page } from "@/lib/layout"

import { Hero, HeroTitle } from "@/components/hero"
import { DiagramFigure } from "@/components/figure-diagram"
import { ProjectPicture } from "@/components/project-picture"
import { Rows } from "@/components/rows"
import { findProject, projectPath, projects } from "@/lib/projects"
import { pageMetadata } from "@/lib/site"

export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const project = findProject((await params).slug)
  if (!project) return {}
  return pageMetadata({
    title: project.name,
    path: projectPath(project),
    markdown: `${projectPath(project)}.md`,
    description: `${project.name}: ${project.purpose}.`,
  })
}

/** "https://github.com/zyx1121/peck" as "github.com/zyx1121/peck". */
function bare(href: string) {
  return href.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

/**
 * One project: its name and purpose, its picture and a few short paragraphs
 * on what it does. A project with more to say goes on from that overview
 * into sections, each with its own figure. Under the title are its year and
 * what it is built with; the page ends with where it lives, in the same
 * label column as Info's facts.
 */
export default async function Project({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const project = findProject((await params).slug)
  if (!project) notFound()

  // A project that lives in its repository has one address, its code.
  const facts = [
    ...(project.href && project.href !== project.code
      ? [{ label: "Site", value: bare(project.href), href: project.href }]
      : []),
    ...(project.code
      ? [{ label: "Code", value: bare(project.code), href: project.code }]
      : []),
  ]
  const sections = project.sections ?? []
  // Rows below the first screen all enter together: the decoder caps the
  // stagger, and nobody waits for row 30 while scrolling.
  const below = enterRow(4 + project.intro.length)

  return (
    <main className={cn(column, page, "flex-1")}>
      <Hero
        title={<HeroTitle text={project.name} />}
        subtitle={
          <>
            {project.purpose}
            {/* What is known about it, as under a note's title. */}
            <span className="mt-3 flex flex-wrap gap-x-5 text-caption">
              <span>{project.year}</span>
              {project.stack.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </span>
          </>
        }
        className="pb-10"
      />

      {/* The capture is 1440x1080, so the box keeps 4:3 before it loads. */}
      <ProjectPicture
        src={project.preview.image}
        focus={project.preview.focus}
        className={enterRow(3)}
      />

      <div className="mt-10 flex max-w-2xl flex-col gap-y-5">
        {project.intro.map((paragraph, index) => (
          <p key={index} className={cn("text-pretty", enterRow(4 + index))}>
            {paragraph}
          </p>
        ))}
      </div>

      {sections.map((section, index) => (
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
            <DiagramFigure diagram={section.figure} className="mt-10" />
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

      {facts.length > 0 && (
        <section aria-labelledby="facts-heading" className={cn("mt-20", below)}>
          <SectionTitle id="facts-heading" title="Details" />
          <Rows className="mt-5" rows={facts} />
        </section>
      )}
    </main>
  )
}
