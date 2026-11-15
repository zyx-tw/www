/**
 * Page copy that is not in the shared profile (packages/ui/src/lib/profile.ts),
 * lib/resume.ts or lib/projects.json, so every page and its Markdown twin read
 * one string.
 */
export const HOME = { title: "Loki, 詹詠翔." } as const

export const WORKS = { title: "Works" } as const

export const MAP = {
  title: "地圖",
  planned: "規劃中",
  after: "先讀",
  system: "星系",
  note: "文章",
  course: "課程",
  position: "座標",
  bearing: "方位",
  distance: "距離",
  bodies: "天體",
  orbit: "軌道",
  radius: "半徑",
  angle: "角度",
  systems: "星系",
  notes: "文章",
  courses: "課程",
} as const

export const ABOUT = { title: "About" } as const

export const NOT_FOUND = {
  title: "Not found.",
  lead: "These pages exist:",
  agents: "For agents",
  llms: "what this site is and how an agent should read it",
  twin: "as Markdown",
} as const
