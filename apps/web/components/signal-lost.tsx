"use client"

import { Ascii, textField } from "@workspace/ui/components/ascii"

// One field for the page: it caches its mask, so it lives outside render.
const FIELD = textField("404")

/** The 404 page's number in live ascii, in braille that glitches now and then. */
export function SignalLost({ className }: { className?: string }) {
  return (
    <Ascii
      aria-hidden="true"
      source={FIELD}
      look="braille"
      cell={8}
      effects={{ bloom: 1, scanlines: true, glitch: true }}
      className={className}
    />
  )
}
