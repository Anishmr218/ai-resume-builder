"use client";

import { CheckCircle2, ChevronDown } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  value: string;
  title: string;
  summary: string;
  icon: React.ReactNode;
  complete?: boolean;
  children: React.ReactNode;
}

export function SectionCard({
  value,
  title,
  summary,
  icon,
  complete = false,
  children,
}: SectionCardProps) {
  return (
    <AccordionItem value={value} className="bg-surface">
      <AccordionTrigger>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
            complete
              ? "border-accent/12 bg-accent-soft text-accent"
              : "border-line bg-[#F5F1E8] text-ink-quiet",
          )}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="flex items-center gap-1.5">
            <span className="text-[12.5px] font-semibold tracking-[-0.005em] text-ink">
              {title}
            </span>
            {complete ? (
              <CheckCircle2
                className="h-3 w-3 text-accent/80"
                aria-label="Section has content"
              />
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-[10.5px] font-normal text-ink-quiet">
            {summary}
          </span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-ink-quiet transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}
