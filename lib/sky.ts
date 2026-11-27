/**
 * The far stars behind every page, and the turn they share. The map turns
 * the sky while it is open (the map on www.zyx.tw); elsewhere the sky
 * drifts by itself (star-field.tsx). Both read and write `sky`,
 * so a star is in the same place before and after a page change.
 */

/** A small seeded generator, so the stars are the same on every visit. */
export function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Each star's place as a share of the view, and its size in pixels. */
export const STARS = (() => {
  const next = random(7)
  return Array.from({ length: 48 }, () => ({
    u: next(),
    v: next(),
    size: next() < 0.2 ? 4 : 2,
  }))
})()

/** Radians a second the sky turns when nothing holds it. */
export const DRIFT = 0.03

export const sky = {
  /** The turn around the vertical axis, in radians. */
  yaw: 0.5,
  /** The map is open and turns the sky itself. */
  mapped: false,
}

/** Where a star is in a view `width` wide, at the sky's turn. */
export function starX(u: number, width: number, yaw: number) {
  return (((u * width + yaw * 40) % width) + width) % width
}
