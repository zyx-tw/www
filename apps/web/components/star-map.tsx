"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"
import { enterRow, page } from "@workspace/ui/lib/layout"

import { MAP } from "@/lib/copy"
import {
  findBody,
  findSystem,
  shows,
  systemPath,
  systems,
  type Body,
  type Depth,
} from "@/lib/map"
import { HUES } from "@/lib/map-palette"
import { aim, drawScene, type Hit, type Line, type View } from "@/lib/map-scene"
import { DRIFT, sky } from "@workspace/ui/lib/sky"
import { useReducedMotion } from "@workspace/ui/hooks/use-reduced-motion"

/** CSS pixels to one pixel of the wireframe. */
const PIXEL = 2

type Scene = View & {
  /** Where `focus` is heading: 1 at a system, 0 on the whole map. */
  goal: number
  hits: Hit[]
  /** The pointer is over something, so nothing drifts from under it. */
  held: boolean
  drag: { x: number; y: number; moved: boolean } | null
}

/** A line as square pixels, one in `every`. */
function plot(
  context: CanvasRenderingContext2D,
  { x0, y0, x1, y1, every = 1 }: Line
) {
  let x = Math.round(x0 / PIXEL)
  let y = Math.round(y0 / PIXEL)
  const endX = Math.round(x1 / PIXEL)
  const endY = Math.round(y1 / PIXEL)
  const dx = Math.abs(endX - x)
  const dy = -Math.abs(endY - y)
  // A line far outside the view is not worth walking.
  if (dx - dy > 4000) return
  const stepX = x < endX ? 1 : -1
  const stepY = y < endY ? 1 : -1
  let error = dx + dy
  for (let count = 0; ; count++) {
    if (count % every === 0) context.fillRect(x, y, 1, 1)
    if (x === endX && y === endY) break
    const twice = 2 * error
    if (twice >= dy) {
      error += dy
      x += stepX
    }
    if (twice <= dx) {
      error += dx
      y += stepY
    }
  }
}

/** Where the reader's depth is kept from one visit to the next. */
const DEPTH_KEY = "map-depth"
const DEPTHS: Depth[] = [1, 2, 3]

/** How many notes of `bodies` show at `depth`. */
function count(bodies: Body[], depth: Depth) {
  return [`${MAP.notes} ${bodies.filter((body) => shows(body, depth)).length}`]
}

/** What is known about a body: its state or its measures. */
function facts(body: Body, after: string[]) {
  return [
    `${MAP.kinds[body.kind]} L${body.level}`,
    !body.href && MAP.planned,
    body.length && `${body.length.toLocaleString("en")} ${MAP.length}`,
    body.minutes && `${body.minutes} ${MAP.minutes}`,
    body.version && `v${body.version}`,
    body.updated && `${MAP.updated} ${body.updated}`,
    after.length > 0 && `${MAP.after} ${after.join("、")}`,
  ].filter((fact): fact is string => Boolean(fact))
}

/**
 * The map (lib/map-scene.ts) fills the screen under the corners, as the
 * display of a ship: the wireframe on a canvas of square pixels, the names
 * on a sharp one over it, and the
 * instruments at its foot: what the thing pointed at is, and what is known
 * about it. A drag turns the view. Pointing at a system or a body puts it on
 * the instruments; a click on a system flies there
 * (/map/<system>), a click on a body keeps it on the instruments, and a
 * click on empty space lets go of it, then flies back out. It lives in the
 * layout, so it keeps its turn from one page of the map to the next.
 * Decorative for a screen reader: the layout holds the same links as lists.
 */
export function StarMap() {
  const pathname = usePathname()
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const target = findSystem(pathname.split("/")[2] ?? "") ?? null
  const [hover, setHover] = useState<string>()
  const [picked, setPinned] = useState<string>()
  const [depth, setDepth] = useState<Depth>(1)
  // A body stays picked only while its own system is the one flown to.
  const pinned =
    picked && findBody(picked)?.system === target ? picked : undefined

  const box = useRef<HTMLDivElement>(null)
  const wire = useRef<HTMLCanvasElement>(null)
  const names = useRef<HTMLCanvasElement>(null)
  const scene = useRef<Scene>({
    yaw: 0.5,
    pitch: 0.95,
    target: null,
    focus: 0,
    center: { x: 0, y: 0, h: 0, outer: 1 },
    goal: 0,
    time: 0,
    depth: 1,
    hits: [],
    held: false,
    drag: null,
  })
  const still = useRef(reducedMotion)

  // What the instruments show: the thing pointed at, else the body picked,
  // else the system flown to.
  const subject = hover ?? pinned ?? target?.slug

  useEffect(() => {
    still.current = reducedMotion
  }, [reducedMotion])

  useEffect(() => {
    scene.current.pinned = pinned
  }, [pinned])

  // The depth a reader chose stays with their browser. Storage can be
  // blocked, and the map works without it.
  useEffect(() => {
    try {
      const kept = Number(localStorage.getItem(DEPTH_KEY))
      if (kept === 2 || kept === 3) setDepth(kept)
    } catch {}
  }, [])

  useEffect(() => {
    scene.current.depth = depth
  }, [depth])

  const dive = (to: Depth) => {
    setDepth(to)
    try {
      localStorage.setItem(DEPTH_KEY, String(to))
    } catch {}
  }

  useEffect(() => {
    const state = scene.current
    state.goal = target ? 1 : 0
    if (!target) return
    // From the whole map the camera starts on the system; from another
    // system it slides over (the frame loop moves `center`).
    if (!state.target || still.current) state.center = aim(target)
    state.target = target
  }, [target])

  useEffect(() => {
    const state = scene.current
    const element = box.current
    const low = wire.current?.getContext("2d")
    const high = names.current?.getContext("2d")
    if (!element || !low || !high) return

    // The map takes the sky's turn as it opens, and gives it back as it
    // closes, so the stars do not jump.
    state.yaw = sky.yaw
    sky.mapped = true

    let width = 0
    let height = 0
    let ratio = 1
    const measure = () => {
      width = element.clientWidth
      height = element.clientHeight
      ratio = window.devicePixelRatio || 1
      low.canvas.width = Math.ceil(width / PIXEL)
      low.canvas.height = Math.ceil(height / PIXEL)
      high.canvas.width = Math.ceil(width * ratio)
      high.canvas.height = Math.ceil(height * ratio)
    }
    const resize = new ResizeObserver(measure)
    resize.observe(element)
    measure()
    let frame = 0
    let last = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min((now - last) / 1000, 0.1)
      // 30 frames a second is plenty for a quiet map.
      if (dt < 1 / 32 || document.hidden || !width) return
      last = now
      const drift = !still.current && !state.held && !state.drag
      if (drift) {
        state.yaw += dt * DRIFT
        state.time += dt
      }
      // The far stars are the layout's (components/star-field.tsx): they
      // turn with the map.
      sky.yaw = state.yaw
      state.focus = still.current
        ? state.goal
        : state.focus + (state.goal - state.focus) * Math.min(1, dt * 4)
      if (Math.abs(state.goal - state.focus) < 0.002) state.focus = state.goal
      if (state.focus === 0) state.target = null
      if (state.target) {
        const to = aim(state.target)
        const step = Math.min(1, dt * 4)
        for (const key of ["x", "y", "h", "outer"] as const) {
          const left = to[key] - state.center[key]
          state.center[key] =
            Math.abs(left) < 0.0005 ? to[key] : state.center[key] + left * step
        }
      }

      // Gray comes from the tokens, so a theme change needs no code.
      const dim = getComputedStyle(low.canvas).color
      const bright = getComputedStyle(high.canvas).color
      // A system's own color where the scene names one, else gray.
      const ink = ({ hue, lit }: { hue?: string; lit?: boolean }) => {
        const own = hue ? HUES[hue] : undefined
        return lit ? (own?.bright ?? bright) : (own?.dim ?? dim)
      }
      const style = getComputedStyle(high.canvas)
      high.setTransform(ratio, 0, 0, ratio, 0, 0)
      high.font = ["font-weight", "font-size", "font-family"]
        .map((property) => style.getPropertyValue(property))
        .join(" ")
      high.textBaseline = "middle"
      const drawn = drawScene(
        state,
        width,
        height,
        (text) => high.measureText(text).width
      )
      state.hits = drawn.hits

      low.clearRect(0, 0, low.canvas.width, low.canvas.height)
      for (const tone of [false, true]) {
        for (const line of drawn.lines) {
          if (Boolean(line.lit) !== tone) continue
          low.fillStyle = ink(line)
          plot(low, line)
        }
        for (const dot of drawn.dots) {
          if (Boolean(dot.lit) !== tone) continue
          low.fillStyle = ink(dot)
          const size = Math.max(1, Math.round(dot.size / PIXEL))
          low.fillRect(
            Math.round(dot.x / PIXEL - size / 2),
            Math.round(dot.y / PIXEL - size / 2),
            size,
            size
          )
        }
      }
      // Each name sits on a plate of the page's color, so the lines that
      // pass behind it do not run through its strokes.
      const plate = getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim()
      high.clearRect(0, 0, width, height)
      for (const label of drawn.labels) {
        high.fillStyle = plate
        high.fillRect(label.x - 4, label.y - 11, label.width + 8, 22)
        if (!label.inverse) continue
        // Pointed at: a wash of its own color over the plate.
        high.globalAlpha = 0.2
        high.fillStyle = ink({ ...label, lit: true })
        high.fillRect(label.x - 4, label.y - 11, label.width + 8, 22)
        high.globalAlpha = 1
      }
      for (const label of drawn.labels) {
        high.fillStyle = ink(label)
        high.fillText(label.text, label.x, label.y)
      }
    }
    frame = requestAnimationFrame(tick)
    // Text on a canvas cannot start a webfont load; the next frame after
    // the face is in draws with it. The load rejects when a fallback face
    // is missing, and the face is in all the same.
    document.fonts
      ?.load("16px " + getComputedStyle(element).fontFamily)
      .catch(() => undefined)
    return () => {
      sky.mapped = false
      cancelAnimationFrame(frame)
      resize.disconnect()
    }
  }, [])

  /** The box under the pointer; the last one drawn is the nearest. */
  const hitAt = (event: React.PointerEvent) => {
    const rect = box.current?.getBoundingClientRect()
    if (!rect) return
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return [...scene.current.hits]
      .reverse()
      .find(
        (hit) =>
          x >= hit.x &&
          x <= hit.x + hit.width &&
          y >= hit.y &&
          y <= hit.y + hit.height
      )
  }

  const point = (hit: Hit | undefined) => {
    const slug = hit?.body ?? hit?.system
    scene.current.hover = slug
    scene.current.held = Boolean(hit)
    setHover(slug)
  }

  const open = (hit: Hit | undefined) => {
    if (hit?.body) {
      const href = findBody(hit.body)?.body.href
      return href ? router.push(href) : setPinned(hit.body)
    }
    if (hit) return router.push(systemPath({ slug: hit.system }))
    if (pinned) return setPinned(undefined)
    if (scene.current.goal) router.push("/map")
  }

  const system = subject ? findSystem(subject) : undefined
  const found = subject ? findBody(subject) : undefined
  const after = (found?.body.requires ?? [])
    .map((slug) => findBody(slug)?.body.short)
    .filter((name) => name !== undefined)

  return (
    <>
      <div
        ref={box}
        aria-hidden
        data-over={hover ? "" : undefined}
        className="absolute inset-0 cursor-grab touch-none select-none data-dragging:cursor-grabbing data-over:cursor-pointer"
        onPointerLeave={() => point(undefined)}
        onPointerDown={(event) => {
          scene.current.drag = {
            x: event.clientX,
            y: event.clientY,
            moved: false,
          }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          const state = scene.current
          const drag = state.drag
          if (!drag) return point(hitAt(event))
          const dx = event.clientX - drag.x
          const dy = event.clientY - drag.y
          if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 5) return
          drag.moved = true
          drag.x = event.clientX
          drag.y = event.clientY
          event.currentTarget.setAttribute("data-dragging", "")
          state.yaw -= dx * 0.008
          state.pitch = Math.min(1.35, Math.max(0.45, state.pitch + dy * 0.005))
        }}
        onPointerUp={(event) => {
          const drag = scene.current.drag
          scene.current.drag = null
          event.currentTarget.removeAttribute("data-dragging")
          if (drag && !drag.moved) open(hitAt(event))
          // A finger leaves nothing pointed at.
          if (event.pointerType !== "mouse") point(undefined)
        }}
        onPointerCancel={(event) => {
          scene.current.drag = null
          event.currentTarget.removeAttribute("data-dragging")
        }}
      >
        <canvas
          ref={wire}
          className="pixelated absolute inset-0 size-full text-muted-foreground"
        />
        <canvas
          ref={names}
          className="absolute inset-0 size-full text-foreground"
        />
      </div>
      {/* The trail in the top left corner already names the page, so the
          heading is for a screen reader only. The page's decoder swaps text
          nodes for its own, so text that changes is a new element. */}
      <h1 key={`title ${target?.slug ?? ""}`} className="sr-only">
        {target?.name ?? MAP.title}
      </h1>
      <div
        className={cn(
          page,
          "pointer-events-none relative flex flex-1 flex-col justify-end gap-3 px-(--gutter)"
        )}
      >
        {/* How deep the map shows: the notes past it are left out. */}
        <div
          role="group"
          aria-label={MAP.depth}
          className="pointer-events-auto flex w-fit gap-x-5 bg-background"
        >
          {DEPTHS.map((value) => {
            const current = value === depth
            return (
              <button
                key={value}
                type="button"
                aria-pressed={current}
                onClick={() => dive(value)}
                className={cn(
                  // Tall enough to tap, without making the row taller.
                  "-my-2.5 cursor-pointer py-2.5 outline-offset-4 focus-visible:outline-2",
                  "motion-safe:transition-colors motion-safe:duration-state",
                  current
                    ? "text-(--mark)"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span aria-hidden>{current ? "●" : "○"} </span>
                <span className={cn(current && "bg-(--mark)/20")}>
                  {MAP.depths[value - 1]}
                </span>
              </button>
            )
          })}
        </div>
        {/* One line for what it is, one for what is known about it. The
            count follows the depth, so the depth is part of the key. */}
        <div
          key={`facts ${subject ?? ""} ${depth}`}
          data-slot="map-facts"
          className={cn(
            "flex w-fit max-w-xl flex-col gap-1 bg-background",
            enterRow(1)
          )}
        >
          {(system ?? found) && (
            <p className="font-medium text-balance">
              {system ? (
                <>
                  <span className="bg-(--mark)/20 text-(--mark)">
                    {system.name}
                  </span>{" "}
                  {system.line}
                </>
              ) : (
                found?.body.name
              )}
            </p>
          )}
          <p className="text-caption text-muted-foreground">
            {(system
              ? count(system.bodies, depth)
              : found
                ? facts(found.body, after)
                : [
                    `${MAP.systems} ${systems.length}`,
                    ...count(
                      systems.flatMap(({ bodies }) => bodies),
                      depth
                    ),
                  ]
            ).join("   ")}
          </p>
        </div>
      </div>
    </>
  )
}
