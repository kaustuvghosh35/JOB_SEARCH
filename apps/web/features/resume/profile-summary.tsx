import type { Profile } from "@job-search/shared";

export function ProfileSummary({ profile, expiresAt }: { profile: Profile; expiresAt: string }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">{profile.fullName ?? "Your profile"}</h1>
        <p className="text-muted-foreground">
          {profile.headline} · {profile.seniority} · {profile.yearsOfExperience} yrs
          {profile.location ? ` · ${profile.location}` : ""}
        </p>
      </div>
      <p>{profile.summary}</p>
      <ul className="flex flex-wrap gap-2" aria-label="Skills">
        {profile.skills.map((s) => (
          <li key={s} className="rounded-md border border-border px-2 py-0.5 text-sm">
            {s}
          </li>
        ))}
      </ul>
      <p className="font-mono text-xs text-muted-foreground">
        Auto-deletes {new Date(expiresAt).toLocaleDateString()}
      </p>
    </section>
  );
}
