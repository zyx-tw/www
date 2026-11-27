"use client"
/* eslint-disable @next/next/no-img-element -- the room is small pixel frames swapped in place; next/image would resample them */

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react"

import { cn } from "@workspace/ui/lib/utils"
import { enterRow } from "@workspace/ui/lib/layout"

import {
  DEVICES,
  KINDS,
  LINKS,
  OUTSIDE_LABEL,
  ROOM,
  type Device,
  type DeviceId,
} from "@/lib/room"
import { useReducedMotion } from "@/lib/use-reduced-motion"

type Shot = { src: string; x: number; y: number; w: number; h: number }
type Point = [number, number]
type Frames = { foot: Point; frames: Record<string, Shot[]> }

// One drawing of each block. The camera is orthographic, so a block moved on
// screen looks the same: the page places the drawings itself.
const DRAWN = ROOM.blocks as unknown as Record<DeviceId, Frames>

/** Screen pixels per drawing pixel at most: past it, the room grows its gaps instead of its blocks. */
const MAX_SCALE = 1.3
/** Room under each block for its name, in screen pixels. */
const NAME = 22

/**
 * Where each block stands, as a share of the room, by the room's shape. Loose
 * on purpose: rows that drift, as blocks set down by hand.
 */
const SPOTS: { minAspect: number; at: Record<DeviceId, Point> }[] = [
  {
    minAspect: 1.7,
    at: {
      hopper: [0.04, 0.46],
      workbench: [0.43, 0.06],
      spawner: [0.24, 0.92],
      anvil: [0.55, 0.74],
      enderchest: [0.76, 0.98],
      furnace: [0.97, 0.38],
    },
  },
  {
    minAspect: 0.95,
    at: {
      hopper: [0.06, 0.16],
      workbench: [0.5, 0.02],
      furnace: [0.94, 0.22],
      spawner: [0.14, 0.96],
      anvil: [0.52, 0.7],
      enderchest: [0.88, 0.94],
    },
  },
  {
    minAspect: 0,
    at: {
      workbench: [0.2, 0.0],
      hopper: [0.86, 0.1],
      spawner: [0.1, 0.5],
      furnace: [0.8, 0.56],
      anvil: [0.3, 0.98],
      enderchest: [0.92, 0.94],
    },
  },
]

/** How far a block's drawing reaches from its foot, in drawing pixels. */
const REACH = Object.fromEntries(
  Object.entries(DRAWN).map(([id, { foot, frames }]) => {
    const all = Object.values(frames).flat()
    return [
      id,
      {
        left: foot[0] - Math.min(...all.map((s) => s.x)),
        right: Math.max(...all.map((s) => s.x + s.w)) - foot[0],
        up: foot[1] - Math.min(...all.map((s) => s.y)),
        down: Math.max(...all.map((s) => s.y + s.h)) - foot[1],
      },
    ]
  })
) as Record<DeviceId, { left: number; right: number; up: number; down: number }>

type Placed = {
  scale: number
  feet: Record<DeviceId, Point>
  outside: Record<"internet" | "aintern", Point>
}

/** The most room the blocks spread over: past it, the rest is margin. */
const SPREAD = { w: 1100, h: 700 }

/**
 * Places the blocks in a w by h room with one arrangement: the largest scale
 * up to MAX_SCALE at which no two blocks, names included, overlap. They
 * spread over at most SPREAD, centred.
 */
function arrangeWith(
  spots: Record<DeviceId, Point>,
  w: number,
  h: number
): Placed {
  const ids = Object.keys(spots) as DeviceId[]
  const aw = Math.min(w, SPREAD.w),
    ah = Math.min(h, SPREAD.h)
  const x0 = (w - aw) / 2,
    y0 = (h - ah) / 2
  const at = (scale: number) => {
    const padL = Math.max(...ids.map((id) => REACH[id].left)) * scale
    const padR = Math.max(...ids.map((id) => REACH[id].right)) * scale
    const padT = Math.max(...ids.map((id) => REACH[id].up)) * scale + 24
    const padB = Math.max(...ids.map((id) => REACH[id].down)) * scale + NAME
    return Object.fromEntries(
      ids.map((id) => [
        id,
        [
          x0 + padL + spots[id][0] * (aw - padL - padR),
          y0 + padT + spots[id][1] * (ah - padT - padB),
        ],
      ])
    ) as Record<DeviceId, Point>
  }
  const rect = (
    id: DeviceId,
    [x, y]: Point,
    scale: number
  ): [number, number, number, number] => {
    const r = REACH[id]
    return [
      x - r.left * scale,
      y - r.up * scale,
      x + r.right * scale,
      y + r.down * scale + NAME,
    ]
  }
  let scale = MAX_SCALE
  for (; scale > 0.3; scale -= 0.02) {
    const feet = at(scale)
    const boxes = ids.map((id) => rect(id, feet[id], scale))
    const clash = boxes.some((a, i) =>
      boxes.some(
        (b, j) =>
          j > i &&
          a[0] < b[2] - 4 &&
          b[0] < a[2] - 4 &&
          a[1] < b[3] - 4 &&
          b[1] < a[3] - 4
      )
    )
    if (!clash) break
  }
  return {
    scale,
    feet: at(scale),
    outside: {
      internet: [x0 + aw * 0.08, y0 + 18],
      aintern: [x0 + aw * 0.92, y0 + 18],
    },
  }
}

/** Tries every arrangement and keeps the one with the biggest blocks; the one made for this shape wins a tie. */
function arrange(w: number, h: number): Placed {
  const fitting = SPOTS.findIndex((s) => w / h >= s.minAspect)
  return SPOTS.map((s, i) => ({
    placed: arrangeWith(s.at, w, h),
    bonus: i === fitting ? 0.05 : 0,
  })).sort((a, b) => b.placed.scale + b.bonus - (a.placed.scale + a.bonus))[0]!
    .placed
}

/** Steps through `count` frames every `ms` while `run`. */
function useTicker(count: number, ms: number, run: boolean) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (!run || count < 2) return
    const id = setInterval(() => setFrame((f) => (f + 1) % count), ms)
    return () => clearInterval(id)
  }, [count, ms, run])
  return frame % Math.max(1, count)
}

/** Walks a frame number toward `target`, one frame every `ms`: the ender chest's lid. */
function useToward(target: number, ms: number) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (frame === target) return
    const id = setTimeout(() => setFrame((f) => f + Math.sign(target - f)), ms)
    return () => clearTimeout(id)
  }, [frame, target, ms])
  return frame
}

type Pick = {
  chosen: DeviceId | null
  point: (id: DeviceId | null, event: PointerEvent) => void
  pick: (id: DeviceId) => void
  clear: () => void
}

/** One block: every frame is in the page and only the current one shows, so nothing flickers while loading. */
function Block({
  id,
  at,
  scale,
  still,
  pick,
}: {
  id: DeviceId
  at: Point
  scale: number
  still: boolean
  pick: Pick
}) {
  const { frames, foot } = DRAWN[id]
  const chosen = pick.chosen === id
  const rest = frames.rest ?? []
  const open = frames.open ?? []
  const lit = frames.lit ?? []
  const spin = useTicker(rest.length, chosen ? 60 : 150, !still)
  const flame = useTicker(lit.length || rest.length, chosen ? 110 : 260, !still)
  const lid = useToward(chosen ? open.length : 0, 45)

  let shown: Shot | undefined = rest[0]
  if (id === "spawner") shown = (chosen && lit.length ? lit : rest)[spin]
  if (id === "furnace")
    shown =
      chosen && lit.length ? lit[flame % lit.length] : rest[flame % rest.length]
  if (id === "enderchest") shown = lid > 0 ? open[lid - 1] : rest[0]
  if (still && id === "enderchest")
    shown = chosen ? open[open.length - 1] : rest[0]

  const box = (s: Shot, z: number) => ({
    left: at[0] + (s.x - foot[0]) * scale,
    top: at[1] + (s.y - foot[1]) * scale,
    width: s.w * scale,
    height: s.h * scale,
    zIndex: z,
  })
  const hit = rest[0]
  const z = Math.round(at[1])
  return (
    <>
      {[...rest, ...open, ...lit].map((shot) => (
        <img
          key={shot.src}
          src={shot.src}
          alt=""
          draggable={false}
          className={cn(
            "pointer-events-none absolute select-none [image-rendering:pixelated]",
            shot === shown ? "opacity-100" : "opacity-0"
          )}
          style={box(shot, z)}
        />
      ))}
      {/* The pointer's target stays put while the frames change under it. */}
      {hit && (
        <button
          type="button"
          aria-label={id}
          aria-pressed={chosen}
          onPointerEnter={(e) => pick.point(id, e)}
          onPointerLeave={(e) => pick.point(null, e)}
          onClick={(e) => {
            e.stopPropagation()
            pick.pick(id)
          }}
          className="absolute cursor-pointer"
          style={box(hit, 500)}
        />
      )}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -translate-x-1/2 font-mono text-caption",
          chosen ? "text-(--mark)" : "text-muted-foreground"
        )}
        style={{
          left: at[0],
          top: at[1] + REACH[id].down * scale,
          zIndex: 400,
        }}
      >
        {id}
      </span>
    </>
  )
}

/** Lines between the chosen block and what it talks to, with data running along them. */
function Links({
  id,
  placed,
  w,
  h,
  still,
}: {
  id: DeviceId
  placed: Placed
  w: number
  h: number
  still: boolean
}) {
  const at = (end: string): Point =>
    end in placed.feet
      ? placed.feet[end as DeviceId]
      : placed.outside[end as "internet" | "aintern"]
  const links = LINKS.filter((l) => l.from === id || l.to === id)
  const pair = (l: (typeof links)[number]) => [l.from, l.to].sort().join("|")
  const lines = links.map((l, i) => {
    const [ax, ay] = at(l.from)
    const [bx, by] = at(l.to)
    const same = links.filter((m) => pair(m) === pair(l)).length
    const k = links.slice(0, i).filter((m) => pair(m) === pair(l)).length
    const len = Math.hypot(bx - ax, by - ay) || 1
    // Links between the same two ends sit side by side, and their labels stack.
    const off = (k - (same - 1) / 2) * 5
    const ox = (-(by - ay) / len) * off,
      oy = ((bx - ax) / len) * off
    return {
      ...l,
      k,
      len,
      ax,
      ay,
      bx,
      by,
      path: `M${ax + ox},${ay + oy} L${bx + ox},${by + oy}`,
    }
  })
  const box = `0 0 ${w} ${h}`
  return (
    <>
      <svg
        viewBox={box}
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
        style={{ zIndex: 1 }}
        aria-hidden
      >
        {lines.map((l, i) => {
          const { color } = KINDS[l.kind]
          return (
            <g key={i}>
              <path
                d={l.path}
                stroke={color}
                strokeOpacity={0.8}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="none"
              />
              {!still &&
                [0, 1, 2].map((p) => (
                  <rect key={p} x={-2} y={-2} width={4} height={4} fill={color}>
                    <animateMotion
                      dur={`${(l.len / 90).toFixed(2)}s`}
                      begin={`-${((p * l.len) / 270).toFixed(2)}s`}
                      repeatCount="indefinite"
                      path={l.path}
                    />
                  </rect>
                ))}
            </g>
          )
        })}
      </svg>
      <svg
        viewBox={box}
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
        style={{ zIndex: 450 }}
        aria-hidden
      >
        {lines.map((l, i) => {
          const { label, color } = KINDS[l.kind]
          return (
            <text
              key={i}
              x={l.ax + (l.bx - l.ax) * 0.55}
              y={l.ay + (l.by - l.ay) * 0.55 - 6 + l.k * 15}
              fill={color}
              fontSize={12}
              textAnchor="middle"
              className="font-mono"
              paintOrder="stroke"
              stroke="#111"
              strokeWidth={3}
            >
              {label}
            </text>
          )
        })}
        {(["internet", "aintern"] as const)
          .filter((o) => links.some((l) => l.from === o || l.to === o))
          .map((o) => {
            const [x, y] = placed.outside[o]
            return (
              <text
                key={o}
                x={x}
                y={y - 6}
                fill="#bbb"
                fontSize={12}
                textAnchor="middle"
                className="font-mono"
              >
                {OUTSIDE_LABEL[o]}
              </text>
            )
          })}
      </svg>
    </>
  )
}

/**
 * The room fills its cell. Blocks grow with it up to MAX_SCALE; past that
 * the gaps between them grow. A click on the floor clears the choice.
 */
function FitRoom({
  still,
  pick,
  className,
}: {
  still: boolean
  pick: Pick
  className?: string
}) {
  const cell = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    const el = cell.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry)
        setSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const placed = size && arrange(size.w, size.h)
  return (
    <div
      ref={cell}
      className={cn("relative min-h-60 min-w-0", className)}
      onClick={pick.clear}
    >
      {size && placed && (
        <>
          {pick.chosen && (
            <Links
              id={pick.chosen}
              placed={placed}
              w={size.w}
              h={size.h}
              still={still}
            />
          )}
          {DEVICES.map((d) => (
            <Block
              key={d.id}
              id={d.id}
              at={placed.feet[d.id]}
              scale={placed.scale}
              still={still}
              pick={pick}
            />
          ))}
        </>
      )}
    </div>
  )
}

function Row({ device, pick }: { device: Device; pick: Pick }) {
  const chosen = pick.chosen === device.id
  const kinds = [
    ...new Set(
      LINKS.filter((l) => l.from === device.id || l.to === device.id).map(
        (l) => l.kind
      )
    ),
  ]
  return (
    <li
      onPointerEnter={(e) => pick.point(device.id, e)}
      onPointerLeave={(e) => pick.point(null, e)}
    >
      <button
        type="button"
        aria-expanded={chosen}
        onClick={() => pick.pick(device.id)}
        className={cn(
          "flex w-full items-baseline gap-3 py-2 text-left",
          chosen ? "text-(--mark)" : ""
        )}
      >
        <span className="w-28 shrink-0 font-mono">{device.id}</span>
        <span className="shrink-0">{device.block}</span>
        <span className="hidden min-w-0 flex-1 truncate text-right text-caption text-muted-foreground sm:block md:hidden">
          {device.role}
        </span>
      </button>
      {chosen && (
        <div className="flex flex-col gap-2 pb-4 text-caption text-muted-foreground sm:pl-27 md:pl-0">
          <p className="text-foreground sm:hidden md:block">{device.role}</p>
          <p>{[device.system, ...device.parts].join("，")}</p>
          {device.vms && (
            <p className="font-mono">VM：{device.vms.join("  ")}</p>
          )}
          {device.cts && (
            <p className="font-mono">CT：{device.cts.join("  ")}</p>
          )}
          {device.others && <p>{device.others}</p>}
          <p className="flex flex-wrap gap-x-4">
            {kinds.map((k) => (
              <span
                key={k}
                className="font-mono"
                style={{ color: KINDS[k].color }}
              >
                ■ {KINDS[k].label}
              </span>
            ))}
          </p>
        </div>
      )}
    </li>
  )
}

/**
 * The page under the title: each machine as its block, and a row per
 * machine. A mouse pointing at a block or a row lights its links and opens
 * its row. A click or a tap keeps it chosen, until it is clicked again or the
 * floor is. The page is one screen tall and the room takes the space the
 * title and the rows leave.
 */
export function DeviceRoom({ hero }: { hero: ReactNode }) {
  const still = useReducedMotion()
  const [pointed, setPointed] = useState<DeviceId | null>(null)
  const [picked, setPicked] = useState<DeviceId | null>(null)
  const pick: Pick = {
    chosen: pointed ?? picked,
    // Only a mouse points; a finger's touch is a click.
    point: (id, e) => {
      if (e.pointerType === "mouse") setPointed(id)
    },
    pick: (id) => {
      setPointed(null)
      setPicked((p) => (p === id ? null : id))
    },
    clear: () => {
      setPointed(null)
      setPicked(null)
    },
  }

  // Below md: title, room, rows, one column. From md the title and rows are
  // the left column and the room the whole right side; the left column's box
  // is gone below md (`contents`) and `order` puts the room between its two
  // children. When an open row makes the rows taller than their space, the
  // rows scroll inside it and the page stays one screen.
  return (
    <>
      <div className="contents md:flex md:min-h-0 md:w-72 md:shrink-0 md:flex-col md:gap-10">
        <div className="order-1">{hero}</div>
        <ul
          className={cn(
            "order-3 flex min-h-0 shrink flex-col overflow-y-auto",
            enterRow(4)
          )}
        >
          {DEVICES.map((d) => (
            <Row key={d.id} device={d} pick={pick} />
          ))}
        </ul>
      </div>
      <FitRoom
        still={still}
        pick={pick}
        className={cn("order-2 flex-1", enterRow(3))}
      />
    </>
  )
}
