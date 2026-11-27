// One shared isometric pixel rasteriser; each project is one scene function.
// Fixed camera (30 degree orthographic), one light, one tone rule for every material.
import zlib from "node:zlib"
import fs from "node:fs"

export const W = +(process.env.PX_W ?? 480),
  H = +(process.env.PX_H ?? 360)
const S = 20,
  OX = W / 2,
  OY = 176
const SIN = 0.5,
  COS = Math.sqrt(3) / 2,
  R2 = Math.SQRT2
const norm = (v) => {
  const l = Math.hypot(...v)
  return v.map((c) => c / l)
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const D = norm([1, 1, (R2 * SIN) / COS]) // toward the camera
const L = norm([-0.5, 0.42, 0.78]) // toward the light: shadows fall screen-right
const BG = [12, 12, 13]
const COOL = [38, 34, 78],
  WARM = [255, 226, 176]
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
// Six tones a material: darker ones lean violet, lighter ones lean warm.
const TONE = [
  [0.22, 0.46, 0],
  [0.38, 0.32, 0],
  [0.56, 0.18, 0],
  [0.76, 0.07, 0],
  [0.96, 0, 0.06],
  [1.12, 0, 0.24],
]
const tone = (base, i) => {
  const [f, cool, warm] = TONE[i]
  return base.map((c, k) => {
    let v = c * f
    v = v + (COOL[k] - v) * cool
    v = v + (WARM[k] - v) * warm
    return Math.max(0, Math.min(255, v))
  })
}

export const MAT = {
  floor: [58, 62, 86],
  tile: [70, 74, 100],
  wood: [150, 104, 70],
  felt: [78, 96, 128],
  steel: [112, 118, 132],
  dark: [44, 46, 58],
  iron: [150, 146, 138],
  leaf: [70, 132, 84],
  pot: [150, 92, 70],
  paper: [206, 198, 180],
  red: [176, 70, 62],
  blue: [70, 110, 176],
  teal: [60, 140, 140],
  brass: [190, 150, 80],
  // The space-age set: enamel white, signal orange, mustard, turquoise, chrome and deck plating.
  white: [214, 208, 196],
  orange: [226, 110, 52],
  mustard: [214, 168, 60],
  aqua: [72, 176, 170],
  chrome: [150, 160, 180],
  deck: [74, 78, 104],
  plate: [92, 96, 122],
  hull: [120, 124, 146],
  glass: [60, 96, 130],
  skin: [224, 170, 130],
}
export const GLOW = {
  amber: [255, 170, 64],
  green: [96, 220, 130],
  red: [255, 84, 70],
  cyan: [110, 210, 235],
}

export const box = (x, y, z, w, d, h, mat = MAT.steel, extra = {}) => ({
  kind: "box",
  min: [x, y, z],
  max: [x + w, y + d, z + h],
  mat,
  ...extra,
})
export const cyl = (x, y, z, r, h, mat = MAT.steel, extra = {}) => ({
  kind: "cyl",
  c: [x, y],
  r,
  z0: z,
  z1: z + h,
  mat,
  ...extra,
})
export const ball = (x, y, z, r, mat = MAT.steel, extra = {}) => ({
  kind: "ball",
  c: [x, y, z],
  r,
  mat,
  ...extra,
})
/** A cylinder whose radius goes from `r0` at the bottom to `r1` at the top: nose cones, nozzles, tulip stems. */
export const cone = (x, y, z, r0, r1, h, mat = MAT.steel, extra = {}) => ({
  kind: "cone",
  c: [x, y],
  r0,
  r1,
  z0: z,
  z1: z + h,
  mat,
  ...extra,
})
/** A ball pressed flat by `sq` along z: saucers, domes, cushions. */
export const disc = (x, y, z, r, sq, mat = MAT.steel, extra = {}) => ({
  kind: "ball",
  c: [x, y, z],
  r,
  sq,
  mat,
  ...extra,
})
export const glow = (prim, color, power = 1) => ({
  ...prim,
  glow: color,
  power,
})

function hitOne(o, d, p) {
  if (p.kind === "box") {
    let t0 = -Infinity,
      t1 = Infinity,
      axis = 0,
      sign = 0
    for (let i = 0; i < 3; i++) {
      const inv = 1 / d[i]
      let a = (p.min[i] - o[i]) * inv,
        c = (p.max[i] - o[i]) * inv,
        s = -1
      if (a > c) {
        ;[a, c] = [c, a]
        s = 1
      }
      if (a > t0) {
        t0 = a
        axis = i
        sign = s
      }
      if (c < t1) t1 = c
    }
    if (t0 > t1 || t0 < 1e-4) return null
    const n = [0, 0, 0]
    n[axis] = sign
    return { t: t0, n }
  }
  if (p.kind === "ball") {
    const q = p.sq ?? 1
    const oc = [o[0] - p.c[0], o[1] - p.c[1], (o[2] - p.c[2]) / q],
      dd = [d[0], d[1], d[2] / q]
    const a = dot(dd, dd),
      b = dot(oc, dd),
      c = dot(oc, oc) - p.r * p.r,
      disc = b * b - a * c
    if (disc < 0) return null
    const t = (-b - Math.sqrt(disc)) / a
    if (t < 1e-4) return null
    return {
      t,
      n: norm([oc[0] + dd[0] * t, oc[1] + dd[1] * t, (oc[2] + dd[2] * t) / q]),
    }
  }
  if (p.kind === "cone") {
    const k = (p.r1 - p.r0) / (p.z1 - p.z0)
    const ox = o[0] - p.c[0],
      oy = o[1] - p.c[1],
      rz = p.r0 + k * (o[2] - p.z0),
      rd = k * d[2]
    const a = d[0] * d[0] + d[1] * d[1] - rd * rd,
      b = ox * d[0] + oy * d[1] - rz * rd,
      c = ox * ox + oy * oy - rz * rz
    let best = null
    const disc = b * b - a * c
    if (Math.abs(a) > 1e-9 && disc >= 0) {
      for (const sgn of [-1, 1]) {
        const t = (-b + sgn * Math.sqrt(disc)) / a,
          z = o[2] + d[2] * t
        if (
          t > 1e-4 &&
          z >= p.z0 &&
          z <= p.z1 &&
          p.r0 + k * (z - p.z0) >= 0 &&
          (!best || t < best.t)
        )
          best = {
            t,
            n: norm([
              ox + d[0] * t,
              oy + d[1] * t,
              -k * Math.hypot(ox + d[0] * t, oy + d[1] * t),
            ]),
          }
      }
    }
    for (const [z, r, sg] of [
      [p.z1, p.r1, 1],
      [p.z0, p.r0, -1],
    ]) {
      const t = (z - o[2]) / d[2]
      if (t < 1e-4 || (best && t >= best.t)) continue
      const x = ox + d[0] * t,
        y = oy + d[1] * t
      if (x * x + y * y <= r * r) best = { t, n: [0, 0, sg] }
    }
    return best
  }
  // A cylinder standing on z.
  let best = null
  const ox = o[0] - p.c[0],
    oy = o[1] - p.c[1]
  const a = d[0] * d[0] + d[1] * d[1],
    b = ox * d[0] + oy * d[1],
    c = ox * ox + oy * oy - p.r * p.r
  const disc = b * b - a * c
  if (a > 1e-9 && disc >= 0) {
    const t = (-b - Math.sqrt(disc)) / a,
      z = o[2] + d[2] * t
    if (t > 1e-4 && z >= p.z0 && z <= p.z1)
      best = { t, n: norm([ox + d[0] * t, oy + d[1] * t, 0]) }
  }
  for (const [z, s] of [
    [p.z1, 1],
    [p.z0, -1],
  ]) {
    const t = (z - o[2]) / d[2]
    if (t < 1e-4 || (best && t >= best.t)) continue
    const x = ox + d[0] * t,
      y = oy + d[1] * t
    if (x * x + y * y <= p.r * p.r) best = { t, n: [0, 0, s] }
  }
  return best
}
function hit(o, d, prims, shadow = false) {
  let best = null
  for (const p of prims) {
    if (shadow && (p.glow || p.noShadow)) continue
    const h = hitOne(o, d, p)
    if (h && (!best || h.t < best.t)) {
      best = h
      best.p = p
      if (shadow) return best
    }
  }
  return best
}

/** `ground` is the radius the floor fades out at, in world units. */
// One hue: an amber ramp from near-black to cream, warmer as it gets lighter, and three steps of one cool accent.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
export const RAMP = [
  "#0b0705",
  "#1c0e07",
  "#3a1a0a",
  "#6b2e0e",
  "#a04a12",
  "#d6761f",
  "#f7a148",
  "#ffcf8a",
  "#f6e3c0",
].map(hex)
const COOLRAMP = ["#0d2226", "#1f4f58", "#3f8f9a", "#8fd0d4"].map(hex)
// Everything that is not the point of the picture: black, greys and a warm white.
const GREY = [
  "#0b0b0c",
  "#19191b",
  "#2c2c30",
  "#48484d",
  "#6c6b6f",
  "#959391",
  "#bfbbb4",
  "#e2ddd2",
  "#f6f1e6",
].map(hex)
const isKey = (c) => c === MAT.orange || c === MAT.mustard || c === MAT.red
const lum = (c) => (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255
const isCool = (c) => c === MAT.aqua || c === GLOW.cyan
/** The sky in one hue: dim stars, and a banded planet or sun that fills a corner. */
function monoSky(x, y, { planet, moon, seed = 1 } = {}) {
  const bayer = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16
  let c = GREY[0]
  const r = rnd(x + seed * 131, y)
  if (r > 0.997) c = r > 0.9994 ? GREY[8] : r > 0.9985 ? GREY[5] : GREY[3]
  for (const b of [moon, planet]) {
    if (!b) continue
    const [cx, cy, R, , ring] = b,
      dx = x - cx,
      dy = y - cy,
      q = Math.hypot(dx, dy)
    const tx = dx * 0.96 + dy * 0.28,
      ty = (-dx * 0.28 + dy * 0.96) * 4.2,
      e = Math.hypot(tx, ty) / R
    const onRing = ring && e > 1.3 && e < 1.75 && !(e > 1.52 && e < 1.58)
    if (q <= R) {
      if (onRing && ty > 0) {
        c = RAMP[e > 1.58 ? 5 : 7]
        continue
      }
      const nz = Math.sqrt(Math.max(0, 1 - (q / R) ** 2))
      let l = (dx / R) * -0.6 + (dy / R) * -0.55 + nz * 0.5
      const stripe =
        Math.sin((dy / R) * 11 + Math.sin((dx / R) * 2.4) * 1.2) > 0.3
          ? -0.14
          : 0
      l = Math.max(
        0.5,
        Math.min(6.999, (0.12 + Math.max(0, l) * 0.78 + stripe) * 7 + 1)
      )
      c = RAMP[Math.min(7, Math.floor(l) + (l - Math.floor(l) > bayer ? 1 : 0))]
    } else if (onRing) c = RAMP[e > 1.58 ? 4 : 6]
  }
  return c
}
const rnd = (a, b) => {
  let h = (a * 374761393 + b * 668265263) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
/** The sky behind a scene: dithered haze, stars, a ringed planet and a moon. */
function sky(x, y, { planet, moon, seed = 1 } = {}) {
  const bayer = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16
  let c = BG
  // A band of haze from lower-left to upper-right.
  const gx = x / 28,
    gy = y / 28,
    ix = Math.floor(gx),
    iy = Math.floor(gy),
    fx = gx - ix,
    fy = gy - iy
  const n =
    (rnd(ix, iy + seed) * (1 - fx) + rnd(ix + 1, iy + seed) * fx) * (1 - fy) +
    (rnd(ix, iy + 1 + seed) * (1 - fx) + rnd(ix + 1, iy + 1 + seed) * fx) * fy
  const band =
    1 -
    Math.abs((x * 0.5 + (H - y)) / (W * 0.5 + H) - 0.55) * 3.2 +
    (n - 0.5) * 0.9
  if (band > 0.25 && (band - 0.25) * 0.9 > bayer) c = [24, 20, 44]
  if (band > 0.75 && (band - 0.75) * 1.2 > bayer) c = [40, 28, 62]
  const r = rnd(x + seed * 131, y)
  if (r > 0.9965)
    c =
      r > 0.9992
        ? [255, 236, 190]
        : r > 0.998
          ? [170, 180, 220]
          : [96, 100, 140]
  for (const [bx, by] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    if (rnd(x + bx + seed * 131, y + by) > 0.9995) c = [150, 140, 150] // a big star's rays
  for (const b of [moon, planet]) {
    if (!b) continue
    const [cx, cy, R, col, ring] = b,
      dx = x - cx,
      dy = y - cy,
      q = Math.hypot(dx, dy)
    // The ring is an ellipse tilted a little; its far half hides behind the planet.
    const tx = dx * 0.94 + dy * 0.34,
      ty = (-dx * 0.34 + dy * 0.94) * 3.4,
      e = Math.hypot(tx, ty) / R
    const onRing = ring && ((e > 1.35 && e < 1.62) || (e > 1.7 && e < 1.86))
    if (q <= R) {
      if (onRing && ty > 0) {
        c = e > 1.7 ? tone(ring, 2) : tone(ring, 4)
        continue
      }
      const lx = -0.55,
        ly = -0.6,
        nz = Math.sqrt(Math.max(0, 1 - (q / R) ** 2))
      let l = (dx / R) * lx + (dy / R) * ly + nz * 0.55
      const stripe =
        Math.sin((dy / R) * 9 + Math.sin((dx / R) * 2.2) * 1.3) > 0.35
          ? -0.12
          : 0
      l = Math.max(
        0,
        Math.min(4.999, (0.2 + Math.max(0, l) * 0.8 + stripe) * 5)
      )
      c = tone(
        col,
        Math.min(5, Math.floor(l) + (l - Math.floor(l) > bayer ? 1 : 0))
      )
    } else if (onRing) c = e > 1.7 ? tone(ring, 2) : tone(ring, tx < 0 ? 4 : 3)
  }
  return c
}

/** `ground` is the radius the floor fades out at, in world units; `oy` moves the scene down; `space` draws the sky. */
export function render(
  prims,
  file,
  {
    ground = 9,
    oy = OY,
    space = null,
    mono = false,
    cap = 8,
    stars = true,
    scale = S,
    sprites = [],
    clear = false,
  } = {}
) {
  const lamps = prims
    .filter((p) => p.glow)
    .map((p) => ({
      at:
        p.kind === "box"
          ? p.min.map((c, i) => (c + p.max[i]) / 2)
          : p.kind === "ball"
            ? p.c
            : (p.lampAt ?? [p.c[0], p.c[1], (p.z0 + p.z1) / 2]),
      color: p.glow,
      power: p.power,
    }))
  const px = new Uint8Array(W * H * 4),
    depth = new Float32Array(W * H).fill(Infinity)
  const idx = new Int8Array(W * H).fill(-1),
    mats = new Array(W * H),
    add = new Float32Array(W * H * 3)
  const powers = new Float32Array(W * H)
  const lev = new Float32Array(W * H),
    gain1 = new Float32Array(W * H),
    isFloor = new Uint8Array(W * H)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const u = (x - OX) / scale,
        v = (y - oy) / scale / SIN
      const p0 = [(u + v) / R2, (v - u) / R2, 0]
      const o = p0.map((c, i) => c + D[i] * 80),
        d = D.map((c) => -c)
      const h = hit(o, d, prims)
      if (!h) continue
      const i = y * W + x,
        at = o.map((c, k) => c + d[k] * h.t)
      const bayer = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16
      if (h.p.floor) {
        // The floor dissolves into the page at its edge, in dither.
        const r = Math.hypot(at[0], at[1] * 1.15) / ground
        if (r > 1 || (r > 0.72 && (r - 0.72) / 0.28 > bayer)) continue
      }
      depth[i] = h.t
      if (h.p.glow) {
        idx[i] = 9
        mats[i] = h.p.glow
        powers[i] = h.p.power
        continue
      }
      const lit = dot(h.n, L)
      const shade =
        lit > 0 &&
        hit(
          at.map((c, k) => c + h.n[k] * 2e-3),
          L,
          prims,
          true
        )
      // Top faces are the lightest; height adds a little, so tall things grade.
      let b =
        0.2 +
        (shade ? 0.05 : Math.max(0, lit) * 0.62) +
        (h.n[2] > 0.5 ? 0.08 : 0) +
        Math.min(0.08, at[2] * 0.02)
      b += h.p.lift ?? 0
      let mat = h.p.mat
      if (h.p.floor) {
        const tile = (Math.floor(at[0] / 1.5) + Math.floor(at[1] / 1.5)) & 1
        mat =
          h.p.mat === MAT.floor
            ? tile
              ? MAT.tile
              : MAT.floor
            : tile && !mono
              ? MAT.plate
              : h.p.mat
        if (mono && tile) b -= 0.05
        const fx = at[0] / 1.5 - Math.floor(at[0] / 1.5),
          fy = at[1] / 1.5 - Math.floor(at[1] / 1.5)
        if (fx < 0.04 || fy < 0.04) b -= 0.1
      }
      const level = Math.max(0, Math.min(4.999, b * 6))
      idx[i] = Math.min(
        5,
        Math.floor(level) + (level - Math.floor(level) > bayer ? 1 : 0)
      )
      mats[i] = mat
      lev[i] = b
      isFloor[i] = h.p.floor ? 1 : 0
      for (const lamp of lamps) {
        const to = lamp.at.map((c, k) => c - at[k]),
          d2 = dot(to, to)
        const facing = Math.max(0.15, dot(h.n, norm(to)))
        const gain = (lamp.power * facing) / (1 + d2 * 1.6)
        if (gain < 0.01) continue
        gain1[i] += gain
        for (let k = 0; k < 3; k++)
          add[i * 3 + k] += lamp.color[k] * gain * 0.55
      }
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      if (idx[i] < 0) {
        px.set(
          [
            ...(mono
              ? stars
                ? monoSky(x, y, space ?? {})
                : GREY[0]
              : space
                ? sky(x, y, space)
                : BG),
            255,
          ],
          i * 4
        )
        continue
      }
      let c
      if (mono) {
        const m = mats[i],
          cool = isCool(m),
          bayer = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16
        const key = isKey(m),
          power = idx[i] === 9 ? powers[i] : 0
        if (idx[i] === 9)
          c = cool
            ? COOLRAMP[3]
            : power >= 0.5
              ? power >= 1.4
                ? RAMP[7]
                : RAMP[6]
              : GREY[7]
        else {
          // Value only: the material sets how light the thing is, the light sets the step. Flat steps; only the floor dithers.
          let v =
            lev[i] * (0.45 + lum(m) * 1.25) + Math.min(0.5, gain1[i] * 0.9)
          const here = depth[i]
          if (
            x > 0 &&
            y > 0 &&
            (depth[i - 1] - here > 0.3 || depth[i - W] - here > 0.3)
          )
            v += 0.1
          else if (
            x < W - 1 &&
            y < H - 1 &&
            (depth[i + 1] - here > 0.3 || depth[i + W] - here > 0.3)
          )
            v -= 0.09
          const ramp = cool ? COOLRAMP : key ? RAMP : GREY,
            n = ramp.length - 1
          const q = Math.max(
            cool ? 0 : 1,
            Math.min(n - 0.001, v * (cool ? 4.2 : 8.4))
          )
          c =
            ramp[
              Math.min(
                key || cool ? n : Math.min(n, cap),
                Math.floor(q) +
                  (isFloor[i] && q - Math.floor(q) > bayer ? 1 : 0)
              )
            ]
        }
        px.set([c[0], c[1], c[2], 255], i * 4)
        continue
      }
      if (idx[i] === 9) c = mats[i]
      else {
        let l = idx[i]
        const here = depth[i]
        // Edges from the depth buffer: a light rim on upper-left edges, a dark line where a thing meets what is behind it on the right.
        if (
          x > 0 &&
          y > 0 &&
          (depth[i - 1] - here > 0.3 || depth[i - W] - here > 0.3)
        )
          l = Math.min(5, l + 1)
        else if (
          x < W - 1 &&
          y < H - 1 &&
          (depth[i + 1] - here > 0.3 || depth[i + W] - here > 0.3)
        )
          l = Math.max(0, l - 1)
        c = tone(mats[i], l)
        // Lamp light in steps, so it stays pixel art.
        const bayer = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16
        c = c.map((v, k) => {
          const a = add[i * 3 + k] / 24
          return Math.min(
            255,
            v + (Math.floor(a) + (a - Math.floor(a) > bayer ? 1 : 0)) * 24
          )
        })
      }
      px.set([c[0], c[1], c[2], 255], i * 4)
    }
  // Sprites: a model drawn elsewhere with the same camera (sprite/index.html), set down at a point of the scene.
  // `tint` redraws it in the amber ramp by its lightness; without it the model keeps its own colours, in steps.
  for (const { w: sw, h: sh, data, at, tint } of sprites) {
    const src = Buffer.from(data, "base64")
    const cx = Math.round(OX + ((at[0] - at[1]) / R2) * scale),
      cy = Math.round(
        oy + ((at[0] + at[1]) / R2) * scale * SIN - at[2] * scale * COS
      )
    for (let y = 0; y < sh; y++)
      for (let x = 0; x < sw; x++) {
        const k = (y * sw + x) * 4,
          X = cx - (sw >> 1) + x,
          Y = cy - (sh >> 1) + y
        if (src[k + 3] < 128 || X < 0 || Y < 0 || X >= W || Y >= H) continue
        let c = [src[k], src[k + 1], src[k + 2]]
        if (tint)
          c = RAMP[Math.max(2, Math.min(8, Math.round(lum(c) * 7.2) + 1))]
        else {
          const m = (c[0] + c[1] + c[2]) / 3
          c = c.map((v) =>
            Math.max(
              0,
              Math.min(255, Math.round((m + (v - m) * 1.5) / 24) * 24)
            )
          )
        } // a little more colour, in steps
        px.set([c[0], c[1], c[2], 255], (Y * W + X) * 4)
      }
  }
  // `clear`: nothing hit is transparent, and the file is cut to what was drawn.
  // The cut is returned in canvas pixels, so a page can set the picture back in place.
  let box0 = { x: 0, y: 0, w: W, h: H }
  if (clear) {
    let x0 = W,
      y0 = H,
      x1 = -1,
      y1 = -1
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (depth[y * W + x] !== Infinity) {
          x0 = Math.min(x0, x)
          x1 = Math.max(x1, x)
          y0 = Math.min(y0, y)
          y1 = Math.max(y1, y)
        }
    box0 =
      x1 < 0
        ? { x: 0, y: 0, w: 1, h: 1 }
        : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
  }
  const K = 3,
    w = box0.w * K,
    hgt = box0.h * K,
    raw = Buffer.alloc((w * 4 + 1) * hgt)
  for (let y = 0; y < hgt; y++) {
    const row = y * (w * 4 + 1) + 1,
      sy = (box0.y + ((y / K) | 0)) * W
    for (let x = 0; x < w; x++) {
      const s = (sy + box0.x + ((x / K) | 0)) * 4
      raw[row + x * 4] = px[s]
      raw[row + x * 4 + 1] = px[s + 1]
      raw[row + x * 4 + 2] = px[s + 2]
      raw[row + x * 4 + 3] = clear && depth[s / 4] === Infinity ? 0 : 255
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(zlib.crc32(body) >>> 0)
    return Buffer.concat([len, body, crc])
  }
  const head = Buffer.alloc(13)
  head.writeUInt32BE(w, 0)
  head.writeUInt32BE(hgt, 4)
  head.set([8, 6, 0, 0, 0], 8)
  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", head),
      chunk("IDAT", zlib.deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ])
  )
  return box0
}
export const floor = () =>
  box(-30, -30, -1, 60, 60, 1, MAT.floor, { floor: true })
