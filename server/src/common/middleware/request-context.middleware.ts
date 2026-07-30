import { randomUUID } from 'node:crypto'

import { Injectable, type NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'

export const REQUEST_ID_HEADER = 'x-request-id'

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const incoming = request.header(REQUEST_ID_HEADER)?.trim()
    const traceId = incoming || randomUUID()

    request.headers[REQUEST_ID_HEADER] = traceId
    response.setHeader(REQUEST_ID_HEADER, traceId)
    next()
  }
}
