import { BadRequestException, Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Res } from '@nestjs/common';
import { pipeUIMessageStreamToResponse, type UIMessage } from 'ai';
import type { Response } from 'express';
import { z } from 'zod';
import { ChatService } from './chat.service.js';

const messageSchema = z.object({
  id: z.string().min(1).max(100),
  role: z.literal('user'),
  parts: z.array(z.looseObject({ type: z.string() })).min(1).max(20),
});

const chatBody = z.object({
  id: z.uuid(),
  message: messageSchema,
  resumeId: z.uuid().nullish(),
});

@Controller('chat')
export class ChatController {
  constructor(@Inject(ChatService) private readonly chat: ChatService) {}

  @Post()
  async send(@Body() body: unknown, @Res() res: Response) {
    const parsed = chatBody.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid chat request.');
    const { id, message, resumeId } = parsed.data;
    const stream = await this.chat.stream(id, message as unknown as UIMessage, resumeId ?? null);
    await pipeUIMessageStreamToResponse({ response: res, stream });
  }

  @Get(':sessionId')
  history(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.chat.history(sessionId);
  }

  @Post(':sessionId/apply')
  apply(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.chat.applyToResume(sessionId);
  }

  @Post(':sessionId/resume')
  createResume(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.chat.createResume(sessionId);
  }
}
