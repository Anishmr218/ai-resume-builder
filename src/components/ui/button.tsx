import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-[#FBFAF5] shadow-[0_1px_2px_rgba(20,20,16,0.18)] hover:bg-[#2A2C26]",
        secondary:
          "border border-line bg-surface text-ink shadow-[0_1px_1px_rgba(20,20,16,0.03)] hover:border-ink/15 hover:bg-cream",
        outline:
          "border border-ink/15 bg-transparent text-ink hover:bg-black/[0.035]",
        ghost:
          "text-ink-soft hover:bg-black/[0.045] hover:text-ink",
        subtle:
          "bg-cream text-ink-soft hover:bg-[#EFEAE0] hover:text-ink",
        destructive:
          "bg-[#943E37] text-white shadow-sm hover:bg-[#82352F] focus-visible:ring-[#943E37]/30",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 rounded-md px-3 text-[12.5px]",
        lg: "h-11 px-5 text-sm",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
