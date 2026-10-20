import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common';
import { APICallError, NoObjectGeneratedError, RetryError } from 'ai';
import type { Response } from 'express';

const statusOf = (error: unknown): number | undefined => {
  if (RetryError.isInstance(error)) return statusOf(error.lastError);
  return APICallError.isInstance(error) ? error.statusCode : undefined;
};

@Catch(APICallError, NoObjectGeneratedError, RetryError)
export class AiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('AI');

  catch(error: Error, host: ArgumentsHost) {
    this.logger.error(error.message.slice(0, 300));
    const quota = statusOf(error) === 429;
    const status = quota ? 429 : 502;
    host.switchToHttp().getResponse<Response>().status(status).json({
      statusCode: status,
      message: quota
        ? 'The free Gemini quota is used up for now (it resets daily). Try again later or set another GEMINI_MODEL.'
        : 'The AI provider failed to answer. Try again.',
    });
  }
}
