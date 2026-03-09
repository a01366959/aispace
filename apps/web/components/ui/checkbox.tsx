import * as React from "react";

import { cn } from "@/lib/utils";

function Checkbox({
  className,
  checked,
  onChange,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
        {...props}
      />
      <div
        className={cn(
          "h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-input shadow transition-colors",
          "peer-focus-visible:ring-1 peer-focus-visible:ring-ring",
          "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          className
        )}
      >
        <svg
          className={cn(
            "h-4 w-4 text-current opacity-0 transition-opacity",
            "peer-checked:opacity-100"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
  );
}

export { Checkbox };
