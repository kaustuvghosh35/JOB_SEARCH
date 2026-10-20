import { entryHeading, type ImprovedResume } from '@job-search/shared';

export const resumeToText = (r: ImprovedResume): string => {
  const lines: string[] = [];
  if (r.fullName) lines.push(r.fullName);
  if (r.contact.length) lines.push(r.contact.join(' | '));
  for (const s of r.sections) {
    lines.push('', s.title.toUpperCase());
    if (s.paragraph) lines.push(s.paragraph);
    for (const e of s.entries) {
      lines.push(`${entryHeading(e)}${e.period ? ` (${e.period})` : ''}`);
      e.bullets.forEach((b) => lines.push(`- ${b}`));
    }
    if (s.items.length) {
      if (s.itemsStyle === 'inline') lines.push(s.items.join(', '));
      else s.items.forEach((i) => lines.push(`- ${i}`));
    }
  }
  return lines.join('\n');
};
