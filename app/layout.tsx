import type { Metadata } from "next"

import { cn } from "@/lib/utils"
import { attributeRootLayoutRequest } from "@/lib/otel/layout"
import { MotionProvider } from "@/components/motion-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { fontVariables } from "@/lib/fonts"

import { SiteJsonLd } from "@/components/json-ld"
import { NextPageDecode } from "@/components/page-decode-next"
import { HomeMark } from "@/components/home-mark"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { MapSky } from "@/components/map-sky"
import { TvBoot, TvStatic } from "@/components/tv"
import { systems } from "@/lib/map"
import { projects } from "@/lib/projects"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

// Only the names cross to the client header, not every project's page: a
// project's under /project, a system's and a note's under /map.
const PROJECT_NAMES = Object.fromEntries([
  ...[...projects, ...systems].map(({ slug, name }) => [slug, name]),
  // A written note's page is one step further: /map/<system>/<slug>.
  ...systems.flatMap((system) =>
    system.bodies
      .filter(({ href }) => href)
      .map(({ slug, short }) => [`${system.slug}/${slug}`, short])
  ),
])

import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Loki", url: SITE_URL }],
  creator: "Loki",
  keywords: [
    "Loki",
    "Zhan Yong Xiang",
    "詹詠翔",
    "zyx",
    "NYCU",
    "WinLab",
    "software engineer",
    "machine learning",
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Client attribution for Sensorium — see @workspace/otel/layout for why
  // this has to run here (Node.js Server Component) and not middleware.
  await attributeRootLayoutRequest()

  return (
    <html
      lang="en"
      // A stable gutter keeps the centered column from moving when a page
      // gains or loses its scrollbar. One edge only, so the left corners stay
      // 12 px from the window's edge on every page and every site.
      className={cn(
        "[scrollbar-gutter:stable] antialiased",
        fontVariables,
        "font-sans"
      )}
    >
      {/* Body text is 16px at every width, phones included. Pages fill the
          viewport so the footer sits low. */}
      <body className="flex min-h-dvh flex-col text-body">
        <TvBoot />
        <SiteJsonLd />
        <TooltipProvider>
          <MotionProvider>
            <NextPageDecode />
            <TvStatic />
            <MapSky />
            <HomeMark />
            <SiteHeader projectNames={PROJECT_NAMES} />
            {children}
            <SiteFooter />
          </MotionProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
