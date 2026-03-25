import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: string | React.ReactNode;
  side?: "top" | "right" | "bottom" | "left" | "auto";
  children: React.ReactNode;
  delayMs?: number;
  maxWidth?: number;
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, side = "top", children, delayMs = 200, maxWidth = 240 }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [adjustedSide, setAdjustedSide] = React.useState<"top" | "right" | "bottom" | "left">(side === "auto" ? "top" : side);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const triggerRef = React.useRef<HTMLDivElement>(null);
    const tooltipRef = React.useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        // Calculate best position if auto
        if (side === "auto" && triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const spaceTop = rect.top;
          const spaceBottom = window.innerHeight - rect.bottom;
          const spaceLeft = rect.left;
          const spaceRight = window.innerWidth - rect.right;

          // Prefer: bottom > top > right > left
          if (spaceBottom > 200) setAdjustedSide("bottom");
          else if (spaceTop > 200) setAdjustedSide("top");
          else if (spaceRight > 280) setAdjustedSide("right");
          else setAdjustedSide("left");
        }
      }, delayMs);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsVisible(false);
    };

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    const positionClass = cn(
      "absolute pointer-events-none z-50 opacity-0 transition-opacity duration-150",
      isVisible && "opacity-100 pointer-events-auto",
      adjustedSide === "top" && "bottom-full left-1/2 mb-3 -translate-x-1/2",
      adjustedSide === "bottom" && "top-full left-1/2 mt-3 -translate-x-1/2",
      adjustedSide === "left" && "right-full top-1/2 mr-3 -translate-y-1/2",
      adjustedSide === "right" && "left-full top-1/2 ml-3 -translate-y-1/2"
    );

    const arrowClass = cn(
      "absolute h-2 w-2 bg-slate-950 dark:bg-slate-100",
      adjustedSide === "top" && "bottom-full left-1/2 -mb-1 -translate-x-1/2 rotate-45",
      adjustedSide === "bottom" && "top-full left-1/2 -mt-1 -translate-x-1/2 rotate-45",
      adjustedSide === "left" && "left-full top-1/2 -ml-1 -translate-y-1/2 rotate-45",
      adjustedSide === "right" && "right-full top-1/2 -mr-1 -translate-y-1/2 rotate-45"
    );

    return (
      <div
        ref={ref}
        className="relative inline-flex"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div ref={triggerRef}>{children}</div>
        {isVisible && (
          <div
            ref={tooltipRef}
            role="tooltip"
            className={cn(
              positionClass,
              "rounded-md bg-slate-950 dark:bg-slate-100 px-3 py-2 text-xs text-white dark:text-slate-950 shadow-lg border border-slate-800 dark:border-slate-200",
              "whitespace-normal break-words leading-relaxed font-medium"
            )}
            style={{ maxWidth: `${maxWidth}px` }}
          >
            {typeof content === "string" ? (
              <p>{content}</p>
            ) : (
              content
            )}
            <div className={arrowClass} />
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = "Tooltip";

export { Tooltip };
