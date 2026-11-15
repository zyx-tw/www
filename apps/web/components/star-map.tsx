"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"
import { column, enterRow, page } from "@workspace/ui/lib/layout"

import { HeroTitle } from "@/components/hero"
import { MAP } from "@/lib/copy"
import { findBody, findSystem, systemPath, systems } from "@/lib/map"
import { PALETTES } from "@/lib/map-palette"
import {
  bodyReading,
  drawScene,
  systemReading,
  type Hit,
  type Line,
  type View,
} from "@/lib/map-scene"
import { useReducedMotion } from "@/lib/use-reduced-motion"

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

/** A number as an instrument prints it: signed, two decimals. */
function signed(value: number) {
  return `${value < 0 ? "-" : "+"}${Math.abs(value).toFixed(2)}`
}

const COUNTS = [
  `${MAP.systems} ${systems.length}`,
  `${MAP.notes} ${systems.flatMap(({ bodies }) => bodies).filter(({ kind }) => !kind).length}`,
  `${MAP.courses} ${systems.flatMap(({ bodies }) => bodies).filter(({ kind }) => kind).length}`,
].join("   ")

/**
 * The map (lib/map-scene.ts) fills the screen under the corners, as the
 * display of a ship: the wireframe on a canvas of square pixels, the names
 * on a sharp one over it, the page's title at the top of the column and the
 * instruments at its foot. A drag turns the view. Pointing at a system or a
 * body puts it on the instruments; a click on a system flies there
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
  // A body stays picked only while its own system is the one flown to.
  const pinned =
    picked && findBody(picked)?.system === target ? picked : undefined

  const box = useRef<HTMLDivElement>(null)
  const wire = useRef<HTMLCanvasElement>(null)
  const names = useRef<HTMLCanvasElement>(null)
  const readout = useRef<HTMLParagraphElement>(null)
  const scene = useRef<Scene>({
    yaw: 0.5,
    pitch: 0.95,
    target: null,
    focus: 0,
    goal: 0,
    time: 0,
    hits: [],
    held: false,
    drag: null,
  })
  const still = useRef(reducedMotion)

  // What the instruments show: the thing pointed at, else the body picked,
  // else the system flown to.
  const subject = hover ?? pinned ?? target?.slug
  const shown = useRef(subject)

  useEffect(() => {
    still.current = reducedMotion
  }, [reducedMotion])

  useEffect(() => {
    shown.current = subject
    scene.current.pinned = pinned
  }, [subject, pinned])

  useEffect(() => {
    const state = scene.current
    state.goal = target ? 1 : 0
    if (target) state.target = target
  }, [target])

  useEffect(() => {
    const state = scene.current
    const element = box.current
    const low = wire.current?.getContext("2d")
    const high = names.current?.getContext("2d")
    if (!element || !low || !high) return

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
    // While the color is being chosen, ?c=amber tries one on.
    const palette =
      PALETTES[new URLSearchParams(window.location.search).get("c") ?? ""]

    let frame = 0
    let last = 0
    let count = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min((now - last) / 1000, 0.1)
      // 30 frames a second is plenty for a quiet map.
      if (dt < 1 / 32 || document.hidden || !width) return
      last = now
      const drift = !still.current && !state.held && !state.drag
      if (drift) {
        state.yaw += dt * 0.03
        state.time += dt
      }
      state.focus = still.current
        ? state.goal
        : state.focus + (state.goal - state.focus) * Math.min(1, dt * 4)
      if (Math.abs(state.goal - state.focus) < 0.002) state.focus = state.goal
      if (state.focus === 0) state.target = null

      // Gray comes from the tokens, so a theme change needs no code.
      const dim = palette?.dim ?? getComputedStyle(low.canvas).color
      const bright = palette?.bright ?? getComputedStyle(high.canvas).color
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
        low.fillStyle = tone ? bright : dim
        for (const line of drawn.lines) {
          if (Boolean(line.lit) === tone) plot(low, line)
        }
        for (const dot of drawn.dots) {
          if (Boolean(dot.lit) !== tone) continue
          const size = Math.max(1, Math.round(dot.size / PIXEL))
          low.fillRect(
            Math.round(dot.x / PIXEL - size / 2),
            Math.round(dot.y / PIXEL - size / 2),
            size,
            size
          )
        }
      }
      high.clearRect(0, 0, width, height)
      for (const label of drawn.labels) {
        high.fillStyle = label.lit ? bright : dim
        high.fillText(label.text, label.x, label.y)
      }

      // The instruments read four times a second.
      if (count++ % 8 || !readout.current) return
      const slug = shown.current
      const system = slug ? findSystem(slug) : undefined
      const found = slug ? findBody(slug) : undefined
      let text = COUNTS
      if (system) {
        const reading = systemReading(state, system)
        text = [
          `${MAP.position} ${signed(reading.x)} ${signed(reading.y)} ${signed(reading.h)}`,
          `${MAP.bearing} ${String(reading.bearing).padStart(3, "0")}°`,
          `${MAP.distance} ${reading.distance.toFixed(2)}`,
          `${MAP.bodies} ${system.bodies.length}`,
        ].join("   ")
      } else if (found) {
        const index = found.system.bodies.indexOf(found.body)
        const reading = bodyReading(state, index)
        text = [
          `${MAP.orbit} ${index + 1}/${found.system.bodies.length}`,
          `${MAP.radius} ${reading.radius.toFixed(2)}`,
          `${MAP.angle} ${String(reading.angle).padStart(3, "0")}°`,
        ].join("   ")
      }
      if (readout.current.textContent !== text) {
        readout.current.textContent = text
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
  const after = (found?.body.needs ?? [])
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
      <div
        className={cn(
          column,
          page,
          "pointer-events-none relative flex flex-1 flex-col justify-between"
        )}
      >
        {/* The page's decoder swaps text nodes for its own, so text that
            changes is a new element, not new text in the old one. */}
        <div key={target?.slug ?? "map"} className={enterRow(1)}>
          <HeroTitle text={target?.name ?? MAP.title} />
        </div>
        <div className={cn("flex flex-col gap-1", enterRow(2))}>
          <div key={subject ?? "map"} className="flex flex-col gap-1">
            {(system ?? found) && (
              <p className="flex justify-between gap-x-5">
                <span className="font-medium text-pretty">
                  {system?.name ?? found?.body.name}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {system
                    ? `${MAP.system} ${systems.indexOf(system) + 1}/${systems.length}`
                    : found?.body.kind
                      ? MAP.course
                      : MAP.note}
                </span>
              </p>
            )}
            {(system ?? found) && (
              <p className="text-pretty text-muted-foreground">
                {system?.line ?? found?.body.line}
              </p>
            )}
            {found && (
              <p className="text-caption text-muted-foreground">
                {[
                  !found.body.href && MAP.planned,
                  after.length > 0 && `${MAP.after} ${after.join("、")}`,
                ]
                  .filter(Boolean)
                  .join("   ")}
              </p>
            )}
          </div>
          {/* Filled in by the frame loop, four times a second. */}
          <p
            ref={readout}
            className="text-caption whitespace-pre-wrap text-muted-foreground"
          />
        </div>
      </div>
    </>
  )
}
