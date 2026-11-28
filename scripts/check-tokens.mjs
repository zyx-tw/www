// Everything visual must come from the base tokens (DESIGN.md in zyx-tw/ui). This
// rejects the ways around them: sizes outside text-display / title / body /
// caption, a radius outside the tokens, removed color tokens, Tailwind
// palette colors, color literals, inline styles, raw font sizes, arbitrary
// values and stray durations. Page code (outside components/ui)
// also may not draw layer-2 surfaces.
import { readdir, readFile } from "node:fs/promises"
import { join, relative } from "node:path"

const root = new URL("..", import.meta.url).pathname
const scanned = ["app", "components", "hooks", "lib", "styles"]
const skippedDirs = new Set([
  "node_modules",
  ".next",
  "out",
  "public",
  ".turbo",
  "fonts",
  // lib/3d is a copy of the Plump renderer (zyx-tw/plump): scene colors,
  // not page chrome.
  "3d",
])

// Files that render content rather than chrome, each with its reason. A
// rule is waived only for the file named here, never for a directory.
const exempt = {
  // The stylesheet defines the tokens themselves.
  "styles/globals.css": "all",
  // Open Graph images render through Satori, which takes inline styles and
  // literal colors, not Tailwind classes or CSS variables.
  "components/og-image.tsx": "all",
  // The GitHub contribution grid is data: one character per day, laid out by
  // inline grid columns and set at the size that makes a week one column.
  "components/status.tsx": ["inline style", "arbitrary value", "raw font size"],
  // The 3D stage's background comes from the exported scene, at runtime.
  "app/page.tsx": ["inline style"],
  "app/layout.tsx": ["inline style"],
  // The works window draws each screenshot as characters in the
  // screenshot's own colors.
  "lib/ascii-preview.ts": ["color literal"],
  // The phone's folded nav opens as a floating panel over the page, a layer
  // like a popover, so it takes the window's border and shadow.
  "components/corner-tip.tsx": [
    "shadow on a page",
    "frame on a page (use spacing or border-t / border-b)",
  ],
  // The home mark's weekday colors are content: the mark is a picture.
  "components/home-mark.tsx": ["color literal"],
  // The device room is content: pixel pictures set where the page places
  // them, links in the colors of the blocks they stand for, and labels drawn
  // in an SVG sized in pixels.
  "components/device-room.tsx": [
    "inline style",
    "color literal",
    "raw font size",
  ],
  "lib/room.ts": ["color literal"],
  // ASCII redraws a picture in its own colors on a canvas, and its shader
  // and gradients take color values at runtime.
  "components/ascii.tsx": ["color literal", "inline style"],
  // Glyph charts color each cell by its value (color-mix of the data hues)
  // and measure a cell with an off-screen probe.
  "components/glyph-chart.tsx": ["inline style"],
  // The map is content: a cockpit display in the color of its phosphor.
  "lib/map-palette.ts": ["color literal"],
}

const palette =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white"
const colorUtilities =
  "bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|divide|placeholder|caret|accent|shadow"

const classRules = [
  {
    name: "size outside the scale",
    regex: /\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b/g,
  },
  // Arbitrary values such as rounded-[10px]; arbitrary variants such as
  // data-[state=open]: or group-data-[state=open]/name: end in ":" or "/"
  // and stay allowed.
  {
    name: "arbitrary value",
    regex: /(?<![\w-])-?[a-z][\w-]*-\[[^\]\s]+\](?![:/\]])/g,
  },
  // One corner radius (DESIGN.md in zyx-tw/ui, Corners): control on every
  // box, inner for a row inside a window and the checkbox, full for pills, or
  // none to clear a library's radius.
  {
    name: "radius (use rounded-control, rounded-inner or rounded-full)",
    regex:
      /\brounded(?:-(?:t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee))?(?!-(?:none|inner|control|full)\b)(?:-[\w-]+)?(?![\w-])/g,
  },
  {
    name: "palette color",
    regex: new RegExp(`\\b(?:${colorUtilities})-(?:${palette})\\b`, "g"),
  },
  // secondary, accent, card and popover duplicated other colors, charts use
  // the existing colors, and there is no sidebar in the two-layer model.
  {
    name: "removed color token",
    regex:
      /(?:\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|divide|shadow|decoration|placeholder|caret)-|--color-|var\(--)(?:secondary|accent|card|popover|sidebar|chart)(?![\w])(?:-[\w-]+)?/g,
  },
  // Motion is duration-state and duration-overlay (DESIGN.md, Motion);
  // page entrances use tw-animate-css, whose own durations stay allowed.
  { name: "stray duration", regex: /(?<![\w-])(?:duration|delay)-\d+\b/g },
]

const sourceRules = [
  {
    name: "color literal",
    regex: /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/g,
  },
  { name: "inline style", regex: /\bstyle=\{/g },
  {
    name: "radius literal (use a radius token)",
    regex: /\bborder-radius\s*:(?!\s*(?:0\b|inherit\b|var\(--radius))/g,
  },
  // CSS may only name the scale: font-size: var(--text-body).
  {
    name: "raw font size",
    regex:
      /\bfont-size\s*:(?!\s*var\(--text-(?:display|title|body|caption)\))|\bfontSize\b/g,
  },
]

// Layer 1 (the page) groups by spacing and dividers only.
const pageRules = [
  { name: "shadow on a page", regex: /(?<![\w-])shadow(?:-[\w/]+)?(?![\w-])/g },
  {
    name: "frame on a page (use spacing or border-t / border-b)",
    regex: /(?<![\w-])border(?:-[xy])?(?![\w-])/g,
  },
]

const componentRoot = "components/ui/"

async function* files(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (skippedDirs.has(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* files(path)
    else if (/\.(tsx?|css)$/.test(entry.name) && !entry.name.endsWith(".d.ts"))
      yield path
  }
}

let failures = 0
for (const dir of scanned) {
  for await (const path of files(join(root, dir))) {
    const file = relative(root, path)
    const waived = exempt[file]
    if (waived === "all") continue
    const isComponent = file.startsWith(componentRoot)
    const rules = [
      ...classRules,
      ...sourceRules,
      ...(isComponent || !file.endsWith(".tsx") ? [] : pageRules),
    ].filter(({ name }) => !waived?.includes(name))
    const lines = (await readFile(path, "utf8")).split("\n")
    lines.forEach((line, index) => {
      if (/^\s*(?:\/\/|\*|\/\*)/.test(line)) return
      for (const { name, regex } of rules) {
        for (const match of line.matchAll(regex)) {
          console.error(`${file}:${index + 1}: ${name}: ${match[0]}`)
          failures++
        }
      }
    })
  }
}

if (failures) {
  console.error(`\n${failures} uses outside the tokens`)
  process.exit(1)
}
console.log("everything uses the tokens")
