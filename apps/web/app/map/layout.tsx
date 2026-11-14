import { cn } from "@workspace/ui/lib/utils"
import { column, page } from "@workspace/ui/lib/layout"

import { StarMap } from "@/components/star-map"

/**
 * Every page of the map: the title and the map itself, which stay while the
 * list under them changes with the page.
 */
export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <main lang="zh-Hant" className={cn(column, page, "flex flex-1 flex-col")}>
      <StarMap />
      {children}
    </main>
  )
}
