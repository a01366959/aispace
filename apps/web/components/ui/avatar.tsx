import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs",
        default: "h-9 w-9 text-sm",
        md: "h-10 w-10 text-sm",
        lg: "h-14 w-14 text-xl font-bold",
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
