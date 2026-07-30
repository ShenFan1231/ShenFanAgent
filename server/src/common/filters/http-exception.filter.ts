import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common'
import type { Request, Response } from 'express'

import { REQUEST_ID_HEADER } from '../middleware/request-context.middleware'
import type { ApiResponse } from '../types/api-response'

interface ExceptionBody {
  message?: string | string[]
  error?: string
  code?: number
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR
    const body =
      exception instanceof HttpException
        ? (exception.getResponse() as string | ExceptionBody)
        : undefined

    const payload: ApiResponse<null> = {
      code: typeof body === 'object' && body.code ? body.code : status,
      message: this.resolveMessage(body, status),
      data: null,
      timestamp: Date.now(),
      traceId: String(request.headers[REQUEST_ID_HEADER] ?? ''),
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(`[api] ${payload.traceId} ${request.method} ${request.url}`, exception)
    }

    response.status(status).json(payload)
  }

  private resolveMessage(body: string | ExceptionBody | undefined, status: number): string {
    if (typeof body === 'string') return body
    if (Array.isArray(body?.message)) return body.message.join('; ')
    if (body?.message) return body.message
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) return 'Internal server error'
    return body?.error ?? 'Request failed'
  }
}
