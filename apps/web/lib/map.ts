import data from "./map.json"

/** A note (planet) or a course (station) in a system. */
export type Body = {
  slug: string
  /** Its title, as an article's. */
  name: string
  /** A few characters for its label on the map. */
  short: string
  /** What it says, in one or two sentences. */
  line: string
  kind?: "station"
  /** The bodies to read first, by slug, from any system. */
  needs?: string[]
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

/** Every system and the lanes between them, from lib/map.json. */
export const systems = data.systems as System[]
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
