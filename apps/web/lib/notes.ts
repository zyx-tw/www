import data from "./notes.json"
import type { Section } from "./projects"

/** One change to a note, newest first in its list. */
export type Change = { version: string; date: string; text: string }

/**
 * A written note: the page of a body on the map (lib/map.json), by the
 * body's slug. Its title and its one line stay with the body; this is the
 * text, in the same sections and figures a project's page uses.
 */
export type Note = {
  slug: string
  /** SemVer: a new major when the advice changes, a minor when it grows. */
  version: string
  /** The day of its last change. */
  updated: string
  changes: Change[]
  intro: string[]
  sections: Section[]
}

/** Every written note, from lib/notes.json: adding one is one edit there. */
export const notes = data as Note[]

export function findNote(slug: string) {
  return notes.find((note) => note.slug === slug)
}

/** Every string a reader reads in a note. */
function prose({ intro, sections }: Note) {
  return [
    ...intro,
    ...sections.flatMap(({ title, body, figure, points }) => [
      title,
      ...body,
      ...(figure?.kind === "diagram"
        ? (figure.steps ?? []).map(({ text }) => text)
        : []),
      ...(points ?? []).flatMap(({ term, text }) => [term, text]),
    ]),
  ]
}

/** Readers of Chinese take in about this many characters a minute. */
const PER_MINUTE = 400

/**
 * A note's length, counting each Han character and each run of Latin
 * letters or digits as one, and the minutes it takes to read.
 */
export function measure(note: Note) {
  const length = prose(note)
    .join(" ")
    .match(/\p{Script=Han}|[A-Za-z0-9][A-Za-z0-9,.'-]*/gu)!.length
  return { length, minutes: Math.max(1, Math.round(length / PER_MINUTE)) }
}
