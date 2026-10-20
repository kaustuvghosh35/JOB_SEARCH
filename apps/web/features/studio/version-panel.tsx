"use client";

import { useCallback, useEffect, useState } from "react";
import type { ImprovedResume, ImprovedVersion } from "@job-search/shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL, api } from "@/lib/api";
import { consumeAutoImprove } from "./auto-improve";

const field = "h-9 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-2";

function ResumeDocument({ resume }: { resume: ImprovedResume }) {
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
                {[e.role, e.company].filter(Boolean).join(", ")}
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
              {[e.degree, e.school].filter(Boolean).join(", ")}
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

const frame = "max-h-[62vh] overflow-auto rounded-lg border border-border p-4";

export function VersionPanel({ resumeId, defaultRole }: { resumeId: string; defaultRole: string }) {
  const [original, setOriginal] = useState<string | null>(null);
  const [version, setVersion] = useState<ImprovedVersion | null>(null);
  const [targetRole, setTargetRole] = useState(defaultRole);
  const [extra, setExtra] = useState("");
  const [revise, setRevise] = useState(true);
  const [compare, setCompare] = useState<"previous" | "original">("previous");
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
          body: JSON.stringify({ targetRole, extra, revise: revise && version !== null }),
        }),
      );
      setExtra("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not improve the resume.");
    } finally {
      setBusy(false);
    }
  }, [resumeId, targetRole, extra, revise, version]);

  useEffect(() => {
    if (!loading && !version && consumeAutoImprove(resumeId)) void improve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <section className="flex flex-col gap-4" aria-labelledby="resume-heading">
      <h2 id="resume-heading" className="text-xl font-semibold">
        Your resume
      </h2>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void improve();
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <input aria-label="Target role" className={`${field} min-w-0 flex-1`} value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Target role (optional)" />
          <Button type="submit" disabled={busy || loading}>
            {busy ? "Improving..." : version ? "Improve again" : "Improve my resume"}
          </Button>
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Add details or request changes</summary>
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              aria-label="Extra details"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              rows={3}
              placeholder="Facts to add, answers to the questions below, or edits you want"
              className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm focus-visible:outline-2"
            />
            {version && (
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={revise} onChange={(e) => setRevise(e.target.checked)} />
                Build on the current version (untick to start again from the original)
              </label>
            )}
          </div>
        </details>
      </form>

      {error && (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      )}
      {(busy || loading) && <div className="h-64 animate-pulse rounded-lg bg-muted" aria-label="Loading" />}

      {!busy && !loading && !version && (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          No improved version yet. Press Improve my resume, or chat on the left and apply the changes.
        </p>
      )}

      {version && !busy && (
        <>
          <Tabs defaultValue="after">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TabsList variant="line">
                <TabsTrigger value="after">Improved</TabsTrigger>
                <TabsTrigger value="before">Before</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                {(["docx", "pdf"] as const).map((f) => (
                  <a
                    key={f}
                    href={`${API_URL}/resumes/${resumeId}/export?format=${f}&versionId=${version.id}`}
                    className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-2"
                  >
                    {f.toUpperCase()}
                  </a>
                ))}
              </div>
            </div>

            <TabsContent value="after" className="pt-3">
              <div className={frame}>
                <ResumeDocument resume={version.resume} />
              </div>
            </TabsContent>

            <TabsContent value="before" className="flex flex-col gap-2 pt-3">
              {version.previous ? (
                <div role="group" aria-label="Compare with" className="flex gap-1 text-xs">
                  {(["previous", "original"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={compare === k}
                      onClick={() => setCompare(k)}
                      className={`rounded-md border px-2 py-0.5 focus-visible:outline-2 ${
                        compare === k ? "border-foreground bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                      }`}
                    >
                      {k === "previous" ? "Previous version" : "Original upload"}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Original upload (first version, nothing earlier to compare)</p>
              )}
              {version.previous && compare === "previous" ? (
                <div className={frame}>
                  <ResumeDocument resume={version.previous} />
                </div>
              ) : (
                <pre className={`${frame} whitespace-pre-wrap font-sans text-sm`}>{original ?? ""}</pre>
              )}
            </TabsContent>
          </Tabs>

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

          {version.resume.changeNotes.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">What changed</summary>
              <ul className="mt-2 list-disc pl-5">
                {version.resume.changeNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
