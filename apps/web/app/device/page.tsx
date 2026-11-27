import { cn } from "@workspace/ui/lib/utils"
import { page } from "@workspace/ui/lib/layout"

import { DeviceRoom } from "@/components/device-room"
import { Hero, HeroTitle } from "@/components/hero"
import { DEVICE } from "@/lib/copy"
import { DEVICES } from "@/lib/room"
import { pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({ title: DEVICE.title, path: "/device" })

export const dynamic = "force-static"

export default function DevicePage() {
  return (
    // One screen tall: the room fills what the title and the rows leave.
    <main
      className={cn(
        page,
        "mx-auto flex h-screen-inner w-full flex-col gap-6 px-(--gutter) md:flex-row md:gap-10 2xl:max-w-screen-2xl"
      )}
    >
      <DeviceRoom
        hero={
          <Hero
            title={<HeroTitle text={DEVICE.title} />}
            subtitle={
              <span className="text-caption">devices {DEVICES.length}</span>
            }
          />
        }
      />
    </main>
  )
}
