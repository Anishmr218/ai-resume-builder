import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "w-full resize-y rounded-lg border border-line bg-[#FCFBF7] px-3 py-2.5 text-[13px] leading-6 text-ink shadow-[inset_0_1px_0_rgba(20,20,16,0.02)] outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-ink-quiet/55 hover:border-ink/20 focus:border-ink/35 focus:bg-white focus:ring-[3px] focus:ring-ink/[0.06] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
