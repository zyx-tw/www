import Link from "next/link"

import { cn } from "@/lib/utils"
import { enterRow } from "@/lib/layout"

import { MAP } from "@/lib/copy"
import { systemPath, systems } from "@/lib/map"
import { pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({ title: MAP.title, path: "/map" })

export const dynamic = "force-static"

/** Every system as a row: the same links as the stars on the map. */
export default function Map() {
  return (
    <ul className="mt-10 flex flex-col">
      {systems.map((system, index) => (
        <li
          key={system.slug}
          className={cn(
            "flex flex-wrap justify-between gap-x-5 border-b py-3",
            enterRow(4 + index)
          )}
        >
          <Link
            href={systemPath(system)}
            scroll={false}
            className="terminal-link"
          >
            {system.name}
          </Link>
          <span className="text-muted-foreground">{system.line}</span>
        </li>
      ))}
    </ul>
  )
}
