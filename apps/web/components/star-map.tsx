"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

import { cn } from "@workspace/ui/lib/utils"
import { enterRow } from "@workspace/ui/lib/layout"

import { Hero, HeroTitle } from "@/components/hero"
import { MAP } from "@/lib/copy"
import { findBody, findSystem, systemPath, type System } from "@/lib/map"
import { drawScene, type Hit, type Line, type View } from "@/lib/map-scene"
import { useReducedMotion } from "@/lib/use-reduced-motion"

/** CSS pixels to one pixel of the wireframe. */
const PIXEL = 2

type Scene = View & {
  /** Where `focus` is heading: 1 at a system, 0 on the whole map. */
  goal: number
  hits: Hit[]
  /** The pointer is over the map, so nothing drifts under it. */
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

/**
 * The map (lib/map-scene.ts) under the page's title: the wireframe on a
 * canvas of square pixels, the names on a sharp one over it. A drag turns it, a
 * click on a system flies there (/map/<system>), a click on a body goes to
 * its row in the list, and a click on empty space flies back out. It lives
 * in the layout, so it keeps its turn from one page of the map to the next.
 * Decorative for a screen reader: the lists below hold the same links.
 */
export function StarMap() {
  const pathname = usePathname()
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const target = findSystem(pathname.split("/")[2] ?? "") ?? null

  const box = useRef<HTMLDivElement>(null)
  const wire = useRef<HTMLCanvasElement>(null)
  const names = useRef<HTMLCanvasElement>(null)
  const scene = useRef<Scene>({
    yaw: 0.5,
    pitch: 0.95,
    target: null,
    focus: 0,
    goal: 0,
    time: 0,
    names: true,
    hits: [],
    held: false,
    drag: null,
  })
  const still = useRef(reducedMotion)

  useEffect(() => {
    still.current = reducedMotion
  }, [reducedMotion])

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
      state.names = width >= 500
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
        state.yaw += dt * 0.03
        state.time += dt
      }
      state.focus = still.current
        ? state.goal
        : state.focus + (state.goal - state.focus) * Math.min(1, dt * 4)
      if (Math.abs(state.goal - state.focus) < 0.002) state.focus = state.goal
      if (state.focus === 0) state.target = null

      // Both tones come from the tokens, so a theme change needs no code.
      const dim = getComputedStyle(low.canvas).color
      const bright = getComputedStyle(high.canvas).color
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

  const hover = (hit: Hit | undefined) => {
    scene.current.hover = hit?.body ?? hit?.system
    if (hit) box.current?.setAttribute("data-over", "")
    else box.current?.removeAttribute("data-over")
  }

  const open = (hit: Hit | undefined) => {
    if (!hit) {
      if (scene.current.goal) router.push("/map", { scroll: false })
      return
    }
    const system: Pick<System, "slug"> = { slug: hit.system }
    if (!hit.body) return router.push(systemPath(system), { scroll: false })
    const href = findBody(hit.body)?.body.href
    router.push(href ?? `${systemPath(system)}#${hit.body}`)
  }

  return (
    <>
      {/* The page's decoder swaps text nodes for its own, so a title that
          changes is a new element, not new text in the old one. */}
      <Hero
        key={target?.slug ?? "map"}
        title={<HeroTitle text={target?.name ?? MAP.title} />}
        subtitle={target?.line}
      />
      <div
        ref={box}
        aria-hidden
        className={cn(
          "relative mt-10 h-120 w-full cursor-grab touch-pan-y overflow-hidden select-none data-dragging:cursor-grabbing data-over:cursor-pointer lg:h-144 2xl:h-180",
          enterRow(3)
        )}
        onPointerEnter={() => {
          scene.current.held = true
        }}
        onPointerLeave={() => {
          scene.current.held = false
          hover(undefined)
        }}
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
          if (!drag) return hover(hitAt(event))
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
    </>
  )
}
