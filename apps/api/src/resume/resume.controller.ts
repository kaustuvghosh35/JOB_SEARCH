import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { z } from 'zod';
import { VersionsService } from './improver/versions.service.js';
import { MAX_UPLOAD_BYTES, ResumeService } from './resume.service.js';

const textBody = z.object({ text: z.string() });
const improveBody = z
  .object({
    targetRole: z.string().max(120).optional(),
    extra: z.string().max(6000).optional(),
    revise: z.boolean().optional(),
  })
  .default({});
const exportQuery = z.object({ format: z.enum(['docx', 'pdf']), versionId: z.uuid().optional() });

@Controller('resumes')
export class ResumeController {
  constructor(
    @Inject(ResumeService) private readonly resumes: ResumeService,
    @Inject(VersionsService) private readonly versions: VersionsService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  upload(@UploadedFile() file?: { buffer: Buffer; originalname: string; mimetype: string }) {
    if (!file) throw new BadRequestException('Attach a PDF or DOCX file in the "file" field.');
    return this.resumes.createFromFile(file);
  }

  @Post('text')
  fromText(@Body() body: unknown) {
    const parsed = textBody.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Body must be { "text": string }.');
    return this.resumes.createFromText(parsed.data.text);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.resumes.get(id);
  }

  @Get(':id/original')
  original(@Param('id', ParseUUIDPipe) id: string) {
    return { text: this.resumes.getRow(id).originalText };
  }

  @Post(':id/improve')
  improve(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const parsed = improveBody.safeParse(body ?? {});
    if (!parsed.success) throw new BadRequestException('Invalid body.');
    return this.versions.improve(id, parsed.data);
  }

  @Get(':id/improved')
  improved(@Param('id', ParseUUIDPipe) id: string) {
    return this.versions.latest(id);
  }

  @Get(':id/export')
  async export(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = exportQuery.safeParse(query);
    if (!parsed.success) throw new BadRequestException('format must be docx or pdf.');
    const file = await this.versions.export(id, parsed.data.format, parsed.data.versionId);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    return new StreamableFile(file.buffer);
  }
}
