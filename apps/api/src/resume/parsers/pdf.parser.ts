import { extractText, getDocumentProxy } from 'unpdf';
import { ResumeParseError, type ResumeParser } from './resume-parser.js';

export class PdfParser implements ResumeParser {
  readonly mimeTypes = ['application/pdf'];
  readonly extensions = ['.pdf'];

  async parse(buffer: Buffer): Promise<string> {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      return text;
    } catch {
      throw new ResumeParseError('Could not read this PDF. It may be corrupted or password protected.');
    }
  }
}
