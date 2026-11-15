import { Fragment } from "react"

import { Term } from "@/components/term"
import { plain } from "@/lib/plain"
import { findTerm } from "@/lib/glossary"

export { plain }

/** A clause: the text up to and including the punctuation that closes it. */
const CLAUSE =
  /[^，。、：；？！」）]*[，。、：；？！」）]+|[^，。、：；？！」）]+$/g

/**
 * A line of a note with its emphasis: `**words**` are the words to catch
 * when skimming, in the heavier weight, and `==words==` are marked as a
 * terminal marks a selection, in inverted colors: read alone, the marked
 * words are the note in brief. `[[a term]]` is a term from lib/glossary.json,
 * framed and linked to where it is explained. Everything else is plain.
 *
 * Chinese has no spaces, so a browser breaks a line between any two
 * characters. Each clause is kept whole instead (an inline block), so a
 * line ends at punctuation unless one clause is longer than the line.
 */
export function Rich({ text }: { text: string }) {
  const pieces = text
    .split(/(\*\*[^*]+\*\*|==[^=]+==|\[\[[^\]]+\]\])/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**")
        ? { kind: "strong" as const, text: part.slice(2, -2) }
        : part.startsWith("==")
          ? { kind: "mark" as const, text: part.slice(2, -2) }
          : part.startsWith("[[")
            ? { kind: "term" as const, text: part.slice(2, -2) }
            : { kind: "plain" as const, text: part }
    )
  const clauses = plain(text).match(CLAUSE) ?? []

  let piece = 0
  let used = 0
  return clauses.map((clause, index) => {
    const parts: React.ReactNode[] = []
    let left = clause.length
    while (left > 0 && piece < pieces.length) {
      const { kind, text: whole } = pieces[piece]!
      const cut = whole.slice(used, used + left)
      left -= cut.length
      used += cut.length
      const key = `${piece} ${used}`
      if (kind === "strong")
        parts.push(
          <strong key={key} className="font-medium">
            {cut}
          </strong>
        )
      else if (kind === "mark")
        parts.push(
          <mark key={key} className="bg-(--mark) text-background">
            {cut}
          </mark>
        )
      else if (kind === "term") {
        const term = findTerm(whole)
        parts.push(
          term ? (
            <Term key={key} term={term}>
              {cut}
            </Term>
          ) : (
            <Fragment key={key}>{cut}</Fragment>
          )
        )
      } else parts.push(<Fragment key={key}>{cut}</Fragment>)
      if (used >= whole.length) {
        piece += 1
        used = 0
      }
    }
    return (
      <span key={index} className="inline-block whitespace-pre-wrap">
        {parts}
      </span>
    )
  })
}
