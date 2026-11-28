import { cn } from "@/lib/utils"

import { DeviceRoom } from "@/components/device-room"
import { DEVICE } from "@/lib/copy"
import { pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({ title: DEVICE.title, path: "/device" })

export const dynamic = "force-static"

export default function DevicePage() {
  // One screen tall, with no title: the breadcrumb names the page. The room
  // fills what the rows leave, from just under the top corners to just over
  // the bottom ones.
  return (
    <main
      className={cn(
        "mx-auto flex h-screen-inner w-full flex-col gap-6 px-(--gutter) pt-16 pb-16 md:flex-row md:gap-10 2xl:max-w-screen-2xl"
      )}
    >
      <h1 className="sr-only">{DEVICE.title}</h1>
      <DeviceRoom />
    </main>
  )
}
