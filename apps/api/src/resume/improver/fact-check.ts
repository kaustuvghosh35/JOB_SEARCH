import type { ImprovedResume } from '@job-search/shared';
import { resumeToText } from './render-text.js';

const NUMBER_RE = /\d[\d,.]*\d|\d/g;

const numbersIn = (text: string) => new Set((text.match(NUMBER_RE) ?? []).map((n) => n.replace(/[,.]+$/, '').replaceAll(',', '')));

export const unsupportedNumbers = (original: string, improved: ImprovedResume): string[] => {
  const known = numbersIn(original);
  return [...numbersIn(resumeToText({ ...improved, fullName: null, contact: [] }))].filter((n) => !known.has(n));
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
