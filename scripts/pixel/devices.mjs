// One machine a product, the way 1970s hardware was built: a dark case, chunky keys, one lit part in amber.
import {
  ball,
  box,
  cone,
  cyl,
  disc,
  floor,
  glow,
  GLOW,
  MAT,
  render,
} from "./engine.mjs"
import fs from "node:fs"
const out = process.argv[2],
  only = process.argv[3]
fs.mkdirSync(out, { recursive: true })
const SPRITE = Object.fromEntries(
  ["good", "zyx"].map((n) => [
    n,
    JSON.parse(
      fs.readFileSync(new URL(`./sprites/${n}.json`, import.meta.url), "utf8")
    ),
  ])
)
const A = GLOW.amber,
  K = MAT.dark,
  G = MAT.steel,
  L = MAT.hull
const SEG = {
  0: "abcdef",
  1: "bc",
  2: "abdeg",
  3: "abcdg",
  4: "bcfg",
  5: "acdfg",
  6: "acdefg",
  7: "abc",
  8: "abcdefg",
  9: "abcdfg",
}
const digit = (x, y, z, n, s = 1) =>
  [...SEG[n]].map((k) => {
    const t = 0.16 * s,
      w = 0.8 * s,
      h = 0.8 * s
    const r = {
      a: [0, 2 * h, w, t],
      g: [0, h, w, t],
      d: [0, 0, w, t],
      f: [0, h, t, h + t],
      b: [w - t, h, t, h + t],
      e: [0, 0, t, h + t],
      c: [w - t, 0, t, h + t],
    }[k]
    return glow(box(x + r[0], y, z + r[1], r[2], 0.04, r[3]), A, 1.0)
  })
// Keys on a top face: `cols` by `rows`, one of them amber.
const keys = (x, y, z, cols, rows, hot = -1, s = 0.5) =>
  Array.from({ length: cols * rows }, (_, k) =>
    box(
      x + (k % cols) * s,
      y + ((k / cols) | 0) * s,
      z,
      s * 0.76,
      s * 0.76,
      0.14,
      k === hot ? MAT.orange : L,
      { lift: 0.06 }
    )
  )
const knob = (x, y, z, r = 0.3, hot = false) => [
  cyl(x, y, z, r, 0.3, hot ? MAT.orange : L, { lift: 0.08 }),
  cyl(x, y, z + 0.3, r * 0.5, 0.06, K),
]
const feet = (x, y, w, d) =>
  [
    [0.3, 0.3],
    [w - 0.7, 0.3],
    [0.3, d - 0.7],
    [w - 0.7, d - 0.7],
  ].map(([a, b]) => box(x + a, y + b, 0, 0.4, 0.4, 0.2, K))

const S = {
  // Time: a tube clock. Four tubes on a low case, two knobs to set it.
  time() {
    const p = [
      ...feet(-5, -1.6, 10, 3.6),
      box(-5, -1.6, 0.2, 10, 3.6, 1.4, K),
      box(-5.1, -1.7, 1.6, 10.2, 3.8, 0.16, G),
    ]
    for (let i = 0; i < 4; i++) {
      const x = -4.3 + i * 2.2 + (i > 1 ? 0.5 : 0)
      p.push(
        cyl(x + 0.75, -0.4, 1.76, 0.95, 0.3, G),
        box(x - 0.1, -0.9, 2.06, 1.7, 0.08, 2.9, K, { lift: -0.1 }),
        ...digit(x + 0.2, -0.78, 2.3, [1, 2, 3, 4][i], 1.4),
        disc(x + 0.75, -0.4, 5.0, 0.95, 0.4, G),
        box(x - 0.2, -0.95, 2.06, 0.08, 0.08, 3.0, L),
        box(x + 1.62, -0.95, 2.06, 0.08, 0.08, 3.0, L)
      )
    }
    p.push(
      glow(box(0.3, -0.7, 3.0, 0.26, 0.04, 0.26), A, 1.0),
      glow(box(0.3, -0.7, 4.0, 0.26, 0.04, 0.26), A, 1.0),
      ...knob(-4.2, 1.3, 1.76),
      ...knob(-3.3, 1.3, 1.76),
      ...knob(4.0, 1.3, 1.76, 0.36, true)
    )
    for (let i = 0; i < 14; i++)
      p.push(box(-4.6 + i * 0.66, 2.0, 0.5, 0.4, 0.03, 0.8, G, { lift: -0.1 }))
    return p
  },
  // Golem: a watch console. A screen of bars, a dome lamp that lights when something is wrong.
  golem() {
    const p = [
      ...feet(-4, -2.6, 8, 5.6),
      box(-4, -2.6, 0.2, 8, 5.6, 1.2, K),
      box(-4.1, -2.7, 1.4, 8.2, 2.9, 0.14, G),
    ]
    p.push(
      box(-3.6, -2.4, 1.54, 5.0, 2.4, 3.6, K),
      box(-3.4, 0.0, 1.9, 4.6, 0.06, 2.9, G, { lift: -0.2 })
    )
    for (let k = 0; k < 9; k++)
      p.push(
        glow(
          box(
            -3.1 + k * 0.46,
            0.08,
            2.2,
            0.3,
            0.03,
            0.4 + ((k * 5) % 7) * 0.3 + (k === 6 ? 0.5 : 0)
          ),
          A,
          k === 6 ? 1.5 : 0.9
        )
      )
    p.push(
      box(1.7, -2.4, 1.54, 2.0, 2.4, 2.4, K),
      cyl(2.7, -1.2, 3.94, 0.7, 0.16, G),
      glow(disc(2.7, -1.2, 4.1, 0.6, 1.0), A, 2.2)
    )
    for (let k = 0; k < 6; k++)
      p.push(
        glow(
          box(
            1.95 + (k % 3) * 0.55,
            0.02,
            2.0 + ((k / 3) | 0) * 0.7,
            0.3,
            0.03,
            0.3
          ),
          A,
          k === 4 ? 1.0 : 0.1
        )
      )
    p.push(
      ...keys(-3.5, 0.9, 1.4, 9, 3, 26),
      ...knob(1.9, 1.3, 1.4),
      ...knob(2.8, 1.3, 1.4),
      ...knob(1.9, 2.2, 1.4),
      ...knob(2.8, 2.2, 1.4, 0.3, true)
    )
    for (let i = 0; i < 10; i++)
      p.push(
        box(-3.6 + i * 0.75, 3.0, 0.45, 0.45, 0.03, 0.7, G, { lift: -0.1 })
      )
    return p
  },
  // Link: a shortener. The long line on the display becomes the short one; a short ticket comes out.
  link() {
    const p = [...body(10.0, 4.4, 2.6)],
      t = 2.96
    p.push(
      frame(-4.6, 2.2, 0.8, 9.2, 1.9),
      box(-4.6, 2.2, 0.8, 9.2, 0.04, 1.9, K, { lift: -0.25 })
    )
    for (let i = 0; i < 22; i++)
      p.push(
        box(-4.4 + i * 0.4, 2.26, 2.0, 0.28, 0.03, 0.44, i % 7 === 4 ? K : L, {
          lift: -0.05,
        })
      ) // the long address
    for (let i = 0; i < 5; i++)
      p.push(lit(-4.4 + i * 0.4, 2.26, 1.1, 0.28, 0.44, 1.3)) // the short one
    p.push(box(-1.9, 2.26, 1.24, 6.3, 0.03, 0.12, K))
    // On top: the long strip runs into the head; the short ticket leaves on the other side.
    p.push(
      box(-4.6, -0.5, t, 5.6, 1.0, 0.06, L, { lift: 0.1 }),
      box(1.0, -1.0, t, 1.6, 2.0, 1.3, K),
      box(0.9, -1.1, t + 1.3, 1.8, 2.2, 0.14, G),
      glow(box(1.3, 1.02, t + 0.5, 1.0, 0.03, 0.4), A, 1.2)
    )
    for (let i = 0; i < 13; i++)
      p.push(box(-4.4 + i * 0.42, -0.4, t + 0.06, 0.06, 0.8, 0.02, K))
    p.push(
      box(2.6, -0.5, t, 1.2, 1.0, 0.06, MAT.orange, { lift: 0.1 }),
      ...keys(-4.2, 1.0, t, 6, 1, 5, 0.6),
      ...knob(4.2, 1.4, t, 0.36, true),
      ...knob(4.2, -1.4, t, 0.3)
    )
    return p
  },
}

// A case on feet with a lighter lid: the body most machines share. Front face is y = y0 + d.
const body = (w, d, h, x = -w / 2, y = -d / 2) => [
  ...feet(x, y, w, d),
  box(x, y, 0.2, w, d, h, K),
  box(x - 0.1, y - 0.1, h + 0.2, w + 0.2, d + 0.2, 0.16, G),
]
const grille = (x, y, n, z = 0.5, h = 0.8) =>
  Array.from({ length: n }, (_, i) =>
    box(x + i * 0.66, y, z, 0.4, 0.03, h, G, { lift: -0.1 })
  )
const lit = (x, y, z, w, h, power = 1.0) =>
  glow(box(x, y, z, w, 0.03, h), A, power)
const frame = (x, y, z, w, h) =>
  box(x - 0.15, y - 0.04, z - 0.15, w + 0.3, 0.04, h + 0.3, G, { lift: -0.2 })
Object.assign(S, {
  // AIntern: a desk robot between two trays. Work goes in on the left and comes out stamped.
  aintern() {
    const p = [...body(9.6, 4.4, 1.0)],
      t = 1.36
    p.push(
      cone(0, -0.3, t, 1.1, 1.3, 1.9, K),
      cyl(0, -0.3, t + 1.9, 1.4, 0.2, G),
      disc(0, -0.3, t + 2.1, 1.15, 0.9, L),
      cyl(0, -0.3, t + 3.1, 0.04, 0.6, G),
      glow(ball(0, -0.3, t + 3.8, 0.14), A, 1.2)
    )
    p.push(
      lit(-0.5, 0.76, t + 2.35, 0.36, 0.3, 1.4),
      lit(0.2, 0.76, t + 2.35, 0.36, 0.3, 1.4),
      lit(-0.5, 0.98, t + 0.7, 1.0, 0.5)
    )
    p.push(
      box(-1.9, 0.0, t + 1.0, 0.5, 1.4, 0.4, G),
      box(1.4, 0.0, t + 1.0, 0.5, 1.4, 0.4, G)
    )
    p.push(
      box(-4.4, -1.2, t, 2.0, 2.6, 0.2, G),
      box(2.4, -1.2, t, 2.0, 2.6, 0.2, G)
    )
    for (let k = 0; k < 5; k++)
      p.push(
        box(
          -4.2 + k * 0.03,
          -1.0 + k * 0.04,
          t + 0.2 + k * 0.12,
          1.6,
          2.2,
          0.1,
          L,
          { lift: 0.08 }
        )
      )
    for (let k = 0; k < 2; k++)
      p.push(
        box(2.6, -1.0, t + 0.2 + k * 0.12, 1.6, 2.2, 0.1, k ? MAT.orange : L, {
          lift: 0.08,
        })
      )
    p.push(...grille(-4.3, 2.22, 13))
    return p
  },
  // Carrel: a card cage. Six machines side by side, one in use.
  carrel() {
    const p = [...body(9.6, 4.0, 3.6)]
    for (let i = 0; i < 6; i++) {
      const x = -4.5 + i * 1.52,
        on = i === 3
      p.push(
        box(x, 2.0, 0.6, 1.3, 0.08, 3.0, G, { lift: -0.25 }),
        on
          ? lit(x + 0.2, 2.1, 2.2, 0.9, 1.0, 1.3)
          : box(x + 0.2, 2.1, 2.2, 0.9, 0.03, 1.0, K),
        box(x + 0.25, 2.1, 0.9, 0.8, 0.14, 0.2, L)
      )
      p.push(
        glow(box(x + 0.25, 2.1, 1.5, 0.2, 0.03, 0.2), A, on ? 1.0 : 0.1),
        glow(box(x + 0.65, 2.1, 1.5, 0.2, 0.03, 0.2), A, 0.1)
      )
    }
    p.push(
      box(-0.2, 2.1, 0.5, 1.9, 1.5, 0.12, G),
      ...keys(0.0, 2.4, 0.62, 3, 2, 4),
      cyl(-3.6, -0.8, 3.96, 0.5, 0.3, G),
      cyl(-3.6, -0.8, 4.26, 0.06, 1.6, L),
      glow(ball(-3.6, -0.8, 6.0, 0.16), A, 1.0)
    )
    for (let i = 0; i < 8; i++)
      p.push(box(-1.6 + i * 0.7, -1.4, 3.96, 0.44, 2.4, 0.1, K))
    return p
  },
  // Good: a server with its offering on top. The bag is the real model, drawn with the same camera.
  good() {
    const p = [...body(8.0, 4.6, 1.8)],
      t = 2.16
    for (let k = 0; k < 3; k++) {
      p.push(box(-3.7, 2.3, 0.5 + k * 0.5, 7.4, 0.05, 0.36, G, { lift: -0.2 }))
      for (let j = 0; j < 5; j++)
        p.push(
          glow(
            box(-3.4 + j * 0.4, 2.36, 0.6 + k * 0.5, 0.2, 0.03, 0.16),
            A,
            j === 1 && k === 1 ? 0.9 : 0.1
          )
        )
    }
    p.push(cyl(0, 0, t, 1.9, 0.16, G), cyl(0, 0, t + 0.16, 1.5, 0.06, K))
    for (const x of [-3.0, 3.0])
      p.push(
        cyl(x, 1.4, t, 0.24, 0.1, G),
        cyl(x, 1.4, t + 0.1, 0.08, 0.8, L),
        glow(ball(x, 1.4, t + 1.1, 0.2), A, 1.4)
      )
    p.sprites = [{ ...SPRITE.good, at: [0, 0, t + 0.2 + 2.1] }]
    return p
  },
  // Plump: a turntable. The flat mark on the front panel stands on the plate in 3D.
  "3d"() {
    const p = [...body(8.6, 5.2, 1.2)],
      t = 1.56
    p.push(cyl(0, -0.2, t, 2.5, 0.24, G), cyl(0, -0.2, t + 0.24, 2.2, 0.08, K))
    for (let i = 0; i < 12; i++)
      p.push(
        glow(
          box(
            Math.cos(i * 0.5236) * 2.36 - 0.08,
            -0.2 + Math.sin(i * 0.5236) * 2.36 - 0.08,
            t + 0.24,
            0.16,
            0.16,
            0.06
          ),
          A,
          0.1
        )
      )
    p.push(
      lit(-3.9, 2.62, 0.5, 1.6, 0.6),
      ...keys(2.9, 1.0, t, 2, 3, 5),
      ...knob(-3.5, 1.6, t, 0.36, true),
      ...knob(-3.5, 0.6, t, 0.3)
    )
    p.sprites = [{ ...SPRITE.zyx, tint: true, at: [0, -0.2, t + 0.3 + 2.0] }]
    return p
  },
  // UI: a parts cabinet. Rows of small drawers; one is open and holds the part.
  ui() {
    const p = [...body(8.0, 3.6, 4.6)]
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 6; c++) {
        const x = -3.8 + c * 1.28,
          z = 0.6 + r * 1.05,
          open = r === 2 && c === 3
        p.push(
          box(x, 1.8, z, 1.1, open ? 1.4 : 0.1, 0.85, G, {
            lift: open ? 0 : -0.2,
          }),
          box(x + 0.35, open ? 3.2 : 1.9, z + 0.3, 0.4, 0.08, 0.16, L)
        )
        if (open)
          p.push(
            box(x + 0.15, 2.0, z + 0.85, 0.8, 1.0, 0.3, MAT.orange, {
              lift: 0.1,
            })
          )
      }
    p.push(
      box(-3.0, -0.9, 4.96, 0.9, 0.9, 0.9, L),
      cyl(-0.9, -0.4, 4.96, 0.5, 0.9, L),
      ball(1.1, -0.4, 5.46, 0.5, L),
      cone(3.0, -0.4, 4.96, 0.55, 0.05, 1.0, L)
    )
    return p
  },
  // Sensorium: an oscilloscope. A round screen with one trace, four knobs.
  sensorium() {
    const p = [...body(8.6, 5.0, 4.0)]
    p.push(
      frame(-3.6, 2.5, 1.0, 4.6, 3.0),
      box(-3.6, 2.5, 1.0, 4.6, 0.04, 3.0, K, { lift: -0.2 })
    )
    for (let k = 0; k < 16; k++)
      p.push(
        lit(
          -3.4 + k * 0.27,
          2.56,
          2.4 + Math.sin(k * 0.8) * 1.0 * (k < 12 ? 1 : 0.3),
          0.2,
          0.2,
          1.2
        )
      )
    for (let k = 0; k < 4; k++)
      p.push(
        box(
          1.7 + (k % 2) * 1.2,
          2.5,
          1.2 + (k >> 1) * 1.4,
          0.8,
          0.3,
          0.8,
          k === 1 ? MAT.orange : L,
          { lift: 0.05 }
        )
      )
    p.push(
      lit(1.7, 2.56, 3.8, 2.0, 0.24, 0.6),
      cyl(-2.8, -1.2, 4.36, 0.6, 0.3, G),
      cone(-2.8, -1.2, 4.66, 0.16, 1.2, 0.6, L),
      cyl(-2.8, -1.2, 5.3, 0.04, 0.7, G),
      glow(ball(-2.8, -1.2, 6.1, 0.12), A, 1.0)
    )
    for (let i = 0; i < 6; i++)
      p.push(box(0.2 + i * 0.6, -1.8, 4.36, 0.36, 2.6, 0.1, K))
    return p
  },
  // NYCU AI: a slide projector. A tray of slides on top, a beam out the front.
  ai() {
    const p = [...body(7.6, 5.0, 1.8)],
      t = 2.16
    p.push(
      cyl(-0.6, -0.4, t, 2.1, 0.7, G),
      cyl(-0.6, -0.4, t + 0.7, 0.5, 0.2, K)
    )
    for (let i = 0; i < 20; i++)
      p.push(
        box(
          -0.6 + Math.cos(i * 0.314) * 1.75 - 0.1,
          -0.4 + Math.sin(i * 0.314) * 1.75 - 0.1,
          t + 0.7,
          0.2,
          0.2,
          0.24,
          i === 3 ? MAT.orange : L,
          { lift: 0.06 }
        )
      )
    p.push(
      box(-1.2, 2.5, 0.5, 2.2, 1.0, 1.5, K),
      box(-1.0, 3.5, 0.7, 1.8, 0.14, 1.1, G),
      lit(-0.8, 3.66, 0.85, 1.4, 0.8, 1.6)
    )
    for (let k = 1; k < 5; k++)
      p.push(
        glow(
          box(-0.8 - k * 0.12, 3.7 + k * 0.6, 0.02, 1.4 + k * 0.24, 0.4, 0.02),
          A,
          0.6
        )
      )
    p.push(
      ...keys(2.0, 0.4, t, 2, 3, 1),
      ...knob(2.6, -1.4, t),
      ...grille(1.6, 2.52, 3, 0.6, 1.0)
    )
    return p
  },
  // WinLab: a radio set. A mast with rings, a tuning dial lit amber.
  winlab() {
    const p = [...body(9.0, 4.4, 2.6)],
      t = 2.96
    p.push(
      frame(-3.9, 2.2, 1.0, 4.0, 1.4),
      lit(-3.9, 2.26, 1.0, 4.0, 1.4, 1.0),
      box(-2.2, 2.3, 0.9, 0.12, 0.03, 1.6, K)
    )
    for (let k = 0; k < 9; k++)
      p.push(box(-3.7 + k * 0.45, 2.3, 1.9, 0.06, 0.03, 0.4, K))
    for (let k = 0; k < 3; k++)
      p.push(box(0.8 + k * 1.2, 2.2, 1.1, 0.8, 0.3, 0.8, L, { lift: 0.05 }))
    p.push(
      cyl(2.6, -0.6, t, 0.6, 0.3, G),
      cyl(2.6, -0.6, t + 0.3, 0.08, 3.6, L)
    )
    for (const [z, r] of [
      [1.0, 1.5],
      [1.9, 1.1],
      [2.7, 0.75],
      [3.4, 0.45],
    ])
      p.push(
        disc(2.6, -0.6, t + z, r, 0.14, z === 1.9 ? MAT.orange : G, {
          lift: 0.08,
        })
      )
    p.push(
      glow(ball(2.6, -0.6, t + 4.1, 0.2), A, 1.6),
      ...keys(-3.6, -1.4, t, 6, 3, 9, 0.56),
      ...knob(0.6, -0.6, t, 0.4)
    )
    return p
  },
  // WinLab Portal: a time clock. A slot for the card, a keypad, the card half way in.
  portal() {
    const p = [...body(6.0, 4.0, 4.2)],
      t = 4.56
    p.push(
      frame(-2.4, 2.0, 2.6, 3.0, 1.2),
      lit(-2.4, 2.06, 2.6, 3.0, 1.2, 1.0),
      box(-1.8, 2.1, 3.0, 0.5, 0.03, 0.5, K),
      box(-1.0, 2.1, 3.0, 0.5, 0.03, 0.5, K),
      box(0.0, 2.1, 3.0, 0.5, 0.03, 0.5, K)
    )
    for (let k = 0; k < 9; k++)
      p.push(
        box(
          -2.3 + (k % 3) * 0.7,
          2.0,
          0.6 + ((k / 3) | 0) * 0.6,
          0.5,
          0.2,
          0.42,
          k === 4 ? MAT.orange : L,
          { lift: 0.05 }
        )
      )
    p.push(
      box(-1.4, -0.4, t, 2.8, 0.5, 0.2, K),
      box(-1.1, -0.26, t + 0.2, 2.2, 0.1, 1.5, MAT.orange, { lift: 0.1 }),
      box(-0.9, -0.14, t + 1.1, 1.2, 0.03, 0.3, K)
    )
    p.push(
      box(1.2, 2.0, 0.8, 1.4, 0.3, 1.6, G, { lift: -0.1 }),
      glow(ball(1.9, 2.36, 1.9, 0.22), A, 1.0),
      cyl(2.2, 1.2, t, 0.3, 0.3, G),
      glow(ball(2.2, 1.2, t + 0.5, 0.2), A, 1.2)
    )
    return p
  },
  // WinLab Video: a tape deck. Two reels on top, the picture on a small screen.
  video() {
    const p = [...body(9.4, 4.6, 2.2)],
      t = 2.56
    for (const [x, hot] of [
      [-2.4, true],
      [2.0, false],
    ]) {
      p.push(
        cyl(x, -0.3, t, 1.7, 0.3, hot ? MAT.orange : L, { lift: 0.04 }),
        cyl(x, -0.3, t + 0.3, 0.5, 0.14, K)
      )
      for (let k = 0; k < 3; k++)
        p.push(
          cyl(
            x + Math.cos(k * 2.094) * 1.0,
            -0.3 + Math.sin(k * 2.094) * 1.0,
            t + 0.3,
            0.3,
            0.04,
            K
          )
        )
    }
    p.push(
      box(-0.6, 1.2, t, 0.8, 0.6, 0.4, G),
      box(-2.4, 1.5, t + 0.1, 4.4, 0.1, 0.06, L)
    )
    p.push(
      frame(-4.2, 2.3, 0.7, 2.6, 1.5),
      lit(-4.2, 2.36, 0.7, 2.6, 1.5, 1.3),
      box(-3.4, 2.4, 1.0, 0.7, 0.03, 0.8, K)
    )
    for (let k = 0; k < 5; k++)
      p.push(
        box(-0.8 + k * 1.0, 2.3, 0.9, 0.7, 0.3, 0.7, k === 1 ? MAT.orange : L, {
          lift: 0.05,
        })
      )
    return p
  },
})
Object.assign(S, {
  // aias: a vending cabinet. Models in rows behind the window, the one in use lit, a tray under them.
  aias() {
    const p = [...body(7.0, 4.0, 4.8)],
      f = 2.0
    p.push(
      frame(-3.0, f, 1.7, 4.2, 2.9),
      box(-3.0, f, 1.7, 4.2, 0.04, 2.9, K, { lift: -0.25 })
    )
    for (let k = 0; k < 12; k++) {
      const x = -2.8 + (k % 4) * 1.0,
        z = 1.9 + ((k / 4) | 0) * 0.92
      p.push(
        k === 6
          ? lit(x, f + 0.06, z, 0.8, 0.7, 1.4)
          : box(x, f + 0.06, z, 0.8, 0.03, 0.7, k % 5 === 0 ? L : G, {
              lift: -0.05,
            })
      )
    }
    p.push(
      box(-3.0, f, 0.6, 4.2, 0.3, 0.7, G, { lift: -0.1 }),
      box(-2.6, f + 0.3, 0.7, 3.4, 0.03, 0.4, K)
    )
    for (let k = 0; k < 6; k++)
      p.push(
        box(
          1.7 + (k % 2) * 0.6,
          f,
          2.6 + ((k / 2) | 0) * 0.6,
          0.44,
          0.2,
          0.44,
          k === 3 ? MAT.orange : L,
          { lift: 0.05 }
        )
      )
    p.push(
      lit(1.7, f + 0.06, 4.5, 1.04, 0.3, 0.8),
      box(1.7, f, 1.0, 1.04, 0.3, 1.0, G, { lift: -0.1 }),
      glow(ball(2.22, f + 0.36, 1.5, 0.18), A, 1.0)
    )
    for (let i = 0; i < 7; i++)
      p.push(box(-2.6 + i * 0.8, -1.4, 5.16, 0.5, 2.4, 0.1, K))
    return p
  },
  // sense: a listening post. A horn for an ear, a lens for an eye, the caption on the front: heard words lit, the draft still grey.
  sense() {
    const p = [...body(9.0, 4.4, 1.8)],
      t = 2.16,
      f = 2.2
    p.push(
      frame(-4.0, f, 0.6, 8.0, 1.2),
      box(-4.0, f, 0.6, 8.0, 0.04, 1.2, K, { lift: -0.25 })
    )
    for (let i = 0; i < 16; i++)
      p.push(
        i < 10
          ? lit(-3.8 + i * 0.48, f + 0.06, 1.25, 0.34, 0.36, 1.3)
          : box(-3.8 + i * 0.48, f + 0.06, 1.25, 0.34, 0.03, 0.36, G)
      )
    for (let i = 0; i < 11; i++)
      p.push(
        box(-3.8 + i * 0.48, f + 0.06, 0.72, 0.34, 0.03, 0.36, G, {
          lift: -0.05,
        })
      )
    p.push(
      cyl(-2.4, -0.3, t, 0.7, 0.3, G),
      cyl(-2.4, -0.3, t + 0.3, 0.2, 0.7, L),
      cone(-2.4, -0.3, t + 1.0, 0.25, 1.7, 1.7, L),
      disc(-2.4, -0.3, t + 2.7, 1.5, 0.2, K)
    )
    p.push(
      cyl(2.2, -0.3, t, 0.7, 0.3, G),
      cyl(2.2, -0.3, t + 0.3, 0.12, 1.2, L),
      ball(2.2, -0.3, t + 2.1, 0.75, K),
      glow(ball(2.2, 0.3, t + 2.1, 0.3), A, 1.6)
    )
    p.push(
      ...knob(0, 1.2, t, 0.36, true),
      ...knob(-0.9, 1.2, t),
      ...knob(0.9, 1.2, t)
    )
    return p
  },
  // quickvm: two screens, one keyboard. The lit screen is the one the keys go to; the cursor has just crossed.
  quickvm() {
    const p = [...body(10.4, 4.8, 1.0)],
      t = 1.36
    for (const [x, on] of [
      [-4.6, false],
      [0.8, true],
    ]) {
      p.push(
        cyl(x + 1.9, -1.2, t, 0.7, 0.2, G),
        cyl(x + 1.9, -1.2, t + 0.2, 0.16, 0.7, L),
        box(x, -1.4, t + 0.9, 3.8, 0.4, 2.7, K),
        frame(x + 0.3, -1.0, t + 1.2, 3.2, 2.1),
        on
          ? lit(x + 0.3, -0.94, t + 1.2, 3.2, 2.1, 1.2)
          : box(x + 0.3, -0.94, t + 1.2, 3.2, 0.03, 2.1, K, { lift: -0.2 })
      )
      if (on) p.push(box(x + 0.5, -0.88, t + 2.2, 0.36, 0.03, 0.5, K))
      else
        for (let k = 0; k < 4; k++)
          p.push(
            box(
              x + 0.6,
              -0.9,
              t + 1.5 + k * 0.42,
              1.2 + ((k * 7) % 3) * 0.5,
              0.03,
              0.16,
              G
            )
          )
    }
    p.push(
      ...keys(-3.0, 0.5, t, 11, 3, 16),
      box(3.2, 0.7, t, 0.8, 1.2, 0.3, L, { lift: 0.08 }),
      box(3.2, 0.7, t + 0.3, 0.8, 0.5, 0.04, MAT.orange),
      ...grille(-4.6, 2.42, 14, 0.4, 0.6)
    )
    return p
  },
  // PerfectSocket: a sender, a receiver and the fragments sent between them. Three are lost; the amber parity ones make up for them.
  perfectsocket() {
    const p = [...body(10.4, 4.8, 1.0)],
      t = 1.36
    for (const x of [-4.8, 3.2])
      p.push(
        box(x, -2.0, t, 1.6, 1.6, 2.0, K),
        box(x - 0.1, -2.1, t + 2.0, 1.8, 1.8, 0.14, G),
        frame(x + 0.3, -0.4, t + 0.9, 1.0, 0.7)
      )
    p.push(
      lit(-4.5, -0.34, t + 0.9, 1.0, 0.7, 0.5),
      lit(3.5, -0.34, t + 0.9, 1.0, 0.7, 1.4),
      box(-4.6, 0.1, t, 9.2, 1.0, 0.1, G)
    )
    for (let i = 0; i < 8; i++) {
      const x = -4.1 + i * 1.08
      p.push(
        [1, 2, 6].includes(i)
          ? box(x, 0.25, t + 0.1, 0.7, 0.7, 0.04, K)
          : i < 4
            ? box(x, 0.25, t + 0.1, 0.7, 0.7, 0.7, L, { lift: 0.08 })
            : glow(box(x, 0.25, t + 0.1, 0.7, 0.7, 0.7), A, 1.1)
      )
    }
    p.push(
      ...knob(-3.9, 1.8, t, 0.34, true),
      ...knob(-3.0, 1.8, t),
      ...keys(1.6, 1.5, t, 5, 1, -1, 0.6),
      ...grille(-4.6, 2.42, 14, 0.4, 0.6)
    )
    return p
  },
  // mmwave-dashboard: a map table. Masts stand on the grid; the links from the busy one are lit.
  "mmwave-dashboard"() {
    const p = [...body(9.6, 6.0, 1.2)],
      t = 1.56
    p.push(box(-4.3, -2.5, t, 8.6, 5.0, 0.12, G))
    for (let i = 1; i < 8; i++)
      p.push(box(-4.3 + i * 1.075, -2.5, t + 0.12, 0.05, 5.0, 0.02, K))
    for (let j = 1; j < 5; j++)
      p.push(box(-4.3, -2.5 + j, t + 0.12, 8.6, 0.05, 0.02, K))
    const nodes = [
      [-3.0, -1.4, 1.6],
      [-0.6, -0.2, 2.2],
      [2.4, -1.5, 1.8],
      [1.6, 1.4, 1.4],
      [-2.6, 1.5, 1.2],
    ]
    nodes.forEach(([x, y, h], i) =>
      p.push(
        cyl(x, y, t + 0.12, 0.3, 0.14, K),
        cyl(x, y, t + 0.26, 0.07, h, L),
        glow(ball(x, y, t + 0.4 + h, 0.2), A, i === 1 ? 1.8 : 0.8)
      )
    )
    const [ax, ay] = nodes[1]
    for (const k of [0, 2, 3])
      for (let s = 1; s < 6; s++)
        p.push(
          glow(
            box(
              ax + ((nodes[k][0] - ax) * s) / 6 - 0.08,
              ay + ((nodes[k][1] - ay) * s) / 6 - 0.08,
              t + 0.12,
              0.16,
              0.16,
              0.04
            ),
            A,
            0.9
          )
        )
    p.push(...grille(-4.3, 3.02, 13, 0.4, 0.8))
    return p
  },
  // openwifi-afc: a radio that asks first. A band of channels on the display, only the allowed ones lit; the bare board and its antennas on top.
  "openwifi-afc"() {
    const p = [...body(9.0, 4.4, 2.6)],
      t = 2.96,
      f = 2.2
    p.push(
      frame(-4.0, f, 0.9, 5.6, 1.6),
      box(-4.0, f, 0.9, 5.6, 0.04, 1.6, K, { lift: -0.25 })
    )
    for (let i = 0; i < 12; i++)
      p.push(
        i >= 5 && i <= 7
          ? lit(-3.85 + i * 0.45, f + 0.06, 1.05, 0.32, 1.3, 1.3)
          : box(
              -3.85 + i * 0.45,
              f + 0.06,
              1.05,
              0.32,
              0.03,
              0.3 + ((i * 5) % 4) * 0.2,
              G
            )
      )
    for (let k = 0; k < 2; k++)
      p.push(
        box(2.2 + k, f, 1.0, 0.7, 0.3, 0.7, k ? MAT.orange : L, { lift: 0.05 })
      )
    p.push(
      lit(2.2, f + 0.06, 2.1, 1.7, 0.3, 0.7),
      box(-3.6, -1.6, t, 5.0, 3.0, 0.12, G),
      box(-2.9, -1.0, t + 0.12, 1.4, 1.4, 0.3, K),
      box(-0.8, -1.1, t + 0.12, 0.8, 0.8, 0.2, K),
      box(-0.8, 0.2, t + 0.12, 1.6, 0.6, 0.24, L)
    )
    for (const x of [2.4, 3.4])
      p.push(
        cyl(x, -0.8, t, 0.3, 0.24, G),
        cyl(x, -0.8, t + 0.24, 0.07, 2.6, L),
        glow(ball(x, -0.8, t + 3.0, 0.16), A, x > 3 ? 1.4 : 0.3)
      )
    p.push(...knob(2.9, 1.0, t, 0.36))
    return p
  },
  // jenkins-terminal: a teletype. A keyboard, a sheet of build lines, the newest one lit, one key to build.
  "jenkins-terminal"() {
    const p = [...body(8.8, 5.2, 1.4)],
      t = 1.76
    p.push(
      box(-4.0, -2.4, t, 8.0, 1.9, 1.5, K),
      box(-4.1, -2.5, t + 1.5, 8.2, 2.1, 0.14, G),
      box(-2.7, -1.5, t + 1.64, 5.4, 0.08, 2.6, L, { lift: 0.1 })
    )
    for (let k = 0; k < 6; k++)
      p.push(
        k === 0
          ? lit(-2.4, -1.4, t + 1.9, 2.2, 0.2, 1.4)
          : box(
              -2.4,
              -1.4,
              t + 1.9 + k * 0.38,
              1.6 + ((k * 7) % 4) * 0.7,
              0.03,
              0.16,
              K
            )
      )
    p.push(
      ...keys(-3.8, 0.1, t, 12, 4, -1, 0.52),
      box(2.7, 0.3, t, 1.0, 1.0, 0.2, G),
      cyl(3.2, 0.8, t + 0.2, 0.36, 0.3, MAT.orange, { lift: 0.08 }),
      ...grille(-4.0, 2.62, 12, 0.5, 0.8)
    )
    return p
  },
})
for (const [name, build] of Object.entries(S)) {
  if (only && only !== name) continue
  const prims = build()
  render(
    [
      box(-30, -30, -1, 60, 60, 1, MAT.dark, { floor: true, lift: -0.16 }),
      ...prims,
    ],
    `${out}/${name}.png`,
    {
      ground: 8.2,
      oy: 222,
      scale: 27,
      mono: true,
      cap: 6,
      stars: false,
      sprites: prims.sprites ?? [],
    }
  )
}
