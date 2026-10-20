import { Document, Packer, Paragraph } from 'docx';
import PDFDocument from 'pdfkit';
import { parseResumeFile } from './parser.factory.js';
import { ResumeParseError } from './resume-parser.js';

const LINES = [
  'Asha Rao - Backend Engineer, Bengaluru',
  '5 years building Node.js and PostgreSQL services. Led a team of four.',
  'Skills: TypeScript, NestJS, PostgreSQL, Docker, AWS.',
];

const makePdf = (lines: string[]): Promise<Buffer> =>
  new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    lines.forEach((l) => doc.text(l));
    doc.end();
  });

const makeDocx = (lines: string[]) =>
  Packer.toBuffer(new Document({ sections: [{ children: lines.map((l) => new Paragraph(l)) }] }));

describe('parseResumeFile', () => {
  it('extracts text from a PDF', async () => {
    const buffer = await makePdf(LINES);
    const text = await parseResumeFile({ buffer, originalname: 'cv.pdf', mimetype: 'application/pdf' });
    expect(text).toContain('Backend Engineer');
    expect(text).toContain('NestJS');
  });

  it('extracts text from a DOCX', async () => {
    const buffer = await makeDocx(LINES);
    const text = await parseResumeFile({
      buffer,
      originalname: 'cv.docx',
      mimetype: 'application/octet-stream',
    });
    expect(text).toContain('PostgreSQL');
  });

  it('rejects a PDF without text (scanned)', async () => {
    const buffer = await makePdf([]);
    await expect(
      parseResumeFile({ buffer, originalname: 'scan.pdf', mimetype: 'application/pdf' }),
    ).rejects.toThrow(/No readable text/);
  });

  it('rejects unsupported types', async () => {
    await expect(
      parseResumeFile({ buffer: Buffer.from('x'), originalname: 'cv.txt', mimetype: 'text/plain' }),
    ).rejects.toBeInstanceOf(ResumeParseError);
  });

  it('rejects corrupt files', async () => {
    await expect(
      parseResumeFile({ buffer: Buffer.from('not a pdf'), originalname: 'cv.pdf', mimetype: 'application/pdf' }),
    ).rejects.toThrow(/Could not read/);
  });
});
