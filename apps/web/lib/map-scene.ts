import { lanes, systems, type System } from "./map"

/*
 * The map is one scene in characters: the systems stand over a plane, each
 * star on a stalk as tall as its height, and the camera looks down at an
 * angle and turns around the middle. Flying to a system moves the middle to
 * its star and zooms in, until its bodies and their orbits fill the grid.
 * Every frame is drawn here as two layers of text on one grid, muted and
 * lit (components/star-map.tsx lays one over the other).
 */

export type View = {
  /** The turn around the vertical axis, in radians. */
  yaw: number
  /** How far down the camera looks: 0 from the side, a quarter turn from above. */
  pitch: number
  /** The system flown to, or the last one while flying back out. */
  target: System | null
  /** 0 on the whole map, 1 at the target. */
  focus: number
  /** Seconds the bodies have been in orbit. */
  time: number
  /** The slug under the pointer. */
  hover?: string
  /** Bodies carry their names; without, their number in the list. */
  names: boolean
}

/** A run of cells that answers a click. */
export type Hit = {
  col: number
  row: number
  width: number
  system: string
  body?: string
}

/** Han characters and full width forms take two cells. */
const WIDE = /[⺀-鿿豈-﫿＀-｠]/

export function cellsOf(text: string) {
  let width = 0
  for (const char of text) width += WIDE.test(char) ? 2 : 1
  return width
}

class Grid {
  /** One glyph per cell; the second cell of a wide glyph is "". */
  private glyphs: string[]
  private lit: Uint8Array

  constructor(
    readonly cols: number,
    readonly rows: number
  ) {
    this.glyphs = new Array<string>(cols * rows).fill(" ")
    this.lit = new Uint8Array(cols * rows)
  }

  /** Empties a cell, and the other half of a wide glyph it cuts. */
  private clear(index: number) {
    const glyph = this.glyphs[index]!
    if (glyph === "") this.glyphs[index - 1] = " "
    else if (WIDE.test(glyph)) this.glyphs[index + 1] = " "
    this.glyphs[index] = " "
  }

  put(col: number, row: number, text: string, lit = false) {
    col = Math.round(col)
    row = Math.round(row)
    if (row < 0 || row >= this.rows) return
    for (const char of text) {
      const width = WIDE.test(char) ? 2 : 1
      if (col >= 0 && col + width <= this.cols) {
        const index = row * this.cols + col
        for (let cell = 0; cell < width; cell++) this.clear(index + cell)
        this.glyphs[index] = char
        this.lit[index] = lit ? 1 : 0
        if (width === 2) this.glyphs[index + 1] = ""
      }
      col += width
    }
  }

  /** The two layers: each holds its own glyphs and spaces for the other's. */
  layers() {
    const muted: string[] = []
    const lit: string[] = []
    for (let row = 0; row < this.rows; row++) {
      let low = ""
      let high = ""
      for (let col = 0; col < this.cols; col++) {
        const index = row * this.cols + col
        const glyph = this.glyphs[index]!
        if (glyph === "") continue
        const blank = WIDE.test(glyph) ? "  " : " "
        low += this.lit[index] ? blank : glyph
        high += this.lit[index] ? glyph : blank
      }
      muted.push(low)
      lit.push(high)
    }
    return { muted: muted.join("\n"), lit: lit.join("\n") }
  }
}

/** A small seeded generator, so the far stars are the same on every frame. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FAR = (() => {
  const next = random(7)
  return Array.from({ length: 90 }, () => ({
    u: next(),
    v: next(),
    glyph: ".'.+"[Math.floor(next() * 4)]!,
  }))
})()

/** A system's place in the world: x and y from -1 to 1, then its height. */
function place({ at: [x, y, z] }: System) {
  return { x: x * 2 - 1, y: y * 2 - 1, h: z * 0.8 }
}

/** A body's distance from its star and its angle at `time`. */
function orbit(index: number, time: number) {
  return {
    radius: 0.07 + 0.04 * index,
    angle: index * 2.4 + (time * 0.1) / (1 + index * 0.4),
  }
}

/** How close to a system the bodies become planets with names. */
const NEAR = 0.4
const NAMED = 0.75

export function drawScene(view: View, cols: number, rows: number) {
  const grid = new Grid(cols, rows)
  const hits: Hit[] = []
  const { yaw, pitch, focus, target, time } = view
  const cos = Math.cos(yaw)
  const sin = Math.sin(yaw)
  const zoom = 1 + 2 * focus
  const sx = cols * 0.36 * zoom
  const sy = rows * 0.3 * zoom
  const middle = target ? place(target) : { x: 0, y: 0, h: 0 }

  const project = (x: number, y: number, h: number) => {
    const dx = x - middle.x * focus
    const dy = y - middle.y * focus
    const depth = dx * sin + dy * cos
    return {
      col: cols / 2 + (dx * cos - dy * sin) * sx,
      row:
        rows / 2 +
        (depth * Math.sin(pitch) - (h - middle.h * focus) * Math.cos(pitch)) *
          sy,
      depth,
    }
  }

  // The far stars slide a little as the camera turns.
  for (const { u, v, glyph } of FAR) {
    const col = (((u * cols + yaw * 6) % cols) + cols) % cols
    grid.put(Math.floor(col), Math.floor(v * rows), glyph)
  }

  // Two rings on the plane.
  for (const radius of [0.55, 1.1]) {
    for (let degree = 0; degree < 360; degree += 4) {
      const angle = (degree * Math.PI) / 180
      const { col, row } = project(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      )
      grid.put(col, row, ".")
    }
  }

  // Each star's stalk down to the plane.
  for (const system of systems) {
    const { x, y, h } = place(system)
    const top = project(x, y, h)
    const base = project(x, y, 0)
    for (let row = Math.round(top.row) + 1; row < Math.round(base.row); row++) {
      grid.put(top.col, row, "|")
    }
    grid.put(base.col, base.row, "+")
  }

  for (const [from, to] of lanes) {
    const a = place(systems.find(({ slug }) => slug === from)!)
    const b = place(systems.find(({ slug }) => slug === to)!)
    const start = project(a.x, a.y, a.h)
    const end = project(b.x, b.y, b.h)
    // A row is 2.5 cells tall, so a step of two cells reads as even dots.
    const steps = Math.round(
      Math.hypot(end.col - start.col, (end.row - start.row) * 2.5) / 2
    )
    for (let step = 1; step < steps; step++) {
      const t = step / steps
      grid.put(
        start.col + (end.col - start.col) * t,
        start.row + (end.row - start.row) * t,
        "."
      )
    }
  }

  // Far systems first, so a near one is drawn over them.
  const ordered = systems
    .map((system) => {
      const at = place(system)
      return { system, at, star: project(at.x, at.y, at.h) }
    })
    .sort((a, b) => a.star.depth - b.star.depth)

  for (const { system, at, star } of ordered) {
    const here = system === target && focus > NEAR

    if (here) {
      system.bodies.forEach((_, index) => {
        const { radius } = orbit(index, time)
        for (let degree = 0; degree < 360; degree += 5) {
          const angle = (degree * Math.PI) / 180
          const { col, row } = project(
            at.x + Math.cos(angle) * radius,
            at.y + Math.sin(angle) * radius,
            at.h
          )
          grid.put(col, row, ".")
        }
      })
    }

    system.bodies.forEach((body, index) => {
      const { radius, angle } = orbit(index, time)
      const { col, row } = project(
        at.x + Math.cos(angle) * radius,
        at.y + Math.sin(angle) * radius,
        at.h
      )
      if (!here) return grid.put(col, row, ".")
      const glyph = body.kind === "station" ? "#" : "o"
      if (focus < NAMED) return grid.put(col, row, glyph)
      const label = view.names ? body.name : String(index + 1)
      const lit = Boolean(body.href) || view.hover === body.slug
      const width = cellsOf(label) + 2
      // The name goes on the side away from the star.
      const left =
        col >= star.col ? Math.round(col) : Math.round(col) - width + 1
      grid.put(left - 1, row, " ".repeat(width + 2))
      grid.put(
        left,
        row,
        col >= star.col ? `${glyph} ${label}` : `${label} ${glyph}`,
        lit
      )
      hits.push({
        col: left,
        row: Math.round(row),
        width,
        system: system.slug,
        body: body.slug,
      })
    })

    if (here) {
      grid.put(star.col - 1, star.row, "(*)", true)
      continue
    }
    const hover = view.hover === system.slug
    const label = hover ? `*[${system.name}]` : `* ${system.name} `
    const width = cellsOf(label)
    grid.put(star.col - 1, star.row, " ".repeat(width + 1))
    // Away from the target, the other systems step back.
    grid.put(star.col, star.row, label, hover || focus < NEAR)
    hits.push({
      col: Math.round(star.col),
      row: Math.round(star.row),
      width,
      system: system.slug,
    })
  }

  return { ...grid.layers(), hits }
}
