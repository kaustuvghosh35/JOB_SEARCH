export class ResumeParseError extends Error {}

export interface ResumeParser {
  readonly mimeTypes: readonly string[];
  readonly extensions: readonly string[];
  parse(buffer: Buffer): Promise<string>;
}

export const normalizeText = (raw: string): string =>
  raw
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export const MIN_RESUME_CHARS = 80;
