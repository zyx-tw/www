import { MAP } from "@/lib/copy"
import { systems } from "@/lib/map"
import { findNote } from "@/lib/notes"
import { absoluteUrl, SITE_NAME } from "@/lib/site"

// Built once with the site: the notes change only when it is deployed.
export const dynamic = "force-static"

/** Text as XML: the five characters XML reserves, escaped. */
function xml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/** A note's day as an Atom date: the notes are dated in Taiwan time. */
function day(date: string) {
  return `${date}T00:00:00+08:00`
}

/**
 * The notes on the map as an Atom feed, last changed first: a reader that
 * follows it sees a new note, and a note whose advice changed.
 */
export function GET() {
  const entries = systems
    .flatMap((system) =>
      system.bodies.flatMap((body) => {
        const note = findNote(body.slug)
        return note && body.href ? [{ system, body, note }] : []
      })
    )
    .sort(
      (a, b) =>
        b.note.updated.localeCompare(a.note.updated) ||
        b.note.log.localeCompare(a.note.log)
    )

  const feed = absoluteUrl("/feed.xml")
  const body = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="zh-Hant">',
    `  <title>${xml(`${SITE_NAME} ${MAP.title}`)}</title>`,
    `  <id>${xml(feed)}</id>`,
    `  <link rel="self" type="application/atom+xml" href="${xml(feed)}"/>`,
    `  <link rel="alternate" type="text/html" href="${xml(absoluteUrl("/map"))}"/>`,
    `  <updated>${day(entries[0]!.note.updated)}</updated>`,
    "  <author><name>Loki</name></author>",
    ...entries.flatMap(({ system, body, note }) => {
      const url = absoluteUrl(body.href!)
      return [
        "  <entry>",
        `    <title>${xml(body.name)}</title>`,
        `    <id>${xml(url)}</id>`,
        `    <link rel="alternate" type="text/html" href="${xml(url)}"/>`,
        `    <published>${day(note.changes.at(-1)!.date)}</published>`,
        `    <updated>${day(note.updated)}</updated>`,
        `    <category term="${xml(system.name)}"/>`,
        `    <summary>${xml(body.line)}</summary>`,
        "  </entry>",
      ]
    }),
    "</feed>",
    "",
  ].join("\n")

  return new Response(body, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  })
}
