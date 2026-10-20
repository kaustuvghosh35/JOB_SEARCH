import mammoth from 'mammoth';
import { ResumeParseError, type ResumeParser } from './resume-parser.js';

export class DocxParser implements ResumeParser {
  readonly mimeTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  readonly extensions = ['.docx'];

  async parse(buffer: Buffer): Promise<string> {
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    } catch {
      throw new ResumeParseError('Could not read this DOCX. It may be corrupted.');
    }
  }
}
