import { cn } from "@workspace/ui/lib/utils"
import { column, enterRow, page } from "@workspace/ui/lib/layout"

import { Hero, HeroTitle } from "@/components/hero"
import { ProjectsJsonLd } from "@/components/json-ld"
import { ProjectList } from "@/components/project-list"
import { ProjectWindow } from "@/components/project-window"
import { Showcase } from "@/components/showcase"
import { PROJECT } from "@/lib/copy"
import { projects } from "@/lib/projects"
import { pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({ title: PROJECT.title, path: "/project" })

export const dynamic = "force-static"

export default function ProjectPage() {
  return (
    // The picture keeps the capture's aspect ratio at every viewport size.
    // Below lg the page is one column: title, window, list; the left
    // column's box is gone there (`contents`) and `order` puts the window
    // between its two children. From lg the title and the list are the left
    // column and scroll with the page, while the window stays in the middle
    // of the screen: its cell is as tall as the screen, sticks to the top,
    // and centres the window. The negative margins take back the page's own
    // top and bottom space, so the cell starts at the screen's top edge and
    // adds no scroll of its own.
    <main
      className={cn(column, page, "flex flex-1 flex-col lg:flex-row lg:gap-10")}
    >
      <ProjectsJsonLd projects={projects} />
      <Showcase projects={projects}>
        <div className="contents lg:block lg:w-52 lg:shrink-0">
          <Hero
            className="order-1"
            title={<HeroTitle text={PROJECT.title} />}
            subtitle={
              <span className="text-caption">projects {projects.length}</span>
            }
          />
          <ProjectList className="order-3 mt-5 lg:mt-10" />
        </div>
        <div className="order-2 mt-10 lg:sticky lg:top-0 lg:-mt-30 lg:-mb-25 lg:flex lg:h-screen-inner lg:min-w-0 lg:flex-1 lg:items-center lg:self-start">
          <ProjectWindow className={cn("w-full", enterRow(2))} />
        </div>
      </Showcase>
    </main>
  )
}
