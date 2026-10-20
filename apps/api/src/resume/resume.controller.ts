import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { z } from 'zod';
import { MAX_UPLOAD_BYTES, ResumeService } from './resume.service.js';

const textBody = z.object({ text: z.string() });

@Controller('resumes')
export class ResumeController {
  constructor(@Inject(ResumeService) private readonly resumes: ResumeService) {}

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
}
