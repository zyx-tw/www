import { cn } from "../../lib/utils"

// A 3 by 3 panel of square pixels: a lit pixel runs the edge clockwise and
// leaves a fading trail, like an LED. Pure CSS (globals.css, Spinner), so it
// runs before hydration. It is decoration: put a text label beside it.
function Spinner({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="spinner"
      aria-hidden
      className={cn("grid size-4 shrink-0 grid-cols-3 gap-px", className)}
      {...props}
    >
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} className="bg-current" />
      ))}
    </span>
  )
}

export { Spinner }
