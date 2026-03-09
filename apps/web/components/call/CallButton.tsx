"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

export interface CallButtonProps extends Omit<ButtonProps, "onClick"> {
  phoneNumber: string;
  contactName: string;
  onStartCall?: (phoneNumber: string) => void;
}

const CallButton = React.forwardRef<HTMLButtonElement, CallButtonProps>(
  ({ phoneNumber, contactName, onStartCall, className, size = "icon-sm", ...props }, ref) => {
    return (
      <Tooltip content={`Llamar a ${contactName}`} side="top">
        <Button
          ref={ref}
          variant="ghost"
          size={size}
          className={cn(
            "text-muted-foreground hover:text-success hover:bg-[var(--success-100)] transition-colors",
            className
          )}
          onClick={() => onStartCall?.(phoneNumber)}
          aria-label={`Llamar a ${contactName} al ${phoneNumber}`}
          {...props}
        >
          <i className="fa-solid fa-phone text-sm" />
        </Button>
      </Tooltip>
    );
  }
);
CallButton.displayName = "CallButton";

export { CallButton };
