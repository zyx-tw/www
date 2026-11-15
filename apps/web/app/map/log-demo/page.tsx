import { SectionTitle } from "@workspace/ui/components/section-title"
import { cn } from "@workspace/ui/lib/utils"
import { column, enterRow, page } from "@workspace/ui/lib/layout"

import { Hero, HeroTitle } from "@/components/hero"
import { ProjectDiagram } from "@/components/project-diagram"
import { Rows } from "@/components/rows"
import { findNote } from "@/lib/notes"
import type { Diagram } from "@/lib/projects"

export const dynamic = "force-static"
export const metadata = { robots: { index: false } }

/*
 * A demo for one decision: the first note again, written as a ship's log.
 * Short lines, one fact each, in fixed blocks. Delete this page once the
 * voice of the notes is chosen.
 */

const HEAD = [
  { label: "紀錄", value: "001" },
  { label: "紀錄員", value: "zyx" },
  { label: "日期", value: "2026-11-15" },
  { label: "版本", value: "1.0.0" },
  { label: "狀態", value: "有效" },
]

const BLOCKS: { title: string; lines: string[]; figure?: number }[] = [
  {
    title: "狀況",
    lines: [
      "我把 Claude Code 當成終端機裡的 ChatGPT。",
      "我問問題。它回答。我複製，貼上。",
    ],
  },
  {
    title: "觀察",
    lines: [
      "測試失敗 1 次。我來回貼錯誤訊息 5 到 6 趟。",
      "聊天機器人看不到專案。它只看得到我貼的那一段。",
      "動手的是我。",
    ],
  },
  {
    title: "處置",
    lines: [
      "改用 1 句指令：「測試壞了，修好它。」",
      "Claude Code 跑測試。讀錯誤。開檔案。改檔案。再跑測試。",
      "測試全過，它才回報。",
      "這個循環叫 agent loop。",
    ],
    figure: 1,
  },
  {
    title: "量測",
    lines: [
      "期間：2026-10-16 到 2026-11-15，共 30 天。",
      "我的訊息：約 4,300 則。",
      "它的動作：84,820 次。",
      "比例：我講 1 句，它做 20 個動作。",
    ],
    figure: 2,
  },
  {
    title: "常規",
    lines: [
      "給路，不貼內容。說「看部署的 log」，不貼 200 行 log。",
      "講怎樣算完成。說「測試全過才算好」。",
      "收不回來的事，先問我。刪檔案、寄信、對外送出。",
    ],
  },
  {
    title: "下一筆",
    lines: ["紀錄 002：我只在家目錄開 Claude Code。"],
  },
]

export default function LogDemo() {
  const note = findNote("what-claude-code-is")!
  const figure = (at: number) => note.sections[at]!.figure as Diagram

  return (
    <main lang="zh-Hant" className={cn(column, page, "flex-1")}>
      <Hero
        title={<HeroTitle text="Claude Code 不是聊天機器人" />}
        subtitle="航行紀錄"
        className="pb-10"
      />
      <Rows rows={HEAD} className={enterRow(3)} />

      {BLOCKS.map((block, index) => (
        <section
          key={block.title}
          aria-labelledby={`block-${index}`}
          className={cn("mt-15", enterRow(4))}
        >
          <SectionTitle id={`block-${index}`} title={block.title} />
          <ol className="mt-5 flex max-w-2xl flex-col gap-y-2">
            {block.lines.map((line, at) => (
              <li key={at} className="flex gap-x-5">
                <span className="text-muted-foreground tabular-nums">
                  {String(at + 1).padStart(2, "0")}
                </span>
                <span className="text-pretty">{line}</span>
              </li>
            ))}
          </ol>
          {block.figure !== undefined && (
            <ProjectDiagram diagram={figure(block.figure)} className="mt-10" />
          )}
        </section>
      ))}
    </main>
  )
}
