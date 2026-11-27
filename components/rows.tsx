import Link from "next/link"

import { cn } from "../lib/utils"

const LINK =
  "terminal-link underline decoration-muted-foreground/40 underline-offset-4"

/**
 * Rows of a term and its line, in a fixed label column. A
 * row's link opens in a new tab unless it is a page of this site.
 */
export function Rows({
  rows,
  className,
}: {
  rows: { label: string; value: string; href?: string }[]
  className?: string
}) {
  return (
    <dl className={cn("flex flex-col gap-y-3", className)}>
      {rows.map(({ label, value, href }) => (
        <div key={label + value} className="flex gap-x-5 max-sm:flex-col">
          <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
          <dd className="min-w-0 text-pretty break-words">
            {!href ? (
              value
            ) : href.startsWith("/") ? (
              <Link href={href} className={LINK}>
                {value}
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK}
              >
                {value}
              </a>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
