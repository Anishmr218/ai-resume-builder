import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "h-10 w-full rounded-lg border border-line bg-[#FCFBF7] px-3 text-[13px] text-ink shadow-[inset_0_1px_0_rgba(20,20,16,0.02)] outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-ink-quiet/55 hover:border-ink/20 focus:border-ink/35 focus:bg-white focus:ring-[3px] focus:ring-ink/[0.06] disabled:cursor-not-allowed disabled:opacity-60",
          "[color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-45 [&::-webkit-calendar-picker-indicator]:hover:opacity-80",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
