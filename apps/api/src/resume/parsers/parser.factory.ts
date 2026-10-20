import { extname } from 'node:path';
import { DocxParser } from './docx.parser.js';
import { PdfParser } from './pdf.parser.js';
import { MIN_RESUME_CHARS, normalizeText, ResumeParseError, type ResumeParser } from './resume-parser.js';

const parsers: ResumeParser[] = [new PdfParser(), new DocxParser()];

const pickParser = (filename: string, mimeType: string): ResumeParser => {
  const ext = extname(filename).toLowerCase();
  const parser = parsers.find((p) => p.extensions.includes(ext) || p.mimeTypes.includes(mimeType));
  if (!parser) throw new ResumeParseError('Only PDF and DOCX files are supported.');
  return parser;
};

export const parseResumeFile = async (file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<string> => {
  const text = normalizeText(await pickParser(file.originalname, file.mimetype).parse(file.buffer));
  if (text.length < MIN_RESUME_CHARS) {
    throw new ResumeParseError(
      'No readable text found. Scanned or image-only files are not supported; upload a text-based PDF/DOCX or paste the text.',
    );
  }
  return text;
};
