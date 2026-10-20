import type { Job } from "@job-search/shared";

const SOURCE_LABEL = { linkedin: "LinkedIn", naukri: "Naukri", other: "Web" } as const;

export function JobCard({ job }: { job: Job }) {
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="font-semibold leading-snug">{job.title}</h3>
        <p className="text-sm text-muted-foreground">
          {[job.company, job.location].filter(Boolean).join(" · ") || "Details on the posting"}
        </p>
        {job.snippet && <p className="line-clamp-2 text-sm">{job.snippet}</p>}
        <p className="font-mono text-xs text-muted-foreground">
          {SOURCE_LABEL[job.source]} · {job.score}% match
        </p>
      </div>
      <a
        href={job.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Apply ↗
      </a>
    </li>
  );
}
