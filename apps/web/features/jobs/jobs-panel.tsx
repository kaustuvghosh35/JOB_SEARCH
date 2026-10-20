"use client";

import { useCallback, useEffect, useState } from "react";
import type { Job } from "@job-search/shared";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { JobCard } from "./job-card";

type JobsResponse = { jobs: Job[]; warnings: string[] };
type Filters = { role: string; location: string; remote: boolean };

const input = "h-9 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-2";

export function JobsPanel({ resumeId, defaultRole, defaultLocation }: { resumeId: string; defaultRole: string; defaultLocation: string }) {
  const [filters, setFilters] = useState<Filters>({ role: defaultRole, location: defaultLocation, remote: false });
  const [data, setData] = useState<JobsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (f: Filters) => {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams({ role: f.role, location: f.location, remote: String(f.remote) });
      try {
        setData(await api<JobsResponse>(`/resumes/${resumeId}/jobs?${qs}`));
      } catch (e) {
        setData(null);
        setError(e instanceof Error ? e.message : "Could not load jobs.");
      } finally {
        setLoading(false);
      }
    },
    [resumeId],
  );

  useEffect(() => {
    void load({ role: defaultRole, location: defaultLocation, remote: false });
  }, [load, defaultRole, defaultLocation]);

  return (
    <section className="flex flex-col gap-4" aria-labelledby="jobs-heading">
      <h2 id="jobs-heading" className="text-xl font-semibold">
        Matching jobs
      </h2>

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load(filters);
        }}
      >
        <input aria-label="Role" className={`${input} w-56`} value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} placeholder="Role" />
        <input aria-label="Location" className={`${input} w-40`} value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} placeholder="Location" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={filters.remote} onChange={(e) => setFilters({ ...filters, remote: e.target.checked })} />
          Remote
        </label>
        <Button type="submit" disabled={loading}>
          Search
        </Button>
      </form>

      {loading && (
        <div className="flex flex-col gap-3" aria-label="Loading jobs">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="font-medium">
          {error}
        </p>
      )}

      {!loading && data && (
        <>
          {data.warnings.map((w) => (
            <p key={w} className="text-sm text-muted-foreground">
              {w}
            </p>
          ))}
          {data.jobs.length === 0 ? (
            <p className="text-muted-foreground">No jobs found. Try a broader role or another location.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.jobs.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
