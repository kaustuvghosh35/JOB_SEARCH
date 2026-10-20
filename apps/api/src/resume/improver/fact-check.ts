import type { ImprovedResume } from '@job-search/shared';

const NUMBER_RE = /\d[\d,.]*\d|\d/g;

const numbersIn = (text: string) => new Set((text.match(NUMBER_RE) ?? []).map((n) => n.replace(/[,.]+$/, '').replaceAll(',', '')));

const flatten = (r: ImprovedResume): string =>
  [
    r.summary,
    ...r.experience.flatMap((e) => [e.role, e.company, e.period ?? '', ...e.bullets]),
    ...r.education.flatMap((e) => [e.degree, e.school, e.period ?? '']),
    ...r.skills,
    ...r.extras.flatMap((x) => [x.title, ...x.items]),
  ].join('\n');

export const unsupportedNumbers = (original: string, improved: ImprovedResume): string[] => {
  const known = numbersIn(original);
  return [...numbersIn(flatten(improved))].filter((n) => !known.has(n));
};

export const withFactWarnings = (original: string, improved: ImprovedResume): ImprovedResume => {
  const extra = unsupportedNumbers(original, improved);
  if (!extra.length) return improved;
  return {
    ...improved,
    openQuestions: [
      ...improved.openQuestions,
      `Verify these figures, they are not in your original resume: ${extra.join(', ')}.`,
    ],
  };
};
