import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium",
  {
    variants: {
      size: {
        sm: "h-7 w-7 text-[11px]",
        default: "h-8 w-8 text-xs",
        md: "h-9 w-9 text-xs",
        lg: "h-12 w-12 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  initials?: string;
  src?: string;
  alt?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, initials, src, alt, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(avatarVariants({ size }), className)} {...props}>
        {src ? (
          <img src={src} alt={alt ?? initials ?? ""} className="aspect-square h-full w-full object-cover" />
        ) : (
          children ?? initials
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar, avatarVariants };
