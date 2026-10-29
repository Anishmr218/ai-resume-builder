"use client";

import * as React from "react";
import { Camera, ImagePlus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useResumeStore } from "@/hooks/use-resume-store";
import { ApiRequestError, api } from "@/lib/client/api";
import { initials } from "@/lib/resume/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, updateUser } = useResumeStore();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [imageBroken, setImageBroken] = React.useState(false);

  React.useEffect(() => {
    setImageBroken(false);
  }, [user?.avatarUrl]);

  if (!user) return null;

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Use a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile photos must be 2 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const result = await api.uploadAvatar(file);
      updateUser(result.user);
      toast.success("Profile photo updated", {
        description: "This image is used only in the workspace — never on the resume.",
      });
    } catch (error) {
      toast.error("Photo upload failed", {
        description:
          error instanceof ApiRequestError
            ? error.message
            : "Please try again in a moment.",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const result = await api.deleteAvatar();
      updateUser(result.user);
      toast.success("Profile photo removed");
    } catch (error) {
      toast.error("Could not remove the photo", {
        description:
          error instanceof ApiRequestError ? error.message : "Please try again.",
      });
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Workspace profile</DialogTitle>
          <DialogDescription>
            A small touch of personality for your studio. Your resume stays
            photo-free for ATS compatibility.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-xl border border-line bg-[#FBF9F4] p-4">
          <div className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-[#EFEAE0]">
            {user.avatarUrl && !imageBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImageBroken(true)}
              />
            ) : (
              <span className="font-display text-[23px] text-ink-soft">
                {initials(user.fullName)}
              </span>
            )}
            {uploading ? (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/45 text-white">
                <Spinner />
              </span>
            ) : null}
          </div>

          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-ink">
              {user.fullName || "Your workspace"}
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-quiet">
              Private to this browser
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading || removing}
              >
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                {user.avatarUrl ? "Replace" : "Add photo"}
              </Button>
              {user.avatarUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={uploading || removing}
                  className="text-ink-quiet"
                >
                  {removing ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Remove
                </Button>
              ) : null}
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            aria-label="Choose a profile photo"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-accent/10 bg-accent-soft/60 p-3.5">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-accent"
            aria-hidden="true"
          />
          <div>
            <p className="text-[12px] font-semibold text-ink">
              ATS note, by design
            </p>
            <p className="mt-0.5 text-[11.5px] leading-5 text-ink-soft">
              Photos can confuse older resume parsers. Vellum never embeds your
              workspace photo in the exported PDF.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3">
          <div className="flex items-center gap-2 text-[11.5px] text-ink-soft">
            <ImagePlus className="h-4 w-4 text-ink-quiet" aria-hidden="true" />
            PNG, JPG, or WebP · 2 MB max
          </div>
          <Badge variant="outline">Anonymous workspace</Badge>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
