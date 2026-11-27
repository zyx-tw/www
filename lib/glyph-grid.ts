/** The grid's cell in CSS pixels on a canvas `width` wide, at `scale`. */
export function cellSize(width: number, scale: number) {
  const cw = Math.min(Math.max(Math.round((width / 124) * scale), 5), 13)
  return { width: cw, height: Math.round(cw * 1.45) }
}

/** The canvas font for the grid's glyphs in cells `height` tall. */
export function glyphFont(height: number, family: string) {
  return `600 ${Math.round(height * 0.74)}px ${family}`
}
