/**
 * A line of a note with its marks taken out: the `**`, `==` and `[[ ]]` that
 * components/rich.tsx turns into emphasis, marks and terms.
 */
export function plain(text: string) {
  return text.replace(/\*\*|==|\[\[|\]\]/g, "")
}
