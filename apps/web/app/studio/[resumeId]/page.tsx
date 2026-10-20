"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ResumeView } from "@job-search/shared";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/features/chat/chat-panel";
import { VersionPanel } from "@/features/studio/version-panel";
import { api } from "@/lib/api";

export default function StudioWorkspace() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const router = useRouter();
  const [resume, setResume] = useState<ResumeView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [versionTick, setVersionTick] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    api<ResumeView>(`/resumes/${resumeId}`)
      .then(setResume)
      .catch((e: Error) => setError(e.message));
  }, [resumeId]);

  async function searchJobs() {
    setSearching(true);
    setSearchError(null);
    try {
      await api<ResumeView>(`/resumes/${resumeId}/use-latest`, { method: "POST" });
      router.push(`/r/${resumeId}`);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Could not prepare the job search.");
      setSearching(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-8 px-4 py-14">
      <Link href="/studio" className="text-sm text-muted-foreground hover:text-foreground">
        ← Resume studio
      </Link>

      {error && (
        <p role="alert" className="font-medium">
          {error}
        </p>
      )}
      {!error && !resume && <div className="h-40 animate-pulse rounded-lg bg-muted" aria-label="Loading" />}

      {resume?.profile && (
        <>
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-semibold">{resume.profile.fullName ?? "Your resume"}</h1>
              <p className="text-muted-foreground">{resume.profile.headline}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Button size="lg" onClick={searchJobs} disabled={searching}>
                {searching ? "Preparing search..." : "Search jobs with this resume"}
              </Button>
              {searchError && (
                <p role="alert" className="max-w-xs text-right text-xs font-medium">
                  {searchError}
                </p>
              )}
            </div>
          </header>

          <div className="grid gap-10 lg:grid-cols-2">
            <section className="flex flex-col gap-4" aria-labelledby="chat-heading">
              <h2 id="chat-heading" className="text-xl font-semibold">
                Chat
              </h2>
              <ChatPanel
                storageKey={`chat:${resume.id}`}
                resumeId={resume.id}
                onApplied={() => setVersionTick((n) => n + 1)}
                placeholder="Ask for changes, e.g. make my summary shorter, or tailor this for a backend role."
              />
            </section>
            <VersionPanel key={versionTick} resumeId={resume.id} defaultRole={resume.profile.headline} />
          </div>
        </>
      )}
    </main>
  );
}
