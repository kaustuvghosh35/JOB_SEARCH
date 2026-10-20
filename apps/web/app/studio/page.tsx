"use client";

import Link from "next/link";
import { UploadForm } from "@/features/upload/upload-form";
import { markAutoImprove } from "@/features/studio/auto-improve";

export default function StudioStart() {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-8 px-4 py-16">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Resume studio</h1>
        <p className="text-muted-foreground">
          Upload your resume, or type it in. Then improve it with AI, download it, and search jobs.
        </p>
      </header>
      <UploadForm inlineText destination={(id) => `/studio/${id}`} onCreated={markAutoImprove} />
    </main>
  );
}
