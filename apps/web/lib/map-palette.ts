type Ink = { bright: string; dim: string }

/** The accent: the orange of vaundy.jp (rgb 255 66 0). */
export const ACCENT: Ink = {
  bright: "oklch(0.661 0.233 36.5)",
  dim: "oklch(0.45 0.15 36.5)",
}

/**
 * Each system's own color on the map, for its star and its written notes.
 * What is not written yet stays gray.
 */
export const HUES: Record<string, Ink> = {
  basics: ACCENT,
  goals: { bright: "oklch(0.85 0.15 95)", dim: "oklch(0.55 0.1 95)" },
  principles: { bright: "oklch(0.8 0.15 150)", dim: "oklch(0.52 0.1 150)" },
  fleet: { bright: "oklch(0.8 0.12 205)", dim: "oklch(0.52 0.08 205)" },
  machines: { bright: "oklch(0.72 0.14 260)", dim: "oklch(0.5 0.1 260)" },
  beyond: { bright: "oklch(0.72 0.17 310)", dim: "oklch(0.5 0.12 310)" },
  craft: { bright: "oklch(0.75 0.16 355)", dim: "oklch(0.5 0.11 355)" },
}

/** The colors to try for a note's marks while one is being chosen. */
export const PALETTES: Record<string, Ink> = {
  orange: ACCENT,
  amber: { bright: "oklch(0.8 0.14 72)", dim: "oklch(0.52 0.09 68)" },
  red: { bright: "oklch(0.68 0.17 30)", dim: "oklch(0.45 0.11 30)" },
  green: { bright: "oklch(0.8 0.15 148)", dim: "oklch(0.5 0.09 148)" },
}
