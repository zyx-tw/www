"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

import { cn } from "@workspace/ui/lib/utils"
import { enterRow } from "@workspace/ui/lib/layout"

import { Hero, HeroTitle } from "@/components/hero"
import { MAP } from "@/lib/copy"
import { findBody, findSystem, systemPath, type System } from "@/lib/map"
import { drawScene, type Hit, type View } from "@/lib/map-scene"
import { useReducedMotion } from "@/lib/use-reduced-motion"

/** Rows of the grid by its width in cells: the three column widths. */
function rowsFor(cols: number) {
  return cols < 60 ? 20 : cols < 90 ? 24 : 30
}

type Scene = View & {
  /** Where `focus` is heading: 1 at a system, 0 on the whole map. */
  goal: number
  cols: number
  rows: number
  cell: number
  hits: Hit[]
  /** The pointer is over the map, so nothing drifts under it. */
  held: boolean
  drag: { x: number; y: number; moved: boolean } | null
}

/**
 * The map (lib/map-scene.ts) under the page's title. A drag turns it, a
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
  const muted = useRef<HTMLDivElement>(null)
  const lit = useRef<HTMLDivElement>(null)
  const scene = useRef<Scene>({
    yaw: 0.5,
    pitch: 0.95,
    target: null,
    focus: 0,
    goal: 0,
    time: 0,
    names: true,
    cols: 0,
    rows: 0,
    cell: 0,
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
    if (!element || !muted.current || !lit.current) return
    const low = muted.current
    const high = lit.current

    const measure = () => {
      const probe = document.createElement("span")
      probe.textContent = "0".repeat(20)
      low.append(probe)
      state.cell = probe.getBoundingClientRect().width / 20
      probe.remove()
      if (!state.cell) return
      state.cols = Math.floor(element.clientWidth / state.cell)
      state.rows = rowsFor(state.cols)
      state.names = state.cols >= 60
    }
    const resize = new ResizeObserver(measure)
    resize.observe(element)
    void document.fonts?.ready.then(measure)

    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min((now - last) / 1000, 0.1)
      // 30 frames a second is plenty for characters.
      if (dt < 1 / 32 || document.hidden || !state.cols) return
      last = now
      const drift = !still.current && !state.held && !state.drag
      if (drift) {
        state.yaw += dt * 0.04
        state.time += dt
      }
      state.focus = still.current
        ? state.goal
        : state.focus + (state.goal - state.focus) * Math.min(1, dt * 4)
      if (Math.abs(state.goal - state.focus) < 0.002) state.focus = state.goal
      if (state.focus === 0) state.target = null
      const drawn = drawScene(state, state.cols, state.rows)
      state.hits = drawn.hits
      if (low.textContent !== drawn.muted) low.textContent = drawn.muted
      if (high.textContent !== drawn.lit) high.textContent = drawn.lit
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
    }
  }, [])

  /** The run of cells under the pointer: its own row first, then a row off. */
  const hitAt = (event: React.PointerEvent) => {
    const state = scene.current
    const rect = muted.current?.getBoundingClientRect()
    if (!rect || !state.cell) return
    const col = Math.floor((event.clientX - rect.left) / state.cell)
    const row = Math.floor(
      (event.clientY - rect.top) / (rect.height / state.rows)
    )
    const inside = (hit: Hit) =>
      col >= hit.col - 1 && col <= hit.col + hit.width
    // The last one drawn is the nearest, so look from the end.
    const drawn = [...state.hits].reverse()
    return (
      drawn.find((hit) => hit.row === row && inside(hit)) ??
      drawn.find((hit) => Math.abs(hit.row - row) === 1 && inside(hit))
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
        data-decode="own"
        className={cn(
          "relative mt-10 h-120 w-full cursor-grab touch-pan-y overflow-hidden whitespace-pre select-none data-dragging:cursor-grabbing data-over:cursor-pointer lg:h-144 2xl:h-180",
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
        <div ref={muted} className="w-fit text-muted-foreground" />
        <div ref={lit} className="absolute inset-0 text-foreground" />
      </div>
    </>
  )
}
