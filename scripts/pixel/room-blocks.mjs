// Device blocks as 16 by 16 by 16 voxel models, one voxel a texture pixel.
// Our own drawings. The palettes are sampled from the game's look; no texture is copied.
// A model is a Map from "x,y,z" to a palette key; toPrims turns it into engine boxes.
import { box, glow, GLOW } from "./engine.mjs"

export const PAL = {
  s: [128, 128, 132],
  t: [100, 100, 106],
  u: [76, 76, 82],
  k: [26, 26, 30],
  w: [160, 112, 66],
  v: [122, 82, 46],
  x: [84, 56, 30],
  i: [168, 168, 172],
  j: [92, 92, 100],
  l: [58, 58, 66],
  o: [22, 34, 36],
  p: [32, 52, 54],
  q: [54, 88, 84],
  y: [120, 156, 140],
  m: [110, 200, 120],
  n: [70, 150, 90],
  E0: [3, 13, 17],
  E1: [13, 28, 36],
  E5: [4, 30, 38],
  E2: [38, 60, 62],
  E3: [6, 40, 50],
  E4: [40, 112, 100],
  G1: [185, 167, 54],
  G2: [145, 117, 32],
  V1: [93, 146, 85],
  V2: [78, 124, 85],
}
const LIT = { f: GLOW.amber, r: GLOW.red, e: GLOW.cyan }

// A tiny deterministic noise, so stone looks the same on every render.
const hash = (a, b, c = 0) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

// A model is a Map from "x,y,z" to a palette key. Faces seen by the camera: +x, +y and +z.
const model = () => new Map()
const put = (m, x, y, z, k) => m.set(`${x},${y},${z}`, k)
const fill = (m, x0, y0, z0, x1, y1, z1, color) => {
  for (let x = x0; x < x1; x++)
    for (let y = y0; y < y1; y++)
      for (let z = z0; z < z1; z++)
        put(m, x, y, z, typeof color === "function" ? color(x, y, z) : color)
  return m
}
// Keep only voxels with an open face toward the camera, then turn each into a box.
export const toPrims = (m, dx = -8, dy = -8, s = 1) => {
  const prims = []
  for (const [key, k] of m) {
    const [x, y, z] = key.split(",").map(Number)
    const open =
      !m.has(`${x + 1},${y},${z}`) ||
      !m.has(`${x},${y + 1},${z}`) ||
      !m.has(`${x},${y},${z + 1}`)
    if (!open) continue
    const b = box(
      (x + dx) * s,
      (y + dy) * s,
      z * s,
      s,
      s,
      s,
      LIT[k] ? PAL.k : PAL[k]
    )
    prims.push(LIT[k] ? glow(b, LIT[k], 0.9) : b)
  }
  return prims
}

// Texture helpers, by which face a voxel sits on.
const stone = (a, b, c) =>
  hash(a, b, c) < 0.18 ? "u" : hash(b, a, c) < 0.35 ? "t" : "s"
const plank = (a, z) =>
  z % 4 === 0 ? "x" : hash(a >> 2, z >> 2) < 0.2 && a % 5 === 0 ? "v" : "w"

export const B = {
  // `fire`: 0 embers, 1 a full fire. `seed` picks the flicker.
  furnace(fire = 0, seed = 0) {
    const top = fire ? 7 : 4
    return fill(model(), 0, 0, 0, 16, 16, 16, (x, y, z) => {
      if (z === 15)
        return x === 0 || x === 15 || y === 0 || y === 15
          ? "t"
          : x > 2 && x < 13 && y > 2 && y < 13
            ? "s"
            : "t"
      if (y === 15) {
        if (z >= 3 && z <= 8 && x >= 3 && x <= 12) {
          if (z === 3) return hash(x, seed) < 0.45 ? "r" : "f"
          if (z <= top)
            return hash(x, z, seed) < 0.75 - (z - 3) * (fire ? 0.12 : 0.3)
              ? hash(z, x, seed) < 0.3
                ? "r"
                : "f"
              : "k"
          return "k"
        }
        if (z === 11 || z === 12) return x >= 2 && x <= 13 ? "u" : "s"
        return stone(x, z, 1)
      }
      return stone(x === 15 ? y : x, z, 2)
    })
  },
  // The spawner's guest alone, standing on the floor: what pops out when the spawner is chosen.
  mob(turn = 30) {
    const m = model()
    spin(m, turn)
    const out = model()
    for (const [key, k] of m) {
      if (k === "f") continue
      const [x, y, z] = key.split(",").map(Number)
      put(out, x, y, z - 2, k)
    }
    return out
  },
  workbench() {
    return fill(model(), 0, 0, 0, 16, 16, 16, (x, y, z) => {
      if (z === 15)
        return x === 0 ||
          x === 15 ||
          y === 0 ||
          y === 15 ||
          x === 5 ||
          x === 10 ||
          y === 5 ||
          y === 10
          ? "x"
          : "w"
      if (z >= 13) return "x"
      if (y === 15) {
        // a hammer on the left, a saw on the right
        if ((z === 10 && x >= 2 && x <= 6) || (x === 4 && z >= 3 && z <= 9))
          return "l"
        if (
          (z === 9 && x >= 9 && x <= 13) ||
          (z === 8 && x >= 9 && x <= 13 && x % 2 === 1)
        )
          return "i"
        if (x >= 13 && x <= 14 && z >= 9 && z <= 11) return "x"
      }
      return plank(x === 15 ? y : x, z)
    })
  },
  // `sparks`: how many flames fly in the cage; more when the spawner is chosen.
  spawner(turn = null, sparks = 10) {
    const m = model()
    const bar = (a) => a === 0 || a === 5 || a === 10 || a === 15
    // Bars on every face, a dark empty inside. The cage is drawn as a lattice of 1 voxel bars.
    for (let x = 0; x < 16; x++)
      for (let y = 0; y < 16; y++)
        for (let z = 0; z < 16; z++) {
          const onFace =
            x === 0 || x === 15 || y === 0 || y === 15 || z === 0 || z === 15
          if (!onFace) continue
          const a =
            x === 0 || x === 15 ? [y, z] : y === 0 || y === 15 ? [x, z] : [x, y]
          if (bar(a[0]) || bar(a[1]))
            put(m, x, y, z, (a[0] + a[1]) % 7 === 0 ? "l" : "j")
        }
    if (turn !== null) spin(m, turn, sparks)
    return m
  },
  chest(open = 0) {
    return chest(open, {
      body: "w",
      dark: "v",
      edge: "x",
      latch: "i",
      inside: "k",
    })
  },
  enderchest(open = 0) {
    // Near-black body with vertical streaks, a slate lid with a dotted rim, a gold latch and a green eye.
    const skin = (x, y, z, top) => {
      if (top) {
        const rim = x === 1 || x === 14 || y === 1 || y === 14
        return rim
          ? (x + y) % 2
            ? "E4"
            : "E2"
          : hash(x, y) < 0.2
            ? "E5"
            : "E3"
      }
      const a = y === 14 ? x : y
      if (a === 1 || a === 14) return "E1"
      const band = hash(a, z >> 2)
      return band < 0.22 ? "E2" : band < 0.5 ? "E1" : "E0"
    }
    const m = chest(open, {
      skin,
      dark: "E0",
      latch: "G1",
      latch2: "G2",
      inside: "k",
    })
    // The eye: a green ring on the front, under the latch.
    for (const [x, z] of [
      [6, 3],
      [6, 4],
      [6, 5],
      [6, 6],
      [6, 7],
      [9, 3],
      [9, 4],
      [9, 5],
      [9, 6],
      [9, 7],
      [7, 2],
      [8, 2],
      [7, 8],
      [8, 8],
    ])
      put(m, x, 14, z, (x + z) % 3 ? "V1" : "V2")
    return m
  },
  anvil() {
    const m = model()
    const c = (x, y, z) =>
      z === 15
        ? x === 0 || x === 15 || y === 3 || y === 12
          ? "j"
          : "i"
        : (x + z) % 9 === 0
          ? "l"
          : "j"
    fill(m, 2, 4, 0, 14, 12, 4, c)
    fill(m, 4, 5, 4, 12, 11, 5, c)
    fill(m, 6, 6, 5, 10, 10, 10, c)
    fill(m, 0, 3, 10, 16, 13, 16, c)
    return m
  },
  hopper() {
    const m = model()
    const c = (x, y, z) => ((x + y + z) % 8 === 0 ? "l" : "j")
    // The bowl: 2 voxel walls around a floor sunk 5 voxels below the rim.
    fill(m, 0, 0, 10, 16, 16, 11, c)
    fill(m, 0, 0, 11, 16, 2, 16, c)
    fill(m, 0, 14, 11, 16, 16, 16, c)
    fill(m, 0, 2, 11, 2, 14, 16, c)
    fill(m, 14, 2, 11, 16, 14, 16, c)
    fill(m, 2, 2, 10, 14, 14, 11, (x, y) => ((x + y) % 2 ? "l" : "u"))
    fill(m, 4, 4, 4, 12, 12, 10, c)
    fill(m, 6, 6, 0, 10, 10, 4, c)
    return m
  },
}

// A chest: body 14 wide and 10 high, a lid 4 high hinged at the back top edge.
function chest(open, k) {
  const m = model()
  const skin =
    k.skin ??
    ((x, y, z, top) => {
      if (k.speck && hash(x, y, z) < 0.12) return k.edge
      const edge =
        x === 1 ||
        x === 14 ||
        y === 1 ||
        y === 14 ||
        (!top && (z === 0 || z === 9))
      return edge ? k.dark : k.body
    })
  fill(m, 1, 1, 0, 15, 15, 10, (x, y, z) => skin(x, y, z, false))
  if (open > 0) fill(m, 2, 2, 8, 14, 14, 10, k.inside) // the dark inside shows once the lid lifts
  // Lid voxels, rotated about the hinge line y = 1, z = 10 by `open` degrees.
  const th = (open * Math.PI) / 180
  const seen = new Set()
  for (let x = 1; x < 15; x++)
    for (let v = 0; v < 14; v += 0.5)
      for (let w = 0; w < 4; w += 0.5) {
        const y = 1 + v * Math.cos(th) - w * Math.sin(th)
        const z = 10 + v * Math.sin(th) + w * Math.cos(th)
        const key = `${x},${Math.round(y)},${Math.round(z)}`
        if (seen.has(key)) continue
        seen.add(key)
        const top = w >= 3.5
        const front = v >= 13.5
        put(
          m,
          x,
          Math.round(y),
          Math.round(z),
          top || front ? skin(x, Math.round(v), Math.round(w), top) : k.dark
        )
      }
  // The latch: on the front of the lid, it rides up with the lid.
  for (const [lx, lz] of [
    [7, 0],
    [8, 0],
    [7, 1],
    [8, 1],
    [7, 2],
    [8, 2],
  ]) {
    const v = 14,
      w = 1.5 - lz
    const y = 1 + v * Math.cos(th) - w * Math.sin(th)
    const z = 10 + v * Math.sin(th) + w * Math.cos(th)
    put(
      m,
      lx,
      Math.round(y),
      Math.round(z),
      lz === 0 && k.latch2 ? k.latch2 : k.latch
    )
  }
  return m
}

// The spawner's guest: a small figure of our own design, turning, with sparks around it.
function spin(m, deg, sparks = 10) {
  const th = (deg * Math.PI) / 180
  const vox = []
  // body 4 wide, 2 deep, 6 high; a head 4 by 4 by 4; 2 arms held forward
  for (let x = -2; x <= 1; x++)
    for (let y = -1; y <= 0; y++)
      for (let z = 2; z <= 7; z++) vox.push([x, y, z, "n"])
  for (let x = -2; x <= 1; x++)
    for (let y = -2; y <= 1; y++)
      for (let z = 8; z <= 11; z++) vox.push([x, y, z, "m"])
  for (const x of [-3, 2])
    for (let y = -1; y <= 2; y++) vox.push([x, y, 6, "n"])
  vox.push([-1, 2, 10, "e"], [0, 2, 10, "e"])
  for (const [x, y, z, c] of vox) {
    const rx = x * Math.cos(th) - y * Math.sin(th),
      ry = x * Math.sin(th) + y * Math.cos(th)
    put(m, Math.round(8 + rx), Math.round(8 + ry), z, c)
  }
  for (let s = 0; s < sparks; s++) {
    const a = hash(s, deg) * 14 + 1,
      b = hash(deg, s) * 14 + 1,
      c = hash(s, s, deg) * 12 + 2
    put(m, Math.round(a), Math.round(b), Math.round(c), "f")
  }
}
