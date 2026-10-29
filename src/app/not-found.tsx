import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex h-16 shrink-0 items-center border-b border-line bg-surface px-4 sm:px-6">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-14">
        <div className="w-full max-w-[460px] rounded-2xl border border-line bg-surface p-8 text-center shadow-paper">
          <p className="font-display text-[56px] leading-none tracking-[-0.04em] text-ink/15">
            404
          </p>
          <h1 className="mt-1 font-display text-[26px] leading-tight tracking-[-0.02em] text-ink">
            This page isn&apos;t in the studio
          </h1>
          <p className="mt-2 text-[13px] leading-6 text-ink-soft">
            The link may be mistyped, or the resume belongs to another
            workspace. Your work is still in this browser.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-[13px] font-semibold text-[#FBFAF5] transition-colors hover:bg-[#2A2C26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to editor
          </Link>
        </div>
      </main>
    </div>
  );
}
