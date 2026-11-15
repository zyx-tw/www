/**
 * Page copy that is not in the shared profile (packages/ui/src/lib/profile.ts),
 * lib/resume.ts or lib/projects.json, so every page and its Markdown twin read
 * one string.
 */
export const HOME = { title: "Loki, 詹詠翔." } as const

export const PROJECT = { title: "Project" } as const

export const MAP = {
  title: "地圖",
  planned: "規劃中",
  after: "先讀",
  systems: "星系",
  notes: "文章",
  length: "字",
  minutes: "分鐘",
  updated: "更新",
  log: "紀錄",
  changes: "版本紀錄",
  next: "接著讀",
  back: "回到",
} as const

export const INFO = { title: "Info" } as const

export const NOT_FOUND = {
  title: "Signal lost.",
  lead: "These pages exist:",
  agents: "For agents",
  llms: "what this site is and how an agent should read it",
  twin: "as Markdown",
} as const
