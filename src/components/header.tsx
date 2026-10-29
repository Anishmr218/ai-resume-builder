"use client";

import * as React from "react";
import {
  ChevronDown,
  Eye,
  FilePlus2,
  PenLine,
  UserRound,
} from "lucide-react";
import { useResumeStore } from "@/hooks/use-resume-store";
import { initials } from "@/lib/resume/format";
import { Logo } from "@/components/brand/logo";
import { DownloadMenu } from "@/components/download-menu";
import { ProfileDialog } from "@/components/profile-dialog";
import { SaveStatus } from "@/components/save-status";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type MobileView = "editor" | "preview";

export function Header({
  mobileView,
  onMobileViewChange,
}: {
  mobileView: MobileView;
  onMobileViewChange: (view: MobileView) => void;
}) {
  const { resume, user, startFresh, isSample } = useResumeStore();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [freshOpen, setFreshOpen] = React.useState(false);
  const [freshBusy, setFreshBusy] = React.useState(false);
  const [avatarBroken, setAvatarBroken] = React.useState(false);

  React.useEffect(() => {
    setAvatarBroken(false);
  }, [user?.avatarUrl]);

  if (!resume) return null;

  async function handleStartFresh() {
    setFreshBusy(true);
    try {
      await startFresh();
      setFreshOpen(false);
    } finally {
      setFreshBusy(false);
    }
  }

  return (
    <>
      <header className="relative z-30 flex h-[64px] shrink-0 items-center gap-3 border-b border-line bg-surface/95 px-3 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3 md:gap-5">
          <Logo className="[&_.wordmark]:hidden sm:[&_.wordmark]:flex" />
          <span
            className="hidden h-7 w-px bg-line md:block"
            aria-hidden="true"
          />
          <div className="hidden min-w-0 flex-col justify-center md:flex">
            <div className="flex items-center gap-2">
              <p className="max-w-[230px] truncate text-[13px] font-semibold leading-4 text-ink">
                {resume.title || "Untitled resume"}
              </p>
              {isSample ? (
                <span className="rounded-full border border-[#B08A52]/25 bg-[#F5EDDD] px-1.5 py-px text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#7A5B2C]">
                  Sample
                </span>
              ) : null}
            </div>
            <SaveStatus className="mt-0.5" />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <div
            className="flex h-9 items-center rounded-lg border border-line bg-[#F3EFE6] p-[3px] lg:hidden"
            role="group"
            aria-label="Switch between editor and preview"
          >
            <button
              type="button"
              onClick={() => onMobileViewChange("editor")}
              aria-pressed={mobileView === "editor"}
              aria-label="Editor"
              className={cn(
                "flex h-[28px] items-center gap-1.5 rounded-[6px] px-2 text-[11px] font-semibold transition-all duration-200 sm:px-2.5",
                mobileView === "editor"
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(20,20,16,0.08)]"
                  : "text-ink-quiet hover:text-ink",
              )}
            >
              <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onMobileViewChange("preview")}
              aria-pressed={mobileView === "preview"}
              aria-label="Preview"
              className={cn(
                "flex h-[28px] items-center gap-1.5 rounded-[6px] px-2 text-[11px] font-semibold transition-all duration-200 sm:px-2.5",
                mobileView === "preview"
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(20,20,16,0.08)]"
                  : "text-ink-quiet hover:text-ink",
              )}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>

          <DownloadMenu />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group flex h-9 items-center gap-1.5 rounded-full border border-line bg-[#FBF9F4] pl-0.5 pr-2 transition-colors hover:border-ink/15 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label="Open workspace menu"
              >
                <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-line bg-[#EDE8DD]">
                  {user?.avatarUrl && !avatarBroken ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={() => setAvatarBroken(true)}
                    />
                  ) : (
                    <span className="font-display text-[13px] text-ink-soft">
                      {initials(resume.fullName || user?.fullName || "")}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className="h-3 w-3 text-ink-quiet transition-transform group-data-[state=open]:rotate-180"
                  aria-hidden="true"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[250px]">
              <DropdownMenuLabel>Your workspace</DropdownMenuLabel>
              <div className="px-2.5 pb-2">
                <p className="truncate text-[12.5px] font-semibold text-ink">
                  {user?.fullName || "Anonymous workspace"}
                </p>
                <p className="mt-0.5 text-[10.5px] leading-4 text-ink-quiet">
                  Private to this browser
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
                <UserRound aria-hidden="true" />
                Profile &amp; photo
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFreshOpen(true)}>
                <FilePlus2 aria-hidden="true" />
                Start a fresh page
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2.5 py-2">
                <p className="text-[10px] leading-4 text-ink-quiet">
                  Your edits save automatically. Cloud export keeps a PDF copy
                  in object storage.
                </p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />

      <AlertDialog
        open={freshOpen}
        onOpenChange={(open) => {
          if (!freshBusy) setFreshOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start with a blank page?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears every field in this resume and resets the sample
              content. Your chosen template and accent stay the same. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={freshBusy}>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              disabled={freshBusy}
              onClick={(event) => {
                event.preventDefault();
                void handleStartFresh();
              }}
              className="!bg-[#943E37] hover:!bg-[#82352F] focus-visible:!ring-[#943E37]/30"
            >
              {freshBusy ? <Spinner className="h-3.5 w-3.5" /> : null}
              Start fresh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
