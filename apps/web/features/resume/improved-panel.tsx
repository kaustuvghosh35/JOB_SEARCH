"use client";

import { useCallback, useEffect, useState } from "react";
import type { ImprovedResume, ImprovedVersion } from "@job-search/shared";
import { Button } from "@/components/ui/button";
import { API_URL, api } from "@/lib/api";

const field = "h-9 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-2";

function ResumeView({ resume }: { resume: ImprovedResume }) {
  return (
    <article className="flex flex-col gap-4 text-sm">
      <header>
        {resume.fullName && <h3 className="text-lg font-semibold">{resume.fullName}</h3>}
        {resume.contact.length > 0 && <p className="text-muted-foreground">{resume.contact.join(" · ")}</p>}
      </header>
      {resume.summary && <p>{resume.summary}</p>}
      {resume.experience.length > 0 && (
        <section className="flex flex-col gap-3">
          <h4 className="font-semibold uppercase tracking-wide">Experience</h4>
          {resume.experience.map((e, i) => (
            <div key={i} className="flex flex-col gap-1">
              <p className="font-medium">
                {e.role}, {e.company}
                {e.period && <span className="font-normal text-muted-foreground"> · {e.period}</span>}
              </p>
              <ul className="list-disc pl-5">
                {e.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
      {resume.education.length > 0 && (
        <section className="flex flex-col gap-1">
          <h4 className="font-semibold uppercase tracking-wide">Education</h4>
          {resume.education.map((e, i) => (
            <p key={i}>
              {e.degree}, {e.school}
              {e.period && <span className="text-muted-foreground"> · {e.period}</span>}
            </p>
          ))}
        </section>
      )}
      {resume.skills.length > 0 && (
        <section className="flex flex-col gap-1">
          <h4 className="font-semibold uppercase tracking-wide">Skills</h4>
          <p>{resume.skills.join(", ")}</p>
        </section>
      )}
      {resume.extras.map((x) => (
        <section key={x.title} className="flex flex-col gap-1">
          <h4 className="font-semibold uppercase tracking-wide">{x.title}</h4>
          <ul className="list-disc pl-5">
            {x.items.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}

export function ImprovedPanel({ resumeId, defaultRole }: { resumeId: string; defaultRole: string }) {
  const [original, setOriginal] = useState<string | null>(null);
  const [version, setVersion] = useState<ImprovedVersion | null>(null);
  const [targetRole, setTargetRole] = useState(defaultRole);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ text: string }>(`/resumes/${resumeId}/original`).then((r) => setOriginal(r.text)).catch(() => {});
    api<ImprovedVersion>(`/resumes/${resumeId}/improved`)
      .then(setVersion)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [resumeId]);

  const improve = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setVersion(
        await api<ImprovedVersion>(`/resumes/${resumeId}/improve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRole }),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not improve the resume.");
    } finally {
      setBusy(false);
    }
  }, [resumeId, targetRole]);

  return (
    <section className="flex flex-col gap-6" aria-labelledby="improved-heading">
      <h2 id="improved-heading" className="text-xl font-semibold">
        Improved resume
      </h2>

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void improve();
        }}
      >
        <input aria-label="Target role" className={`${field} w-64`} value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Target role (optional)" />
        <Button type="submit" disabled={busy}>
          {busy ? "Improving..." : version ? "Improve again" : "Improve my resume"}
        </Button>
      </form>

      {error && (
        <p role="alert" className="font-medium">
          {error}
        </p>
      )}
      {(busy || loading) && <div className="h-48 animate-pulse rounded-lg bg-muted" aria-label="Loading" />}

      {version && !busy && (
        <>
          <div className="flex flex-wrap gap-2">
            {(["docx", "pdf"] as const).map((f) => (
              <a
                key={f}
                href={`${API_URL}/resumes/${resumeId}/export?format=${f}&versionId=${version.id}`}
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:outline-2"
              >
                Download {f.toUpperCase()}
              </a>
            ))}
          </div>

          {version.resume.openQuestions.length > 0 && (
            <div className="rounded-lg border border-foreground p-4">
              <h3 className="mb-2 font-semibold">Check these before you send it</h3>
              <ul className="list-disc pl-5 text-sm">
                {version.resume.openQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <h3 className="font-mono text-xs uppercase text-muted-foreground">Before</h3>
              <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-lg border border-border p-4 font-sans text-sm">{original ?? ""}</pre>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-mono text-xs uppercase text-muted-foreground">After</h3>
              <div className="max-h-[70vh] overflow-auto rounded-lg border border-border p-4">
                <ResumeView resume={version.resume} />
              </div>
            </div>
          </div>

          {version.resume.changeNotes.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">What changed</h3>
              <ul className="list-disc pl-5 text-sm">
                {version.resume.changeNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
