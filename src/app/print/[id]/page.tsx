import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getStore } from "@/lib/repository";
import { ResumeDocument } from "@/lib/resume/templates/document";
import { getResumeCss } from "@/lib/resume/templates/styles";
import { PrintToolbar } from "@/components/print/print-toolbar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Print resume — Vellum",
  robots: { index: false, follow: false },
};

const uuidSchema = z.string().uuid();

const printPageCss = `
  body { background: #e9e5dc !important; }
  .print-shell {
    min-height: 100vh;
    padding: 96px 24px 56px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
  .print-paper {
    width: 210mm;
    background: #fff;
    box-shadow: 0 1px 2px rgba(21,21,19,.05), 0 24px 70px -18px rgba(21,21,19,.3);
  }
  .print-paper .resume { box-shadow: none; }
  @media (max-width: 900px) {
    .print-shell {
      display: block;
      overflow-x: auto;
      padding: 84px 12px 32px;
    }
    .print-paper { margin: 0 auto; }
  }
  @media print {
    body { background: #fff !important; }
    .print-shell { display: block !important; padding: 0 !important; }
    .print-paper {
      width: auto !important;
      margin: 0 !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    .print-toolbar { display: none !important; }
  }
`;

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-6">
        <div className="max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-paper">
          <p className="font-display text-2xl text-ink">Session required</p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Open your workspace again to view this resume. Your anonymous
            session lives in this browser.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-black"
          >
            Return to editor
          </Link>
        </div>
      </main>
    );
  }

  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const resume = await getStore().getResume(id, user.id);
  if (!resume) notFound();

  const { auto } = await searchParams;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: getResumeCss() + printPageCss }} />
      <main className="print-shell">
        <PrintToolbar autoPrint={auto === "1"} />
        <div className="print-paper">
          <ResumeDocument resume={resume} />
        </div>
      </main>
    </>
  );
}
