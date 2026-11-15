import { Fragment } from "react"

/**
 * A line of a note with its emphasis: `**words**` are the words to catch
 * when skimming, in the heavier weight, and `==words==` are marked as a
 * terminal marks a selection, in inverted colors. Everything else is plain.
 */
export function Rich({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*|==[^=]+==)/).map((part, index) => {
    if (part.startsWith("**"))
      return (
        <strong key={index} className="font-medium">
          {part.slice(2, -2)}
        </strong>
      )
    if (part.startsWith("=="))
      return (
        <mark key={index} className="bg-(--mark) px-1 text-background">
          {part.slice(2, -2)}
        </mark>
      )
    return <Fragment key={index}>{part}</Fragment>
  })
}

/** The same line with its emphasis marks taken out. */
export function plain(text: string) {
  return text.replace(/\*\*|==/g, "")
}
