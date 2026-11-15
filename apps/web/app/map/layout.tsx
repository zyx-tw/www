import { StarMap } from "@/components/star-map"

/**
 * Every page of the map: the map itself, which fills the screen and stays
 * while the page changes. The page's list holds the same places as links,
 * for a screen reader and for an agent that reads the page as text.
 */
export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <main lang="zh-Hant" className="fixed inset-0 flex flex-col">
      <StarMap />
      <div className="sr-only">{children}</div>
    </main>
  )
}
