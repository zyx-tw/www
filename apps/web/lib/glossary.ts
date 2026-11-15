import { findBody, systemPath } from "./map"
import data from "./glossary.json"

/**
 * A term a note can point at with `[[its name]]` (components/rich.tsx), as
 * a wiki links a word: either explained in a note, with its own line, or a
 * body on the map, which lends its title.
 */
type Entry = { text: string; note: string } | { body: string }

export type Term = {
  name: string
  /** What the instruments say about it. */
  text: string
  /** Where it is explained: its note, or its system while unwritten. */
  href?: string
  /** A body on the map that has no note yet. */
  planned: boolean
}

const entries = data as Record<string, Entry>

export function findTerm(name: string): Term | undefined {
  const entry = entries[name]
  if (!entry) return undefined
  const found = findBody("body" in entry ? entry.body : entry.note)
  if (!found) return undefined
  return {
    name,
    text: "text" in entry ? entry.text : found.body.name,
    href: found.body.href ?? systemPath(found.system),
    planned: !found.body.href,
  }
}
