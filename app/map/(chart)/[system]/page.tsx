import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { enterRow } from "@/lib/layout"

import { MAP } from "@/lib/copy"
import { findBody, findSystem, systemPath, systems } from "@/lib/map"
import { pageMetadata } from "@/lib/site"

export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return systems.map(({ slug }) => ({ system: slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ system: string }>
}) {
  const system = findSystem((await params).system)
  if (!system) return {}
  return pageMetadata({
    title: system.name,
    path: systemPath(system),
    markdown: "/map.md",
    description: `${system.name}：${system.line}`,
  })
}

const LINK =
  "terminal-link underline decoration-muted-foreground/40 underline-offset-4"

export default async function SystemPage({
  params,
}: {
  params: Promise<{ system: string }>
}) {
  const system = findSystem((await params).system)
  if (!system) notFound()

  return (
    <ol className="mt-10 flex flex-col">
      {system.bodies.map((body, index) => (
        <li
          key={body.slug}
          id={body.slug}
          className={cn("flex gap-x-3 border-b py-3", enterRow(4 + index))}
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-x-5">
              {body.href ? (
                <Link href={body.href} className={LINK}>
                  {body.name}
                </Link>
              ) : (
                <span>{body.name}</span>
              )}
              {!body.href && <Badge variant="muted">{MAP.planned}</Badge>}
            </div>
            <p className="text-muted-foreground">
              {MAP.kinds[body.kind]} L{body.level}　{body.line}
            </p>
            {body.requires && (
              <p className="text-muted-foreground">
                {MAP.after}{" "}
                {body.requires.map((slug, at) => {
                  const found = findBody(slug)
                  if (!found) return null
                  return (
                    <span key={slug}>
                      {at > 0 && "、"}
                      <Link
                        href={`${systemPath(found.system)}#${slug}`}
                        className={LINK}
                      >
                        {found.body.name}
                      </Link>
                    </span>
                  )
                })}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
