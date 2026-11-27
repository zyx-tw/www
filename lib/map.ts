import {
  type Body,
  type Depth,
  type Kind,
  makeChart,
  shows,
  type System,
} from "@/lib/star-chart"

import data from "./map.json"
import { findNote, measure } from "./notes"

export type { Body, Depth, Kind, System }

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

/** The map as the star chart in @workspace/ui reads it. */
export const chart = makeChart(systems, lanes)

export const { systemPath, findSystem, findBody, around } = chart
export { shows }
