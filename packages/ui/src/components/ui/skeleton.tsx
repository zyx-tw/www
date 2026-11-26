import { cn } from "../../lib/utils"

// A placeholder of flickering pixels: a muted block under a field of 4px
// pixels that reshuffles in steps (globals.css, Skeleton). Pure CSS, so it
// shows before hydration.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("relative bg-muted/40", className)}
      {...props}
    />
  )
}

export { Skeleton }
