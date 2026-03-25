import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: string | React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  children: React.ReactNode;
  delayMs?: number;
  maxWidth?: number;
}

const Tooltip = React.forwardRef<
  HTMLDivElement,
  TooltipProps
>(({ content, side = "top", children, delayMs = 200, maxWidth = 240 }, ref) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
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

  // Calculate position to avoid viewport overflow
  const getPositionClass = () => {
    const baseClasses = "pointer-events-none absolute z-50 hidden group-hover/tip:block transition-opacity duration-200";
    
    return cn(
      baseClasses,
      side === "top" && "bottom-full left-1/2 mb-2 -translate-x-1/2",
      side === "bottom" && "top-full left-1/2 mt-2 -translate-x-1/2",
      side === "left" && "right-full top-1/2 mr-2 -translate-y-1/2",
      side === "right" && "left-full top-1/2 ml-2 -translate-y-1/2"
    );
  };

  const getArrowClass = () => {
    return cn(
      "absolute h-2 w-2 bg-slate-900",
      side === "top" && "bottom-full left-1/2 -mb-1 -translate-x-1/2 rotate-45",
      side === "bottom" && "top-full left-1/2 -mt-1 -translate-x-1/2 rotate-45",
      side === "left" && "left-full top-1/2 -ml-1 -translate-y-1/2 rotate-45",
      side === "right" && "right-full top-1/2 -mr-1 -translate-y-1/2 rotate-45"
    );
  };

  return (
    <div
      ref={ref}
      className="group/tip relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        ref={tooltipRef}
        role="tooltip"
        className={cn(
          "rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg border border-slate-700",
          "whitespace-normal break-words",
          getPositionClass()
        )}
        style={{ maxWidth: `${maxWidth}px` }}
      >
        {typeof content === "string" ? (
          <p className="leading-relaxed">{content}</p>
        ) : (
          content
        )}
        {/* Arrow */}
        <div className={getArrowClass()} />
      </div>
    </div>
  );
});

Tooltip.displayName = "Tooltip";

export { Tooltip };
