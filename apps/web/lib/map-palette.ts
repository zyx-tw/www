type Ink = { bright: string; dim: string }

/** The accent: an orange leaning to amber, the same as --mark. */
export const ACCENT: Ink = {
  bright: "oklch(0.78 0.16 62)",
  dim: "oklch(0.52 0.1 62)",
}

/**
 * Each system's own color on the map, for its star and its written notes.
 * What is not written yet stays gray.
 */
export const HUES: Record<string, Ink> = {
  basics: ACCENT,
  goals: { bright: "oklch(0.87 0.15 105)", dim: "oklch(0.57 0.1 105)" },
  principles: { bright: "oklch(0.8 0.15 150)", dim: "oklch(0.52 0.1 150)" },
  fleet: { bright: "oklch(0.8 0.12 205)", dim: "oklch(0.52 0.08 205)" },
  machines: { bright: "oklch(0.72 0.14 260)", dim: "oklch(0.5 0.1 260)" },
  beyond: { bright: "oklch(0.72 0.17 310)", dim: "oklch(0.5 0.12 310)" },
  craft: { bright: "oklch(0.75 0.16 355)", dim: "oklch(0.5 0.11 355)" },
}
