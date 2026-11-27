// The /device room: one picture per block and per frame, cut to what it draws, plus where each sits.
// Usage (from apps/web): PX_W=960 PX_H=360 node scripts/pixel/device.mjs
// Writes public/device/*.png and lib/room-layout.json. The page stacks the pictures in place.
import fs from "node:fs"
import { render, W } from "./engine.mjs"
import { B, toPrims } from "./room-blocks.mjs"

const OUT = "public/device",
  LAYOUT = "lib/room-layout.json"
fs.mkdirSync(OUT, { recursive: true })

// Camera: the engine's, at this scale and height.
const SCALE = 7.6,
  OY = 168,
  SIN = 0.5,
  COS = Math.sqrt(3) / 2
const proj = ([x, y, z]) => [
  +(W / 2 + ((x - y) / Math.SQRT2) * SCALE).toFixed(1),
  +(OY + ((x + y) / Math.SQRT2) * SCALE * SIN - z * SCALE * COS).toFixed(1),
]
const opts = {
  ground: 8.2,
  oy: OY,
  scale: SCALE,
  cap: 6,
  stars: false,
  clear: true,
}

// u runs left to right on screen, v back to front.
const at = (u, v) => [(u + v) / 2, (v - u) / 2]
// The room as drawn. The camera is orthographic, so the page can move each block's
// drawing anywhere on screen; it places them itself (components/device-room.tsx).
const ROOMS = {
  wide: {
    spots: {
      workbench: at(0, -20),
      hopper: at(-58, 2),
      spawner: at(-30, 12),
      anvil: at(0, 16),
      enderchest: at(30, 12),
      furnace: at(58, 2),
    },
  },
}

const place = (prims, [dx, dy]) =>
  prims.map((p) => ({
    ...p,
    min: [p.min[0] + dx, p.min[1] + dy, p.min[2]],
    max: [p.max[0] + dx, p.max[1] + dy, p.max[2]],
  }))

const shot = (name, model, spot, size = 0.5) => {
  const b = render(
    place(toPrims(model, -8, -8, size), spot),
    `${OUT}/${name}.png`,
    opts
  )
  return { src: `/device/${name}.png`, ...b }
}

// Frames: what each block shows at rest and when chosen.
const FRAMES = {
  workbench: { rest: [() => B.workbench()] },
  hopper: { rest: [() => B.hopper()] },
  anvil: { rest: [() => B.anvil()] },
  spawner: {
    rest: Array.from({ length: 12 }, (_, f) => () => B.spawner(f * 30)),
    lit: Array.from({ length: 12 }, (_, f) => () => B.spawner(f * 30 + 15, 28)),
  },
  enderchest: {
    rest: [() => B.enderchest(0)],
    open: Array.from({ length: 6 }, (_, f) => () => B.enderchest((f + 1) * 15)),
  },
  furnace: {
    rest: Array.from({ length: 3 }, (_, f) => () => B.furnace(0, f)),
    lit: Array.from({ length: 4 }, (_, f) => () => B.furnace(1, f + 10)),
  },
}

const out = {}
for (const [room, { spots }] of Object.entries(ROOMS)) {
  const blocks = {}
  for (const [id, spot] of Object.entries(spots)) {
    const sets = {}
    for (const [set, list] of Object.entries(FRAMES[id]))
      sets[set] = list.map((make, f) =>
        shot(`${room}-${id}-${set}-${f}`, make(), spot)
      )
    blocks[id] = { foot: proj([...spot, 0]), frames: sets }
  }
  out[room] = blocks
}

fs.writeFileSync(LAYOUT, JSON.stringify({ blocks: out.wide }, null, 1) + "\n")
console.log("wrote", LAYOUT, Object.keys(out).join(", "))
