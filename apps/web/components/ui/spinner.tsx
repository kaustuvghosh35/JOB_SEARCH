export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function LoadingBlock({ title, hint }: { title: string; hint?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4 rounded-lg border border-border p-6">
      <div className="flex items-center gap-3">
        <Spinner className="size-5" />
        <div className="flex flex-col">
          <span className="font-medium">{title}</span>
          {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
