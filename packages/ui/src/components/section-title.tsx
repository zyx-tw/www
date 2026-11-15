import { cn } from "../lib/utils"

/**
 * A section's heading in brackets and capitals, as the corner nav marks the
 * current page. The brackets are decoration; screen readers hear the title.
 * Ligatures are off: Maple Mono draws "[INFO]" and "[NOTE]" as badges.
 */
export function SectionTitle({
  id,
  title,
  className,
}: {
  id?: string
  title: string
  className?: string
}) {
  return (
    <h2
      id={id}
      data-slot="section-title"
      className={cn(
        "text-body font-medium uppercase [font-variant-ligatures:none]",
        className
      )}
    >
      <span aria-hidden="true">[</span>
      {title}
      <span aria-hidden="true">]</span>
    </h2>
  )
}
