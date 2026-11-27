/**
 * A star chart of notes: systems are stars over a plane, and each note is a
 * body orbiting its system. The data is plain JSON; `makeChart` adds the
 * lookups the chart and its pages share.
 */

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
  /** How it is written: what a thing is, how it works, or what the author does. */
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

/** A color pair: the bright one for what is written, the dim one for its lines. */
export type Ink = { bright: string; dim: string }

/** The words the chart shows, so a site can set its language. */
export type StarChartLabels = {
  title: string
  planned: string
  after: string
  systems: string
  notes: string
  length: string
  minutes: string
  updated: string
  depth: string
  /** By Depth: 1, 2, 3. */
  depths: readonly [string, string, string]
  kinds: Readonly<Record<Kind, string>>
}

export const STAR_CHART_LABELS: StarChartLabels = {
  title: "Map",
  planned: "planned",
  after: "read first",
  systems: "systems",
  notes: "notes",
  length: "characters",
  minutes: "min",
  updated: "updated",
  depth: "Depth",
  depths: ["Understand", "Apply", "Internals"],
  kinds: { concept: "concept", deep: "deep dive", field: "field note" },
}

/**
 * Whether a body shows at `depth`. An experience shows at every depth: it
 * is a way in, not a step on the way down.
 */
export function shows({ kind, level }: Body, depth: Depth) {
  return kind === "field" || level <= depth
}

export type Chart = ReturnType<typeof makeChart>

/** The chart's systems and lanes, with lookups; its pages live under `base`. */
export function makeChart(
  systems: System[],
  lanes: [string, string][],
  base = "/map"
) {
  const bodies = systems.flatMap((system) => system.bodies)

  /**
   * The notes around a body, by the way they are linked. Before it: the ones
   * it cannot be read without and the shallower ones it goes deeper into.
   * After it: the ones that explain what is under it or build on it, the
   * ones that put it to use, and the rest. A note is listed once, in the
   * first group it fits.
   */
  function around(body: Body) {
    const seen = new Set([body.slug])
    const pick = (slugs: string[]) =>
      slugs.flatMap((slug) => {
        if (seen.has(slug)) return []
        seen.add(slug)
        const found = bodies.find((item) => item.slug === slug)
        return found ? [found] : []
      })
    const pointing = (key: "requires" | "deepens" | "applies" | "related") =>
      bodies.filter((item) => item[key]?.includes(body.slug)).map((b) => b.slug)
    return {
      before: pick([...(body.requires ?? []), ...(body.deepens ?? [])]),
      deeper: pick([
        ...pointing("deepens"),
        ...(body.applies ?? []),
        ...pointing("requires"),
      ]),
      uses: pick(pointing("applies")),
      related: pick([...(body.related ?? []), ...pointing("related")]),
    }
  }

  return {
    systems,
    lanes,
    base,
    around,
    systemPath: ({ slug }: Pick<System, "slug">) => `${base}/${slug}`,
    findSystem: (slug: string) =>
      systems.find((system) => system.slug === slug),
    /** A body and the system it belongs to, by the body's slug. */
    findBody: (slug: string) => {
      for (const system of systems) {
        const body = system.bodies.find((item) => item.slug === slug)
        if (body) return { body, system }
      }
    },
  }
}
