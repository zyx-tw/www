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

/**
 * A drawing in box-drawing characters, set as text so it is as legible as
 * the page around it. `wide` fits 66 cells (the narrowest column from the sm
 * breakpoint up); `narrow` fits 30 cells, for phones. ASCII and box-drawing
 * characters only, so every glyph keeps one cell.
 */
export type Diagram = {
  kind: "diagram"
  wide: string[]
  /** Left out, phones get the wide drawing and scroll it sideways. */
  narrow?: string[]
  /**
   * Pseudo code: set from the column's left edge instead of its middle, and
   * a step lights whole lines.
   */
  code?: boolean
  alt: string
  /**
   * The drawing read one part at a time. Each step lights the words in
   * `lit` wherever they stand in the drawing (wide and narrow alike) and
   * shows `text` under it. The figure plays through its steps by itself and
   * holds on the one a reader picks.
   */
  steps?: { label: string; lit: string[]; text: string }[]
}

/**
 * A figure the reader operates (components/project-lesson.tsx): `ask` names
 * the one choice, and each state is what one answer leads to. A state is a
 * few titled blocks of rows, with the line to take from it under them.
 */
export type Lesson = {
  kind: "lesson"
  ask: string
  /** Two blocks stand side by side from the sm breakpoint up. */
  side?: boolean
  states: {
    label: string
    blocks: {
      title: string
      /** The rows are steps in order, so each takes its number. */
      numbered?: boolean
      rows: {
        text: string
        /** A count or a version, set at the row's right edge. */
        value?: string
        /** `mark` is what this state adds, `dim` what it removes. */
        tone?: "mark" | "dim" | "quiet"
      }[]
    }[]
    text: string
  }[]
}

/**
 * A question the reader answers before the text does
 * (components/project-quiz.tsx). Every item takes the same options; picking
 * one shows which is right, and the line that says why.
 */
export type Quiz = {
  kind: "quiz"
  ask: string
  options: string[]
  items: {
    text: string
    /** The index of the right option. */
    answer: number
    why: string
  }[]
}

/**
 * A run replayed one event at a time (components/project-trace.tsx): who
 * spoke, what was sent, and the line to take from it. Events stay on screen,
 * so the reader watches the record grow.
 */
export type Trace = {
  kind: "trace"
  alt: string
  events: {
    /** The sender, in Latin capitals: USER, MODEL, TOOL. */
    from: string
    /** What was sent, as written on the wire. Long lines wrap. */
    lines: string[]
    text: string
  }[]
}

/**
 * A quantity the reader moves (components/project-dial.tsx): each stop
 * redraws the same bars, so the eye follows what grows and what does not.
 */
export type Dial = {
  kind: "dial"
  ask: string
  /** Cells in a full bar: 20 or fewer, so a phone holds it. */
  scale: number
  stops: {
    label: string
    /** The same bars at every stop, in the same order. */
    bars: {
      label: string
      cells: number
      value?: string
      tone?: "mark" | "quiet"
    }[]
    text: string
  }[]
}

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
