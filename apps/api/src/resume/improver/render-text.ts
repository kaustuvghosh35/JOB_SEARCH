import type { ImprovedResume } from '@job-search/shared';

export const resumeToText = (r: ImprovedResume): string => {
  const lines: string[] = [];
  if (r.fullName) lines.push(r.fullName);
  if (r.contact.length) lines.push(r.contact.join(' | '));
  if (r.summary) lines.push('', 'SUMMARY', r.summary);
  if (r.experience.length) {
    lines.push('', 'EXPERIENCE');
    for (const e of r.experience) {
      lines.push(`${e.role}, ${e.company}${e.period ? ` (${e.period})` : ''}`);
      e.bullets.forEach((b) => lines.push(`- ${b}`));
    }
  }
  if (r.education.length) {
    lines.push('', 'EDUCATION');
    r.education.forEach((e) => lines.push(`${e.degree}, ${e.school}${e.period ? ` (${e.period})` : ''}`));
  }
  if (r.skills.length) lines.push('', 'SKILLS', r.skills.join(', '));
  for (const x of r.extras) lines.push('', x.title.toUpperCase(), ...x.items.map((i) => `- ${i}`));
  return lines.join('\n');
};
