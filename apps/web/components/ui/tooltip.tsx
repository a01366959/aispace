import * as React from "react";

import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  children: React.ReactNode;
}

function Tooltip({ content, side = "right", children }: TooltipProps) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md group-hover:block",
          side === "right" && "left-full top-1/2 ml-2 -translate-y-1/2",
          side === "left" && "right-full top-1/2 mr-2 -translate-y-1/2",
          side === "top" && "bottom-full left-1/2 mb-2 -translate-x-1/2",
          side === "bottom" && "left-1/2 top-full mt-2 -translate-x-1/2"
        )}
      >
        {content}
      </div>
    </div>
  );
}

export { Tooltip };
