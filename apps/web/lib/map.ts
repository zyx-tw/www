import data from "./map.json"
import { findNote, measure } from "./notes"

export type Kind = "concept" | "deep" | "field"
export type Depth = 1 | 2 | 3

/** A note in a system, drawn as a planet. */
export type Body = {
  slug: string
  /** Its title, as an article's. */
  name: string
  /** A few characters for its label on the map. */
  short: string
  /** What it says, in one or two sentences. */
  line: string
  /** How it is written: what a thing is, how it works, or what Loki does. */
  kind: Kind
  /** How deep it goes: 1 to understand, 2 to apply, 3 for the internals. */
  level: Depth
  /*
   * Its links to other bodies, by slug, from any system. Only `requires` is
   * an order to read in: without those notes this one cannot be followed.
   */
  requires?: string[]
  /** The shallower notes it goes deeper into. */
  deepens?: string[]
  /** The notes whose idea this experience puts to use. */
  applies?: string[]
  /** Worth reading beside it, in no order. */
  related?: string[]
  /** Its page, once it is written. A body without one is planned. */
  href?: string
  /** Once written: its length in characters and the minutes it takes to read. */
  length?: number
  minutes?: number
  /** Once written: its version, and the day of its last change. */
  version?: string
  updated?: string
}

export type System = {
  slug: string
  name: string
  line: string
  /** Where it sits on the chart: x and y from 0 to 1, then its height. */
  at: [number, number, number]
  bodies: Body[]
}

/**
 * Every system and the lanes between them, from lib/map.json. A body with a
 * note (lib/notes.json) is written: it gets its page and its measures here,
 * so the map never says them twice.
 */
export const systems = (data.systems as System[]).map((system) => ({
  ...system,
  bodies: system.bodies.map((body) => {
    const note = findNote(body.slug)
    if (!note) return body
    return {
      ...body,
      href: `/map/${system.slug}/${body.slug}`,
      version: note.version,
      updated: note.updated,
      ...measure(note),
    }
  }),
}))
export const lanes = data.lanes as [string, string][]

export function systemPath({ slug }: Pick<System, "slug">) {
  return `/map/${slug}`
}

export function findSystem(slug: string) {
  return systems.find((system) => system.slug === slug)
}

/** A body and the system it belongs to, by the body's slug. */
export function findBody(slug: string) {
  for (const system of systems) {
    const body = system.bodies.find((item) => item.slug === slug)
    if (body) return { body, system }
  }
}

const bodies = systems.flatMap((system) => system.bodies)

/**
 * Whether a body shows at `depth`. An experience shows at every depth: it
 * is a way in, not a step on the way down.
 */
export function shows({ kind, level }: Body, depth: Depth) {
  return kind === "field" || level <= depth
}

/**
 * The notes around a body, by the way they are linked: the ones to read
 * first, the ones that explain what is under it, the ones that put it to
 * use, and the rest. A note is listed once, in the first group it fits.
 */
export function around(body: Body) {
  const seen = new Set([body.slug])
  const pick = (slugs: string[]) =>
    slugs.flatMap((slug) => {
      if (seen.has(slug)) return []
      seen.add(slug)
      const found = bodies.find((item) => item.slug === slug)
      return found ? [found] : []
    })
  const pointing = (key: "deepens" | "applies" | "related") =>
    bodies.filter((item) => item[key]?.includes(body.slug)).map((b) => b.slug)
  return {
    requires: pick(body.requires ?? []),
    deeper: pick([...pointing("deepens"), ...(body.applies ?? [])]),
    uses: pick([...pointing("applies"), ...(body.deepens ?? [])]),
    related: pick([...(body.related ?? []), ...pointing("related")]),
  }
}
