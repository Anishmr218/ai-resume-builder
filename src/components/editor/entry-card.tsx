"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) return items;
  next.splice(to, 0, item);
  return next;
}

interface EntryCardProps {
  eyebrow: string;
  title: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  removeTitle: string;
  removeDescription: string;
  onRemove: () => void;
  children: React.ReactNode;
}

export function EntryCard({
  eyebrow,
  title,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  removeTitle,
  removeDescription,
  onRemove,
  children,
}: EntryCardProps) {
  return (
    <div className="rounded-xl border border-line bg-[#FBF9F4]">
      <div className="flex items-center gap-2 border-b border-line/75 py-2 pl-3 pr-2">
        <div className="min-w-0 flex-1">
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-ink-quiet/80">
            {eyebrow}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] font-medium text-ink">
            {title}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-quiet transition-colors hover:bg-black/[0.05] hover:text-ink disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
            aria-label="Move entry up"
            title="Move up"
          >
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-quiet transition-colors hover:bg-black/[0.05] hover:text-ink disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
            aria-label="Move entry down"
            title="Move down"
          >
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <span className="mx-0.5 h-4 w-px bg-line" aria-hidden="true" />
          <ConfirmDialog
            title={removeTitle}
            description={removeDescription}
            confirmLabel="Remove"
            destructive
            onConfirm={onRemove}
            trigger={
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-quiet transition-colors hover:bg-[#943E37]/[0.08] hover:text-[#943E37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#943E37]/25"
                aria-label={removeTitle}
                title={removeTitle}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            }
          />
        </div>
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#D5CEC0] bg-[#FBF9F4]/60 px-4 py-5 text-center">
      <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink-quiet">
        {icon}
      </span>
      <p className="mt-2.5 text-[12px] font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-[280px] text-[10.5px] leading-5 text-ink-quiet">
        {description}
      </p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function AddEntryButton({
  onClick,
  children,
  disabled,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#CFC8BA] bg-transparent text-[11.5px] font-medium text-ink-soft transition-colors hover:border-ink/25 hover:bg-black/[0.025] hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/15",
        className,
      )}
    >
      {children}
    </button>
  );
}
