"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { ResumeView } from "@job-search/shared";
import { JobsPanel } from "@/features/jobs/jobs-panel";
import { ProfileSummary } from "@/features/resume/profile-summary";
import { api } from "@/lib/api";

export default function ResumePage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const [resume, setResume] = useState<ResumeView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ResumeView>(`/resumes/${resumeId}`)
      .then(setResume)
      .catch((e: Error) => setError(e.message));
  }, [resumeId]);

  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-10 px-4 py-16">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← New resume
      </Link>
      {error && (
        <p role="alert" className="font-medium">
          {error}
        </p>
      )}
      {!error && !resume && <div className="h-40 animate-pulse rounded-lg bg-muted" aria-label="Loading" />}
      {resume?.profile && (
        <>
          <div className="max-w-[720px]">
            <ProfileSummary profile={resume.profile} expiresAt={resume.expiresAt} />
          </div>
          <JobsPanel
            resumeId={resume.id}
            defaultRole={resume.profile.headline}
            defaultLocation={resume.profile.location?.split(",")[0]?.trim() ?? ""}
          />
        </>
      )}
    </main>
  );
}
