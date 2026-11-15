/**
 * The map's phosphor: the color of its lines and names, bright and dim. Gray
 * follows the theme's own text colors, so it has no entry here.
 */
export const PALETTES: Record<string, { bright: string; dim: string }> = {
  amber: { bright: "oklch(0.8 0.14 72)", dim: "oklch(0.52 0.09 68)" },
  red: { bright: "oklch(0.68 0.17 30)", dim: "oklch(0.45 0.11 30)" },
  green: { bright: "oklch(0.8 0.15 148)", dim: "oklch(0.5 0.09 148)" },
}
