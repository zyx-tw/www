import { findBody, findSystem } from "@/lib/map"
import { markdownResponse, noteMarkdown } from "@/lib/markdown"
import { findNote, notes } from "@/lib/notes"

// Served at /map/<system>/<slug>.md through the rewrite in next.config.mjs.
export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return notes.flatMap(({ slug }) => {
    const found = findBody(slug)
    return found ? [{ system: found.system.slug, slug }] : []
  })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ system: string; slug: string }> }
) {
  const { system: at, slug } = await params
  const system = findSystem(at)
  const body = system?.bodies.find((item) => item.slug === slug)
  const note = findNote(slug)
  if (!system || !body?.href || !note)
    return new Response("Not found", { status: 404 })
  return markdownResponse(noteMarkdown(system, body, note))
}
