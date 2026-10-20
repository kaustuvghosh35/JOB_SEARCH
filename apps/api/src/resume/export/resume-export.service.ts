import { Injectable } from '@nestjs/common';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import PDFDocument from 'pdfkit';
import { entryHeading, type ImprovedResume } from '@job-search/shared';

type Block =
  | { kind: 'name'; text: string }
  | { kind: 'line'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'sub'; text: string; meta?: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'text'; text: string };

const toBlocks = (r: ImprovedResume): Block[] => {
  const b: Block[] = [];
  if (r.fullName) b.push({ kind: 'name', text: r.fullName });
  if (r.contact.length) b.push({ kind: 'line', text: r.contact.join('  |  ') });
  for (const s of r.sections) {
    b.push({ kind: 'heading', text: s.title });
    if (s.paragraph) b.push({ kind: 'text', text: s.paragraph });
    for (const e of s.entries) {
      b.push({ kind: 'sub', text: entryHeading(e), meta: e.period ?? undefined });
      e.bullets.forEach((t) => b.push({ kind: 'bullet', text: t }));
    }
    if (s.items.length) {
      if (s.itemsStyle === 'inline') b.push({ kind: 'text', text: s.items.join(', ') });
      else s.items.forEach((t) => b.push({ kind: 'bullet', text: t }));
    }
  }
  return b;
};

@Injectable()
export class ResumeExportService {
  toDocx(resume: ImprovedResume): Promise<Buffer> {
    const font = 'Calibri';
    const children = toBlocks(resume).map((blk) => {
      switch (blk.kind) {
        case 'name':
          return new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: blk.text, bold: true, size: 36, font })],
          });
        case 'line':
          return new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: blk.text, size: 20, font })],
          });
        case 'heading':
          return new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 80 },
            border: { bottom: { style: 'single', size: 6, color: '000000', space: 1 } },
            children: [new TextRun({ text: blk.text.toUpperCase(), bold: true, size: 22, font, color: '000000' })],
          });
        case 'sub':
          return new Paragraph({
            spacing: { before: 120 },
            children: [
              new TextRun({ text: blk.text, bold: true, size: 22, font }),
              ...(blk.meta ? [new TextRun({ text: `   ${blk.meta}`, size: 20, font })] : []),
            ],
          });
        case 'bullet':
          return new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: blk.text, size: 21, font })] });
        default:
          return new Paragraph({ children: [new TextRun({ text: blk.text, size: 21, font })] });
      }
    });
    return Packer.toBuffer(new Document({ sections: [{ children }] }));
  }

  toPdf(resume: ImprovedResume): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: resume.fullName ?? 'Resume' } });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      for (const blk of toBlocks(resume)) {
        switch (blk.kind) {
          case 'name':
            doc.font('Helvetica-Bold').fontSize(20).text(blk.text, { align: 'center' });
            break;
          case 'line':
            doc.font('Helvetica').fontSize(9.5).text(blk.text, { align: 'center' }).moveDown(0.4);
            break;
          case 'heading':
            doc.moveDown(0.6).font('Helvetica-Bold').fontSize(11).text(blk.text.toUpperCase());
            doc.moveTo(doc.x, doc.y + 1).lineTo(doc.page.width - doc.page.margins.right, doc.y + 1).lineWidth(0.6).stroke('#000000');
            doc.moveDown(0.3);
            break;
          case 'sub':
            doc.moveDown(0.3).font('Helvetica-Bold').fontSize(10.5).text(blk.text, { continued: Boolean(blk.meta) });
            if (blk.meta) doc.font('Helvetica').fontSize(9.5).text(`   ${blk.meta}`);
            break;
          case 'bullet':
            doc.font('Helvetica').fontSize(10).text(`• ${blk.text}`, { indent: 6, lineGap: 1 });
            break;
          default:
            doc.font('Helvetica').fontSize(10).text(blk.text, { lineGap: 1 });
        }
      }
      doc.end();
    });
  }
}
