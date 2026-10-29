"use client";

import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={220} skipDelayDuration={120}>
      {children}
      <Toaster
        position="bottom-right"
        offset={20}
        gap={10}
        theme="light"
        toastOptions={{
          style: {
            background: "#FCFBF7",
            border: "1px solid #E5E0D5",
            color: "#1B1D18",
            fontFamily: "var(--font-sans)",
            borderRadius: "12px",
            boxShadow:
              "0 2px 8px rgba(21,21,19,0.06), 0 16px 40px -12px rgba(21,21,19,0.2)",
            fontSize: "13px",
          },
          classNames: {
            description: "!text-[#6F7268]",
            actionButton: "!bg-[#1B1D18] !text-white",
          },
        }}
      />
    </TooltipProvider>
  );
}
