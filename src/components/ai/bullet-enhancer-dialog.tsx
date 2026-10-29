"use client";

import * as React from "react";
import { ArrowRight, Check, RotateCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client/api";
import { aiErrorMessage } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  AiDialogMark,
  AiErrorCallout,
  AiFootnote,
  AiWorking,
} from "@/components/ai/ai-shared";

type Status = "idle" | "loading" | "ready" | "error";

const VARIATION_LABELS = ["Leadership & impact", "Efficiency & process", "Growth & collaboration"];

interface BulletEnhancerDialogProps {
  bullets: string[];
  targetTitle: string;
  onApply: (variation: string, sourceIndex: number | null) => void;
}

export function BulletEnhancerDialog({
  bullets,
  targetTitle,
  onApply,
}: BulletEnhancerDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [title, setTitle] = React.useState(targetTitle);
  const [sourceIndex, setSourceIndex] = React.useState<number | null>(null);
  const [options, setOptions] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState(0);
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const requestRef = React.useRef(0);
  const autoRunRef = React.useRef(false);

  const availableBullets = React.useMemo(
    () =>
      bullets
        .map((text, index) => ({ text: text.trim(), index }))
        .filter((item) => item.text),
    [bullets],
  );

  const runEnhance = React.useCallback(
    async (bulletText: string, titleValue: string) => {
      const cleaned = bulletText.trim();
      if (cleaned.length < 8) {
        setStatus("error");
        setError("Add a longer draft bullet first — at least 8 characters.");
        return;
      }

      const requestId = ++requestRef.current;
      setStatus("loading");
      setError(null);
      setOptions([]);

      try {
        const data = await api.enhanceBullet({
          bullet: cleaned.slice(0, 600),
          targetTitle: titleValue.trim() || undefined,
        });
        if (requestRef.current !== requestId) return;
        setOptions(data.variations);
        setSelected(0);
        setStatus("ready");
      } catch (caught) {
        if (requestRef.current !== requestId) return;
        setError(aiErrorMessage(caught));
        setStatus("error");
      }
    },
    [],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      requestRef.current += 1;
      setOpen(false);
      return;
    }

    const first = availableBullets[0] ?? null;
    autoRunRef.current = false;
    setDraft(first?.text ?? "");
    setSourceIndex(first?.index ?? null);
    setTitle(targetTitle);
    setOptions([]);
    setSelected(0);
    setError(null);
    setStatus("idle");
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) {
      autoRunRef.current = false;
      return;
    }
    if (autoRunRef.current) return;
    autoRunRef.current = true;
    if (draft.trim().length >= 8) {
      void runEnhance(draft, title);
    }
  }, [open, draft, title, runEnhance]);

  const selectSource = (index: number, text: string) => {
    setSourceIndex(index);
    setDraft(text);
    void runEnhance(text, title);
  };

  const applySelected = () => {
    const variation = options[selected];
    if (!variation) return;
    onApply(variation, sourceIndex);
    setOpen(false);
    toast.success("Bullet updated", {
      description:
        "Review the new wording and verify any illustrative metrics before you send it.",
    });
  };

  const selectedOption = options[selected] ?? null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 gap-1.5 rounded-md border-accent/20 bg-accent-soft/55 px-2.5 text-[10.5px] font-semibold text-accent shadow-none hover:border-accent/30 hover:bg-accent-soft"
        >
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Enhance with AI
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[620px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <AiDialogMark />
            <div className="min-w-0">
              <DialogTitle>Enhance a bullet</DialogTitle>
              <DialogDescription className="mt-1 text-[11.5px] leading-5">
                Three sharper, ATS-friendly ways to frame this achievement.
                Choose one, then edit it in place.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {availableBullets.length > 1 ? (
          <div className="mb-3">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-quiet">
              Pick a bullet
            </p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Bullets in this role">
              {availableBullets.map((item, bulletPosition) => (
                <button
                  key={`${item.index}-${item.text.slice(0, 12)}`}
                  type="button"
                  onClick={() => selectSource(item.index, item.text)}
                  aria-pressed={sourceIndex === item.index}
                  className={cn(
                    "max-w-full truncate rounded-md border px-2 py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20",
                    sourceIndex === item.index
                      ? "border-accent/25 bg-accent-soft text-accent"
                      : "border-line bg-[#FBF9F4] text-ink-quiet hover:border-ink/15 hover:text-ink",
                  )}
                  title={item.text}
                >
                  Bullet {bulletPosition + 1}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.11em] text-ink-quiet">
              Draft bullet
            </span>
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, 600))}
              placeholder="Led a redesign that improved activation…"
              rows={3}
              maxLength={600}
              aria-label="Draft bullet"
              className="min-h-[82px] text-[12px] leading-5"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.11em] text-ink-quiet">
              Target title <span className="normal-case tracking-normal text-ink-quiet/60">optional</span>
            </span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Senior Product Designer"
              maxLength={160}
              aria-label="Target job title"
              className="h-[38px] text-[12px]"
            />
            <p className="mt-1.5 text-[9.5px] leading-4 text-ink-quiet">
              Helps Groq mirror the right keywords.
            </p>
          </label>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[9.5px] text-ink-quiet">
            {draft.trim().length < 8 ? "At least 8 characters" : `${draft.trim().split(/\s+/).length} words in draft`}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void runEnhance(draft, title)}
            disabled={status === "loading" || draft.trim().length < 8}
            className="h-8"
          >
            {status === "loading" ? (
              <>
                <Spinner className="h-3.5 w-3.5" />
                Enhancing…
              </>
            ) : options.length > 0 ? (
              <>
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                Generate variations
              </>
            )}
          </Button>
        </div>

        <div className="mt-4" aria-live="polite">
          {error ? (
            <AiErrorCallout
              message={error}
              onRetry={
                draft.trim().length >= 8
                  ? () => void runEnhance(draft, title)
                  : undefined
              }
              retrying={status === "loading"}
            />
          ) : status === "loading" ? (
            <AiWorking label="Drafting three variations with Groq…" rows={3} />
          ) : options.length > 0 ? (
            <div
              className="space-y-2"
              role="radiogroup"
              aria-label="AI bullet variations"
            >
              {options.map((option, index) => {
                const active = selected === index;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelected(index)}
                    className={cn(
                      "group w-full rounded-xl border px-3.5 py-3 text-left transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20",
                      active
                        ? "border-accent/35 bg-accent-soft/55 shadow-[inset_0_0_0_1px_rgba(31,81,62,0.05)]"
                        : "border-line bg-[#FCFBF7] hover:border-ink/15 hover:bg-white",
                    )}
                  >
                    <span className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold transition-colors",
                          active
                            ? "border-accent bg-accent text-white"
                            : "border-line bg-surface text-ink-quiet",
                        )}
                        aria-hidden="true"
                      >
                        {active ? <Check className="h-3 w-3" /> : String.fromCharCode(65 + index)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] leading-[1.65] text-ink">
                          {option}
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-medium uppercase tracking-[0.08em] text-ink-quiet">
                          <span>{VARIATION_LABELS[index] ?? `Option ${index + 1}`}</span>
                          <span className="h-0.5 w-0.5 rounded-full bg-ink-quiet/40" aria-hidden="true" />
                          <span>{option.trim().split(/\s+/).length} words</span>
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-[#FBF9F4] px-4 py-5 text-center">
              <p className="text-[11.5px] font-semibold text-ink">
                {draft.trim() ? "Ready when you are" : "Write a draft bullet first"}
              </p>
              <p className="mx-auto mt-1 max-w-[340px] text-[10.5px] leading-4 text-ink-quiet">
                {draft.trim()
                  ? "Generate three variations, then pick the one that sounds most like you."
                  : "You can paste a rough line here, or close this and add a bullet in the editor."}
              </p>
            </div>
          )}
        </div>

        <AiFootnote>
          Groq may suggest illustrative metrics when the source has none. Verify
          every number, tool, and claim before using it.
        </AiFootnote>

        <DialogFooter className="mt-4 border-t border-line/70 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={applySelected}
            disabled={!selectedOption || status === "loading"}
            className="gap-1.5"
          >
            Insert selected
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
