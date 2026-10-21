import { entryHeading, type ImprovedResume } from "@job-search/shared";

export function ResumeDocument({ resume }: { resume: ImprovedResume }) {
  return (
    <article className="flex flex-col gap-4 text-sm">
      <header>
        {resume.fullName && <h3 className="text-lg font-semibold">{resume.fullName}</h3>}
        {resume.contact.length > 0 && <p className="text-muted-foreground">{resume.contact.join(" · ")}</p>}
      </header>
      {resume.sections.map((s, i) => (
        <section key={i} className="flex flex-col gap-2">
          <h4 className="font-semibold uppercase tracking-wide">{s.title}</h4>
          {s.paragraph && <p>{s.paragraph}</p>}
          {s.entries.map((e, j) => (
            <div key={j} className="flex flex-col gap-1">
              <p className="font-medium">
                {entryHeading(e)}
                {e.period && <span className="font-normal text-muted-foreground"> · {e.period}</span>}
              </p>
              {e.bullets.length > 0 && (
                <ul className="list-disc pl-5">
                  {e.bullets.map((b, k) => (
                    <li key={k}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {s.items.length > 0 &&
            (s.itemsStyle === "inline" ? (
              <p>{s.items.join(", ")}</p>
            ) : (
              <ul className="list-disc pl-5">
                {s.items.map((t, k) => (
                  <li key={k}>{t}</li>
                ))}
              </ul>
            ))}
        </section>
      ))}
    </article>
  );
}
