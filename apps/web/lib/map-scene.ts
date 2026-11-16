import { around, type Depth, lanes, shows, systems, type System } from "./map"

/*
 * The map is one scene in wireframe: the systems stand over a plane, each
 * star on a stalk as tall as its height, and the camera looks down at an
 * angle and turns around the middle. Flying to a system moves the middle to
 * its star and zooms in, until its sun and its planets fill
 * the view. A frame is a list of lines, dots and labels in CSS pixels;
 * components/star-map.tsx paints the lines as square pixels and the labels
 * as text.
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
  /**
   * Where the camera looks at full focus, and the widest orbit it fits
   * there. They follow the target (aim), so a flight from one system to
   * another slides instead of cutting.
   */
  center: Aim
  /** Seconds the bodies have been in orbit. */
  time: number
  /** How deep the map shows: a body past it is left out (lib/map.ts). */
  depth: Depth
  /** The slug under the pointer. */
  hover?: string
  /** The body picked by a click, which keeps its frame. */
  pinned?: string
}

export type Line = {
  x0: number
  y0: number
  x1: number
  y1: number
  lit?: boolean
  /** The system whose color it takes (lib/map-palette.ts); gray without. */
  hue?: string
  /** Paint one pixel in this many: 1 is a solid line. */
  every?: number
}
export type Dot = {
  x: number
  y: number
  size: number
  lit?: boolean
  hue?: string
}
export type Label = {
  x: number
  y: number
  /** The width of its text, for the plate drawn behind it. */
  width: number
  text: string
  lit?: boolean
  hue?: string
  /** Pointed at: the plate takes the color and the text the page's. */
  inverse?: boolean
}

/** A box that answers a click. */
export type Hit = {
  x: number
  y: number
  width: number
  height: number
  system: string
  body?: string
}

/** A system's place in the world: x and y from -1 to 1, then its height. */
function place({ at: [x, y, z] }: System) {
  return { x: x * 2 - 1, y: y * 2 - 1, h: z * 0.8 }
}

export type Aim = { x: number; y: number; h: number; outer: number }

/** Where the camera looks to show `system`, and its widest orbit. */
export function aim(system: System): Aim {
  return {
    ...place(system),
    outer: orbit(system.bodies.length - 1, 0).radius,
  }
}

/** A body's distance from its star, and its angle at `time`. */
function orbit(index: number, time: number) {
  return {
    radius: 0.12 + 0.035 * index,
    angle: index * 2.4 + (time * 0.08) / (1 + index * 0.4),
  }
}

/** How close to a system its bodies take their shapes, then their names. */
const NEAR = 0.4
const NAMED = 0.75
const ROW = 24

export function drawScene(
  view: View,
  width: number,
  height: number,
  /** The width of a label's text, in pixels. */
  measure: (text: string) => number
) {
  const lines: Line[] = []
  const dots: Dot[] = []
  const labels: Label[] = []
  const hits: Hit[] = []
  // The system whose color the shapes being drawn take.
  let ink: string | undefined
  const { yaw, pitch, focus, target, time } = view
  const cos = Math.cos(yaw)
  const sin = Math.sin(yaw)
  const tilt = Math.sin(pitch)
  const rise = Math.cos(pitch)

  // The whole map fits the view; at a system its widest orbit does.
  const wide = Math.min(width * 0.38, height * 0.6)
  const tall = Math.min(height * 0.36, wide)
  const middle = view.center
  const close = Math.min(width * 0.32, height * 0.4) / middle.outer
  const sx = wide + (close - wide) * focus
  const sy = sx * (tall / wide)

  const project = (x: number, y: number, h: number) => {
    const dx = x - middle.x * focus
    const dy = y - middle.y * focus
    const depth = dx * sin + dy * cos
    return {
      x: width / 2 + (dx * cos - dy * sin) * sx,
      y: height * 0.46 + (depth * tilt - (h - middle.h * focus) * rise) * sy,
      depth,
    }
  }

  /** A circle on the plane at height `h`, as the camera sees it. */
  const ring = (
    x: number,
    y: number,
    h: number,
    radius: number,
    every: number
  ) => {
    let from = project(x + radius, y, h)
    for (let step = 1; step <= 48; step++) {
      const angle = (step / 48) * Math.PI * 2
      const to = project(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius,
        h
      )
      lines.push({ x0: from.x, y0: from.y, x1: to.x, y1: to.y, every })
      from = to
    }
  }

  /** An ellipse flat on the screen. */
  const ellipse = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    lit: boolean
  ) => {
    const steps = rx > 12 ? 32 : 16
    for (let step = 0; step < steps; step++) {
      const a = (step / steps) * Math.PI * 2
      const b = ((step + 1) / steps) * Math.PI * 2
      lines.push({
        x0: cx + Math.cos(a) * rx,
        y0: cy + Math.sin(a) * ry,
        x1: cx + Math.cos(b) * rx,
        y1: cy + Math.sin(b) * ry,
        lit,
        hue: ink,
      })
    }
  }

  /** A globe in wireframe: its outline, and for a sun its equator and one turning meridian. */
  const globe = (
    cx: number,
    cy: number,
    radius: number,
    lit: boolean,
    spin: number
  ) => {
    ellipse(cx, cy, radius, radius, lit)
    if (radius <= 12) return
    ellipse(cx, cy, radius, radius * tilt, lit)
    ellipse(cx, cy, radius * Math.abs(Math.cos(spin)), radius, lit)
  }

  // Where the target's bodies put their names: other names give way.
  const taken: { x: number; y: number; width: number }[] = []
  const later: (() => void)[] = []

  /**
   * A label beside (x, y), on the right unless it would leave the view. One
   * that `yields` moves to the other side of a taken place, or is left out.
   */
  const name = (
    x: number,
    y: number,
    gap: number,
    text: string,
    lit: boolean,
    hit: Pick<Hit, "system" | "body">,
    hover: boolean,
    yields = false
  ) => {
    const w = measure(text)
    const right = x + gap + w <= width - 4 || x - gap - w < 4
    const free = (at: number) =>
      at >= 4 &&
      at + w <= width - 4 &&
      !taken.some(
        (box) =>
          at < box.x + box.width + 8 &&
          at + w + 8 > box.x &&
          Math.abs(y - box.y) < ROW
      )
    let left = right ? x + gap : x - gap - w
    if (yields && !free(left)) {
      const other = right ? x - gap - w : x + gap
      if (!free(other)) {
        // No room for the name: the star alone still answers a click.
        hits.push({ x: x - 14, y: y - 14, width: 28, height: 28, ...hit })
        return
      }
      left = other
    }
    if (!yields) taken.push({ x: left, y, width: w })
    labels.push({
      x: left,
      y,
      width: w,
      text,
      lit: lit || hover,
      hue: ink,
      inverse: hover,
    })
    const box = {
      x: Math.min(left, x - gap) - 4,
      y: y - ROW / 2 - 2,
      width: w + gap * 2 + 8,
      height: ROW + 4,
    }
    hits.push({ ...box, ...hit })
  }

  // Two rings on the plane.
  ring(0, 0, 0, 0.55, 4)
  ring(0, 0, 0, 1.1, 4)

  for (const [from, to] of lanes) {
    const a = place(systems.find(({ slug }) => slug === from)!)
    const b = place(systems.find(({ slug }) => slug === to)!)
    const start = project(a.x, a.y, a.h)
    const end = project(b.x, b.y, b.h)
    lines.push({ x0: start.x, y0: start.y, x1: end.x, y1: end.y, every: 3 })
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
    const base = project(at.x, at.y, 0)

    // The stalk down to the plane, and its foot.
    lines.push({ x0: star.x, y0: star.y, x1: base.x, y1: base.y, every: 2 })
    lines.push({ x0: base.x - 4, y0: base.y, x1: base.x + 4, y1: base.y })

    // Where each body of the target is drawn, for the links between them.
    const spots = new Map<string, { x: number; y: number }>()
    system.bodies.forEach((body, index) => {
      // A body keeps its orbit whatever the depth, so none jumps as the
      // depth changes.
      if (!shows(body, view.depth)) return
      const { radius, angle } = orbit(index, time)
      if (here) ring(at.x, at.y, at.h, radius, 3)
      const { x, y } = project(
        at.x + Math.cos(angle) * radius,
        at.y + Math.sin(angle) * radius,
        at.h
      )
      if (!here) return dots.push({ x, y, size: 2 })
      spots.set(body.slug, { x, y })
      const hover = view.hover === body.slug || view.pinned === body.slug
      const lit = Boolean(body.href) || hover
      // A written note takes its system's color, and grows a little with
      // its length: 5 px more at 1,000 characters and beyond.
      ink = body.href ? system.slug : undefined
      const size = 7 + Math.min(5, (body.length ?? 0) / 200)
      globe(x, y, size, lit, 0)
      if (focus >= NAMED)
        name(
          x,
          y,
          size + 7,
          body.short,
          lit,
          { system: system.slug, body: body.slug },
          hover
        )
      ink = undefined
    })

    // The body pointed at shows its links inside the system: solid to a
    // note to read first, dashed to one a level down or up, dotted to the
    // rest. A link to another system is on the instruments only.
    const from = spots.get(view.hover ?? view.pinned ?? "")
    const held = system.bodies.find(
      ({ slug }) => slug === (view.hover ?? view.pinned)
    )
    if (from && held) {
      const links = around(held)
      const groups = [
        [links.requires, 1],
        [[...links.deeper, ...links.uses], 2],
        [links.related, 4],
      ] as const
      for (const [group, every] of groups)
        for (const { slug } of group) {
          const to = spots.get(slug)
          if (!to) continue
          lines.push({
            x0: from.x,
            y0: from.y,
            x1: to.x,
            y1: to.y,
            lit: true,
            hue: system.slug,
            every,
          })
        }
    }

    ink = system.slug
    if (here) {
      globe(star.x, star.y, 10 + 18 * focus, true, time * 0.15)
      ink = undefined
      continue
    }
    const hover = view.hover === system.slug
    // Away from the target, the other systems step back.
    const lit = hover || focus < NEAR
    dots.push({ x: star.x, y: star.y, size: 6, lit, hue: ink })
    lines.push({
      x0: star.x - 8,
      y0: star.y,
      x1: star.x + 8,
      y1: star.y,
      lit,
      hue: ink,
    })
    lines.push({
      x0: star.x,
      y0: star.y - 8,
      x1: star.x,
      y1: star.y + 8,
      lit,
      hue: ink,
    })
    // After every body has its name, so this one can give way to them.
    const hue = ink
    later.push(() => {
      ink = hue
      name(
        star.x,
        star.y,
        16,
        system.name,
        lit,
        { system: system.slug },
        hover,
        true
      )
      ink = undefined
    })
    ink = undefined
  }
  for (const draw of later) draw()

  return { lines, dots, labels, hits }
}
