import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-ink text-[#FBFAF5]",
        secondary: "border-line bg-cream text-ink-soft",
        outline: "border-line bg-transparent text-ink-quiet",
        accent: "border-accent/15 bg-accent-soft text-accent",
        gold: "border-[#B08A52]/20 bg-[#F5EDDD] text-[#7A5B2C]",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
