"use client"

import * as React from "react"

/**
 * Renders any picture as text art on a canvas: an image URL, a video, a
 * camera stream, another canvas, or a function that paints a field each
 * frame. `look` picks how cells are drawn, `color` how they are colored and
 * `effects` the post pass (bloom, chromatic split, scanlines, glitch).
 */

export type AsciiLook =
  | "classic"
  | "edges"
  | "braille"
  | "dots"
  | "dither"
  | "bricks"
  | "rain"
  | "particles"

/** mono: the theme's foreground; source: the picture's own colors; or gradient stops. */
export type AsciiColor = "mono" | "source" | string[]

export type AsciiEffects = {
  /** Glow around bright cells, 0 to 2; dark theme only. */
  bloom?: number
  /** Pixels of red and blue split; dark theme only. */
  chromatic?: number
  scanlines?: boolean
  glitch?: boolean
}

/** Paints `lum` (0 to 1) and `rgb` (RGBA bytes) for a w by h grid; aspect = width / height of the canvas. */
export type AsciiFieldRender = (
  t: number,
  w: number,
  h: number,
  lum: Float32Array,
  rgb: Uint8ClampedArray,
  aspect: number
) => void

export type AsciiSource =
  | string
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement
  | MediaStream
  | AsciiFieldRender

const RAMP = " .,:;-=+*#%@"
const RAIN = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789"
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  (v) => (v + 0.5) / 16
)
const BRAILLE = [
  [0x01, 0x02, 0x04, 0x40],
  [0x08, 0x10, 0x20, 0x80],
]

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

type Rgb = [number, number, number]

function parseColor(css: string): Rgb {
  const c = document.createElement("canvas")
  c.width = c.height = 1
  const g = c.getContext("2d", { willReadFrequently: true })!
  g.fillStyle = css
  g.fillRect(0, 0, 1, 1)
  const d = g.getImageData(0, 0, 1, 1).data
  return [d[0]!, d[1]!, d[2]!]
}

function mix(a: Rgb, b: Rgb, f: number) {
  return `rgb(${(a[0] + (b[0] - a[0]) * f) | 0},${(a[1] + (b[1] - a[1]) * f) | 0},${(a[2] + (b[2] - a[2]) * f) | 0})`
}

function gradientAt(stops: Rgb[], v: number) {
  const x = Math.min(0.9999, Math.max(0, v)) * (stops.length - 1)
  const k = Math.floor(x)
  return mix(stops[k]!, stops[k + 1]!, x - k)
}

/** Grid cell size in CSS px for each look, from the base `cell` size. */
function gridOf(look: AsciiLook, cell: number) {
  switch (look) {
    case "braille":
      return { cw: cell * 0.6, ch: cell * 1.2, sx: 2, sy: 4 }
    case "dots":
      return { cw: cell * 0.6, ch: cell * 0.6, sx: 1, sy: 1 }
    case "dither":
      return {
        cw: Math.max(2, cell * 0.3),
        ch: Math.max(2, cell * 0.3),
        sx: 1,
        sy: 1,
      }
    case "bricks":
      return { cw: cell * 0.9, ch: cell * 0.9, sx: 1, sy: 1 }
    case "particles":
      return { cw: cell * 0.5, ch: cell * 0.5, sx: 1, sy: 1 }
    default:
      return { cw: cell * 0.62, ch: cell * 1.15, sx: 1, sy: 1 }
  }
}

export function Ascii({
  source,
  look = "classic",
  color = "mono",
  effects = {},
  cell = 10,
  className,
  ...props
}: Omit<React.ComponentProps<"canvas">, "color"> & {
  source: AsciiSource
  look?: AsciiLook
  color?: AsciiColor
  effects?: AsciiEffects
  /** Base cell size in CSS px; smaller is denser. */
  cell?: number
}) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  // Props read by the running loop without restarting it.
  const live = React.useRef({ look, color, effects, cell })
  live.current = { look, color, effects, cell }

  React.useEffect(() => {
    const canvas = ref.current!
    // The visible canvas is WebGL for the post pass; 2D if WebGL is missing.
    const post = createPost(canvas)
    const ctx2d = post ? null : canvas.getContext("2d")
    const base = document.createElement("canvas")
    const bctx = base.getContext("2d")!
    const grab = document.createElement("canvas")
    const gctx = grab.getContext("2d", { willReadFrequently: true })!
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // The element to sample, if the source is not a field function.
    let el: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | null =
      null
    let ownVideo: HTMLVideoElement | null = null
    if (typeof source === "string") {
      if (/\.(mp4|webm|mov)(\?|$)/i.test(source)) {
        ownVideo = document.createElement("video")
        ownVideo.src = source
      } else {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = source
        el = img
      }
    } else if (
      typeof MediaStream !== "undefined" &&
      source instanceof MediaStream
    ) {
      ownVideo = document.createElement("video")
      ownVideo.srcObject = source
    } else if (typeof source !== "function") {
      el = source as HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
    }
    if (ownVideo) {
      ownVideo.muted = true
      ownVideo.loop = true
      ownVideo.playsInline = true
      ownVideo.crossOrigin = "anonymous"
      void ownVideo.play().catch(() => {})
      el = ownVideo
    }

    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let visible = true
    let lum = new Float32Array(0)
    let rgb = new Uint8ClampedArray(0)
    // Particle state.
    let px = new Float32Array(0)
    let py = new Float32Array(0)
    let vx = new Float32Array(0)
    let vy = new Float32Array(0)
    let pointer: { x: number; y: number } | null = null
    let fg: Rgb = [230, 230, 230]
    let bg: Rgb = [20, 20, 20]
    let bgCss = "rgb(20,20,20)"
    let font = "monospace"
    let stops: Rgb[] = []
    let stopsKey = ""

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      w = canvas.clientWidth
      h = canvas.clientHeight
      for (const c of [canvas, base]) {
        c.width = Math.max(1, Math.round(w * dpr))
        c.height = Math.max(1, Math.round(h * dpr))
      }
    }

    function readTheme() {
      const cs = getComputedStyle(canvas)
      fg = parseColor(cs.color)
      bgCss = getComputedStyle(document.body).backgroundColor
      bg = parseColor(bgCss)
      font = cs.fontFamily
    }

    function sampleSource(t: number, gw: number, gh: number) {
      const n = gw * gh
      if (lum.length !== n) {
        lum = new Float32Array(n)
        rgb = new Uint8ClampedArray(n * 4)
      }
      if (typeof source === "function") {
        source(t, gw, gh, lum, rgb, w / h)
        return
      }
      if (!el) return
      const sw =
        el instanceof HTMLVideoElement
          ? el.videoWidth
          : el instanceof HTMLImageElement
            ? el.naturalWidth
            : el.width
      const sh =
        el instanceof HTMLVideoElement
          ? el.videoHeight
          : el instanceof HTMLImageElement
            ? el.naturalHeight
            : el.height
      if (!sw || !sh) return
      grab.width = gw
      grab.height = gh
      // Cover: crop the source to the canvas's aspect, then squeeze to the grid.
      const target = w / h
      let cw = sw
      let ch = sw / target
      if (ch > sh) {
        ch = sh
        cw = sh * target
      }
      gctx.drawImage(el, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, gw, gh)
      const d = gctx.getImageData(0, 0, gw, gh).data
      rgb.set(d)
      for (let k = 0; k < n; k++) {
        lum[k] =
          (0.2126 * d[k * 4]! +
            0.7152 * d[k * 4 + 1]! +
            0.0722 * d[k * 4 + 2]!) /
          255
      }
    }

    function colorFn(dark: boolean) {
      const c = live.current.color
      if (c === "source") {
        // The picture's color, lifted when the look draws a cell brighter
        // than the picture is there (edges, the head of a rain drop).
        return (k: number, v: number) => {
          const f = Math.min(3, Math.max(1, v / Math.max(lum[k]!, 0.05)))
          return `rgb(${Math.min(255, rgb[k * 4]! * f)},${Math.min(255, rgb[k * 4 + 1]! * f)},${Math.min(255, rgb[k * 4 + 2]! * f)})`
        }
      }
      if (Array.isArray(c)) {
        const key = c.join()
        if (key !== stopsKey) {
          stops = c.map(parseColor)
          stopsKey = key
        }
        return (_k: number, v: number) => gradientAt(stops, v)
      }
      // Mono: from the background toward the foreground.
      return (_k: number, v: number) =>
        mix(bg, fg, dark ? 0.15 + v * 0.85 : 0.1 + v * 0.9)
    }

    function drawLook(t: number, dark: boolean) {
      const { look, cell } = live.current
      const { cw, ch, sx, sy } = gridOf(look, cell)
      const cols = Math.ceil(w / cw)
      const rows = Math.ceil(h / ch)
      const gw = cols * sx
      const gh = rows * sy
      sampleSource(t, gw, gh)
      const colorAt = colorFn(dark)
      const g = bctx
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, w, h)
      g.textBaseline = "top"

      if (look === "classic" || look === "edges" || look === "rain") {
        g.font = `${cell}px ${font}`
        const frame = Math.floor(t * 10)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const k = r * gw + c
            let v = lum[k]
            let ch_ =
              RAMP[Math.min(RAMP.length - 1, Math.floor(v! * RAMP.length))]
            if (
              look === "edges" &&
              r > 0 &&
              c > 0 &&
              r < rows - 1 &&
              c < cols - 1
            ) {
              const L = (dr: number, dc: number) => lum[(r + dr) * gw + c + dc]!
              const gx =
                L(-1, 1) +
                2 * L(0, 1) +
                L(1, 1) -
                L(-1, -1) -
                2 * L(0, -1) -
                L(1, -1)
              const gy =
                L(1, -1) +
                2 * L(1, 0) +
                L(1, 1) -
                L(-1, -1) -
                2 * L(-1, 0) -
                L(-1, 1)
              if (Math.hypot(gx, gy) > 0.9) {
                const d =
                  ((Math.atan2(gy, gx) * 180) / Math.PI + 90 + 360) % 180
                ch_ =
                  d < 22.5 || d >= 157.5
                    ? "-"
                    : d < 67.5
                      ? "\\"
                      : d < 112.5
                        ? "|"
                        : "/"
                v = Math.max(v!, 0.85)
              } else {
                v! *= 0.5
                ch_ =
                  RAMP[Math.min(RAMP.length - 1, Math.floor(v! * RAMP.length))]
              }
            }
            if (look === "rain") {
              const speed = 4 + hash(c) * 10
              const trail = 6 + hash(c + 99) * 14
              const head = (t * speed + hash(c + 7) * 200) % (rows + trail)
              const tail = r <= head ? Math.max(0, 1 - (head - r) / trail) : 0
              // Rain falls only where the picture has something.
              v =
                v! < 0.04
                  ? 0
                  : v! * (0.25 + 0.75 * tail) +
                    (Math.abs(head - r) < 1 ? 0.6 : 0)
              ch_ =
                RAIN[
                  Math.floor(
                    hash(
                      c * 31 + r * 17 + Math.floor(frame * (0.3 + hash(c)))
                    ) * RAIN.length
                  )
                ]
            }
            if (v! < 0.04 || ch_ === " ") continue
            g.fillStyle = colorAt(k, Math.min(1, v!))
            g.fillText(ch_!, c * cw, r * ch)
          }
        }
      } else if (look === "braille") {
        g.font = `${cell * 1.2}px ${font}`
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            let bits = 0
            let sum = 0
            for (let dx = 0; dx < 2; dx++) {
              for (let dy = 0; dy < 4; dy++) {
                const k = (r * 4 + dy) * gw + c * 2 + dx
                sum += lum[k]!
                if (
                  lum[k]! > BAYER[((r * 4 + dy) % 4) * 4 + ((c * 2 + dx) % 4)]!
                )
                  bits |= BRAILLE[dx]![dy]!
              }
            }
            if (!bits) continue
            g.fillStyle = colorAt(
              r * 4 * gw + c * 2,
              Math.min(1, sum / 8 + 0.3)
            )
            g.fillText(String.fromCharCode(0x2800 + bits), c * cw, r * ch)
          }
        }
      } else if (look === "dots") {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const k = r * gw + c
            const v = lum[k]
            if (v! < 0.05) continue
            g.fillStyle = colorAt(k, 0.6 + v! * 0.4)
            g.beginPath()
            g.arc(
              (c + 0.5) * cw,
              (r + 0.5) * ch,
              (cw / 2) * Math.sqrt(v!),
              0,
              Math.PI * 2
            )
            g.fill()
          }
        }
      } else if (look === "dither") {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const k = r * gw + c
            if (lum[k]! <= BAYER[(r % 4) * 4 + (c % 4)]!) continue
            g.fillStyle = colorAt(k, 0.85)
            g.fillRect(c * cw, r * ch, cw - 0.5, ch - 0.5)
          }
        }
      } else if (look === "bricks") {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const k = r * gw + c
            const x = c * cw
            const y = r * ch
            g.fillStyle = colorAt(k, lum[k]!)
            g.fillRect(x, y, cw, ch)
            g.fillStyle = "rgba(255,255,255,0.14)"
            g.fillRect(x, y, cw, 1)
            g.fillRect(x, y, 1, ch)
            g.fillStyle = "rgba(0,0,0,0.4)"
            g.fillRect(x, y + ch - 1, cw, 1)
            g.fillRect(x + cw - 1, y, 1, ch)
          }
        }
      } else if (look === "particles") {
        const n = cols * rows
        if (px.length !== n) {
          px = new Float32Array(n)
          py = new Float32Array(n)
          vx = new Float32Array(n)
          vy = new Float32Array(n)
          for (let k = 0; k < n; k++) {
            // Start scattered, then gather.
            px[k] = hash(k) * w
            py[k] = hash(k + 0.5) * h
          }
        }
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const k = r * cols + c
            const hx = (c + 0.5) * cw
            const hy = (r + 0.5) * ch
            let ax = (hx - px[k]!) * 0.06
            let ay = (hy - py[k]!) * 0.06
            if (pointer) {
              const dx = px[k]! - pointer.x
              const dy = py[k]! - pointer.y
              const d2 = dx * dx + dy * dy
              if (d2 < 3600) {
                const f = (1 - d2 / 3600) * 6
                const d = Math.sqrt(d2) || 1
                ax += (dx / d) * f
                ay += (dy / d) * f
              }
            }
            vx[k] = (vx[k]! + ax) * 0.82
            vy[k] = (vy[k]! + ay) * 0.82
            if (reduce) {
              px[k] = hx
              py[k] = hy
            } else {
              px[k]! += vx[k]
              py[k]! += vy[k]
            }
            const v = lum[k]
            if (v! < 0.05) continue
            const s = cw * (0.35 + 0.6 * v!)
            g.fillStyle = colorAt(k, 0.5 + v! * 0.5)
            g.fillRect(px[k]! - s / 2, py[k]! - s / 2, s, s)
          }
        }
      }
    }

    function frame(now: number) {
      const t = now / 1000
      const fx = live.current.effects
      const dark = (bg[0] + bg[1] + bg[2]) / 3 < 128
      drawLook(t, dark)
      if (post) {
        post.draw(base, {
          bg,
          bloom: dark ? (fx.bloom ?? 0) : 0,
          split: dark ? (fx.chromatic ?? 0) * dpr : 0,
          scanlines: fx.scanlines ? (dark ? 1 : 0.2) : 0,
          glitch: fx.glitch && !reduce ? 1 : 0,
          time: t,
          dpr,
        })
      } else if (ctx2d) {
        ctx2d.setTransform(1, 0, 0, 1, 0, 0)
        ctx2d.fillStyle = bgCss
        ctx2d.fillRect(0, 0, canvas.width, canvas.height)
        ctx2d.drawImage(base, 0, 0)
      }
      if (!reduce && visible) raf = requestAnimationFrame(frame)
    }

    function start() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(frame)
    }

    const ro = new ResizeObserver(() => {
      resize()
      if (reduce) start()
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      const was = visible
      visible = e!.isIntersecting
      if (visible && !was) start()
    })
    io.observe(canvas)
    const mo = new MutationObserver(() => {
      readTheme()
      if (reduce) start()
    })
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const leave = () => (pointer = null)
    canvas.addEventListener("pointermove", move)
    canvas.addEventListener("pointerleave", leave)
    if (el instanceof HTMLImageElement) el.addEventListener("load", start)

    readTheme()
    resize()
    start()
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      canvas.removeEventListener("pointermove", move)
      canvas.removeEventListener("pointerleave", leave)
      post?.dispose()
      if (ownVideo) {
        ownVideo.pause()
        ownVideo.srcObject = null
      }
    }
  }, [source])

  return <canvas ref={ref} className={className} aria-hidden {...props} />
}

/**
 * Wraps an expensive field so every canvas showing it in the same frame
 * shares one render at `size` by `size`, resampled to each grid.
 */
export function sharedField(
  render: AsciiFieldRender,
  size = 160
): AsciiFieldRender {
  const lum = new Float32Array(size * size)
  const rgb = new Uint8ClampedArray(size * size * 4)
  let last = -1
  let lastAspect = 0
  return (t, w, h, outLum, outRgb, aspect) => {
    const q = Math.round(t * 30)
    if (q !== last || aspect !== lastAspect) {
      render(t, size, size, lum, rgb, aspect)
      last = q
      lastAspect = aspect
    }
    for (let j = 0; j < h; j++) {
      const sj = Math.min(size - 1, Math.floor(((j + 0.5) / h) * size))
      for (let i = 0; i < w; i++) {
        const si = Math.min(size - 1, Math.floor(((i + 0.5) / w) * size))
        const s = sj * size + si
        const o = j * w + i
        outLum[o] = lum[s]!
        outRgb[o * 4] = rgb[s * 4]!
        outRgb[o * 4 + 1] = rgb[s * 4 + 1]!
        outRgb[o * 4 + 2] = rgb[s * 4 + 2]!
      }
    }
  }
}

const VERT = `#version 300 es
in vec2 p;
out vec2 uv;
void main() {
  uv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`

// Composites the drawn cells over the background, then adds bloom from the
// texture's mip levels, splits red and blue, shakes bands and lays scanlines.
const FRAG = `#version 300 es
precision highp float;
uniform sampler2D tex;
uniform vec2 res;
uniform vec3 bg;
uniform float bloom, split, scan, glitch, time, dpr;
in vec2 uv;
out vec4 color;
float hash(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
void main() {
  vec2 q = uv;
  if (glitch > 0.0) {
    float burst = step(0.6, hash(floor(time * 3.0)));
    float band = floor((1.0 - q.y) * 28.0);
    float f = floor(time * 20.0);
    float on = burst * step(0.72, hash(band + f * 7.0));
    q.x += on * (hash(band * 3.0 + f) - 0.5) * 0.12;
  }
  vec4 c = texture(tex, q);
  vec3 rgb = c.rgb;
  float a = c.a;
  if (split > 0.0) {
    vec2 d = vec2(split / res.x, 0.0);
    vec4 r = texture(tex, q - d);
    vec4 b = texture(tex, q + d);
    rgb = vec3(r.r, c.g, b.b);
    a = max(a, max(r.a, b.a));
  }
  vec3 o = bg * (1.0 - a) + rgb;
  if (bloom > 0.0) {
    vec3 g = textureLod(tex, q, 1.5).rgb * 0.35
      + textureLod(tex, q, 3.0).rgb * 0.5
      + textureLod(tex, q, 4.5).rgb * 0.7
      + textureLod(tex, q, 6.0).rgb * 0.6;
    o += g * bloom;
  }
  if (scan > 0.0) {
    float line = step(0.66, fract(gl_FragCoord.y / (3.0 * dpr)));
    o *= 1.0 - 0.28 * line * scan;
  }
  color = vec4(o, 1.0);
}`

type PostParams = {
  bg: Rgb
  bloom: number
  split: number
  scanlines: number
  glitch: number
  time: number
  dpr: number
}

function createPost(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false })
  if (!gl) return null
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    return sh
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  gl.useProgram(prog)
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  )
  const loc = gl.getAttribLocation(prog, "p")
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  const u = (n: string) => gl.getUniformLocation(prog, n)
  const U = {
    res: u("res"),
    bg: u("bg"),
    bloom: u("bloom"),
    split: u("split"),
    scan: u("scan"),
    glitch: u("glitch"),
    time: u("time"),
    dpr: u("dpr"),
  }
  return {
    draw(source: HTMLCanvasElement, p: PostParams) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source
      )
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.uniform2f(U.res, canvas.width, canvas.height)
      gl.uniform3f(U.bg, p.bg[0] / 255, p.bg[1] / 255, p.bg[2] / 255)
      gl.uniform1f(U.bloom, p.bloom)
      gl.uniform1f(U.split, p.split)
      gl.uniform1f(U.scan, p.scanlines)
      gl.uniform1f(U.glitch, p.glitch)
      gl.uniform1f(U.time, p.time)
      gl.uniform1f(U.dpr, p.dpr)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
    dispose() {
      gl.deleteTexture(tex)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
    },
  }
}

function fieldHash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
}

/**
 * A line of text as a field, shaded by a slow wave with a little grain; with
 * `glitch`, bands of it shake now and then. Color it with `color`.
 */
export function textField(
  text: string,
  { glitch = false, weight = 700 }: { glitch?: boolean; weight?: number } = {}
): AsciiFieldRender {
  let mask: Float32Array | null = null
  let key = ""
  return (t, w, h, lum, rgb, aspect) => {
    if (!mask || key !== `${w}x${h}x${aspect}`) {
      const c = document.createElement("canvas")
      c.width = w
      c.height = h
      const g = c.getContext("2d", { willReadFrequently: true })!
      g.fillStyle = "#000"
      g.fillRect(0, 0, w, h)
      g.fillStyle = "#fff"
      g.textAlign = "center"
      g.textBaseline = "middle"
      // A grid cell is narrower than it is tall, so draw the text stretched
      // across by the inverse of that shape to keep its proportions on screen.
      const cellShape = Math.max(0.1, (aspect * h) / w)
      g.font = `${weight} ${Math.round(h * 0.7)}px ui-monospace, monospace`
      const fit = Math.min(1, (w * 0.9 * cellShape) / g.measureText(text).width)
      g.font = `${weight} ${Math.round(h * 0.7 * fit)}px ui-monospace, monospace`
      g.setTransform(1 / cellShape, 0, 0, 1, w / 2, h / 2)
      g.fillText(text, 0, 0)
      const d = g.getImageData(0, 0, w, h).data
      mask = new Float32Array(w * h)
      for (let k = 0; k < mask.length; k++) mask[k] = d[k * 4]! / 255
      key = `${w}x${h}x${aspect}`
    }
    const frame = Math.floor(t * 12)
    const burst = glitch && fieldHash(Math.floor(t * 2)) > 0.55
    for (let j = 0; j < h; j++) {
      const band = Math.floor(j / Math.max(2, h / 12))
      const shift =
        burst && fieldHash(band * 13 + frame) > 0.7
          ? Math.round((fieldHash(band + frame * 7) - 0.5) * w * 0.12)
          : 0
      for (let i = 0; i < w; i++) {
        const m = mask[j * w + Math.min(w - 1, Math.max(0, i + shift))]
        const wave = 0.6 + 0.4 * Math.sin(i * (12 / w) - t * 2 + j * (4 / h))
        const grain = fieldHash(i * 31 + j * 57 + frame) * 0.12
        const v = m! > 0.5 ? Math.min(1, wave + grain) : grain * 0.25
        const o = j * w + i
        lum[o] = v
        rgb[o * 4] = rgb[o * 4 + 1] = rgb[o * 4 + 2] = 255 * v
      }
    }
  }
}
