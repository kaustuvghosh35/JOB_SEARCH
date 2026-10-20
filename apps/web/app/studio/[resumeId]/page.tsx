"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ResumeView } from "@job-search/shared";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChatPanel } from "@/features/chat/chat-panel";
import { loadSearchPrefs, saveSearchPrefs } from "@/features/studio/search-prefs";
import { VersionPanel } from "@/features/studio/version-panel";
import { api } from "@/lib/api";

const field = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-2";

export default function StudioWorkspace() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const router = useRouter();
  const [resume, setResume] = useState<ResumeView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [versionTick, setVersionTick] = useState(0);
  const [applying, setApplying] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    api<ResumeView>(`/resumes/${resumeId}`)
      .then((r) => {
        const saved = loadSearchPrefs(resumeId);
        setRole(saved?.role ?? r.profile?.headline ?? "");
        setLocation(saved?.location ?? r.profile?.location?.split(",")[0]?.trim() ?? "");
        setResume(r);
      })
      .catch((e: Error) => setError(e.message));
  }, [resumeId]);

  async function searchJobs() {
    setSearching(true);
    setSearchError(null);
    saveSearchPrefs(resumeId, { role, location });
    try {
      await api<ResumeView>(`/resumes/${resumeId}/use-latest`, { method: "POST" });
      const qs = new URLSearchParams({ role: role.trim(), location: location.trim() });
      router.push(`/r/${resumeId}?${qs}`);
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
          <header className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">{resume.profile.fullName ?? "Your resume"}</h1>
            <p className="text-muted-foreground">{resume.profile.headline}</p>
          </header>

          <form
            className="flex flex-col gap-3 rounded-lg border border-border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void searchJobs();
            }}
          >
            <h2 className="text-base font-semibold">Jobs you want to find</h2>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <label className="flex flex-col gap-1 text-sm font-medium">
                Role you are looking for
                <input className={field} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Backend Engineer" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Location
                <input className={field} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Pune, or leave empty" />
              </label>
              <Button type="submit" size="lg" disabled={searching}>
                {searching && <Spinner />}
                {searching ? "Preparing search..." : "Search jobs with this resume"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              We search LinkedIn and Naukri for this role, and tailor your resume to it when you press Improve.
              Leave a box empty to use what is on your resume.
            </p>
            {searchError && (
              <p role="alert" className="text-sm font-medium">
                {searchError}
              </p>
            )}
          </form>

          <div className="grid gap-10 lg:grid-cols-2">
            <section className="flex flex-col gap-4" aria-labelledby="chat-heading">
              <h2 id="chat-heading" className="text-xl font-semibold">
                Chat
              </h2>
              <ChatPanel
                storageKey={`chat:${resume.id}`}
                resumeId={resume.id}
                onApplied={() => setVersionTick((n) => n + 1)}
                onApplying={setApplying}
                targetRole={role.trim()}
                placeholder="Ask for changes, e.g. make my summary shorter, or tailor this for a backend role."
              />
            </section>
            <VersionPanel key={versionTick} resumeId={resume.id} targetRole={role} externalBusy={applying} />
          </div>
        </>
      )}
    </main>
  );
}
