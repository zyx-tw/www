"use client";

import { useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";
import { cn } from "@workspace/ui/lib/utils";

// A command people paste into a terminal. One click copies it; the tip says
// "Copy", then "Copied".
export function CopyCommand({
  command,
  className,
}: {
  command: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Tooltip>
      <TooltipTrigger
        closeOnClick={false}
        render={
          <button
            type="button"
            onClick={copy}
            aria-label={`Copy ${command}`}
            className={cn(
              "cursor-pointer text-left font-mono text-caption wrap-break-word transition-colors duration-state hover:text-foreground",
              className
            )}
          />
        }
      >
        {command}
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied" : "Copy"}</TooltipContent>
    </Tooltip>
  );
}
