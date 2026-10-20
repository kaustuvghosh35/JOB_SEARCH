import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common';
import { APICallError, NoObjectGeneratedError } from 'ai';
import type { Response } from 'express';

@Catch(APICallError, NoObjectGeneratedError)
export class AiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('AI');

  catch(error: APICallError | NoObjectGeneratedError, host: ArgumentsHost) {
    this.logger.error(error.message);
    const quota = APICallError.isInstance(error) && error.statusCode === 429;
    host.switchToHttp().getResponse<Response>().status(quota ? 429 : 502).json({
      statusCode: quota ? 429 : 502,
      message: quota ? 'The AI provider rate limit was hit. Try again in a minute.' : 'The AI provider failed to answer. Try again.',
    });
  }
}
