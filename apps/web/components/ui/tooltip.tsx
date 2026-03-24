import * as React from "react";

import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  children: React.ReactNode;
}

const Tooltip = React.forwardRef<
  HTMLDivElement,
  TooltipProps
>(({ content, side = "right", children }, ref) => {
  return (
    <div ref={ref} className="group/tip relative inline-flex">
      {children}
      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 hidden rounded-lg bg-slate-900 px-3 py-2.5 text-xs text-white shadow-lg border border-slate-700 group-hover/tip:block max-w-xs",
          side === "right" && "left-full top-1/2 ml-3 -translate-y-1/2",
          side === "left" && "right-full top-1/2 mr-3 -translate-y-1/2",
          side === "top" && "bottom-full left-1/2 mb-3 -translate-x-1/2",
          side === "bottom" && "left-1/2 top-full mt-3 -translate-x-1/2"
        )}
      >
        <p className="leading-snug">{content}</p>
        {/* Arrow */}
        <div
          className={cn(
            "absolute h-2 w-2 bg-slate-900 border border-slate-700",
            side === "right" && "right-full top-1/2 -mr-1 -translate-y-1/2 rotate-45",
            side === "left" && "left-full top-1/2 -ml-1 -translate-y-1/2 rotate-45",
            side === "top" && "bottom-full left-1/2 -mb-1 -translate-x-1/2 rotate-45",
            side === "bottom" && "top-full left-1/2 -mt-1 -translate-x-1/2 rotate-45"
          )}
        />
      </div>
    </div>
  );
});

Tooltip.displayName = "Tooltip";

export { Tooltip };
