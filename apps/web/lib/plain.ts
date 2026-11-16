/**
 * A line of a note with its marks taken out: the `**`, `==`, `[[ ]]` and
 * backticks that components/rich.tsx turns into emphasis, marks, terms and
 * code.
 */
export function plain(text: string) {
  return text.replace(/\*\*|==|\[\[|\]\]|`/g, "")
}

/**
 * The lines of a paragraph that is a block of code: one that opens and
 * closes with a fence of three backticks. Undefined for prose.
 */
export function fenced(text: string) {
  return text.match(/^```[a-z]*\n([\s\S]*?)\n?```$/)?.[1]
}
