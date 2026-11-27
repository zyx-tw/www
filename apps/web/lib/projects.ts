import type {
  Dial,
  Diagram,
  Lesson,
  Quiz,
  Trace,
} from "@workspace/ui/lib/figures"

import data from "./projects.json"

/** A picture in a section, captured so its text reads at page size. */
export type Picture = {
  kind: "picture"
  src: string
  /** The file's shape: 16:9 or 4:3. */
  ratio: "wide" | "standard"
  /** What it shows, for the Markdown twin and screen readers. */
  alt: string
}

export type { Dial, Diagram, Lesson, Quiz, Trace }

export type Figure = Picture | Diagram | Lesson | Quiz | Trace | Dial

/** One part of a project's page, from the overview toward the detail. */
export type Section = {
  title: string
  body: string[]
  /** A note's one line to leave with, set apart in the middle. */
  callout?: string
  figure?: Figure
  /** Terms with one line each, set in the label column of the details. */
  points?: { term: string; text: string }[]
}

export type Project = {
  /** File-safe id; the preview files are named after it. */
  slug: string
  name: string
  /** The year it started, for Info's list of projects. */
  year: number
  /** Where it runs, or its public repository. Left out when neither is public. */
  href?: string
  /** Its source code, when the repository is public. */
  code?: string
  /** What it is for, in about 32 characters: the row shows it on one line. */
  purpose: string
  /** Its page at /project/<slug>: a few short paragraphs, one idea each. */
  intro: string[]
  /**
   * The rest of its page, for a project with more to say: how it works, its
   * parts and how it is built, each with a figure where one helps.
   */
  sections?: Section[]
  /** What it is built with, a handful of names. */
  stack: string[]
  /**
   * Written by `bun run pictures` (scripts/pixel): a 1440x1080 pixel drawing
   * of the product as one machine, and its dithered twin. `focus` places any
   * spare space as two percentages. `zoom`, `source` and `selector` belong to
   * `bun run previews`, which captures the live site instead.
   */
  preview: {
    image: string
    dither: string
    focus: string
    zoom?: number
    source?: string
    selector?: string
  }
}

/**
 * The single project list: /project with its preview stage, each project's
 * page at /project/<slug>, their Markdown twins and llms.txt (lib/markdown.ts),
 * the JSON-LD and the preview capture script all read lib/projects.json, so adding a project is one edit there.
 */
export const projects = data as Project[]

/** The project's own page on this site. */
export function projectPath(project: Pick<Project, "slug">) {
  return `/project/${project.slug}`
}

export function findProject(slug: string) {
  return projects.find((project) => project.slug === slug)
}
