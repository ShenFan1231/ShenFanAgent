import {
  CallHandler,
  ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common'
import type { Request } from 'express'
import { map, type Observable } from 'rxjs'

import { REQUEST_ID_HEADER } from '../middleware/request-context.middleware'
import type { ApiResponse } from '../types/api-response'
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const isRawResponse =
      Reflect.getMetadata(RAW_RESPONSE_KEY, context.getHandler()) === true ||
      Reflect.getMetadata(RAW_RESPONSE_KEY, context.getClass()) === true
    if (isRawResponse) {
      return next.handle() as Observable<ApiResponse<T>>
    }

    const request = context.switchToHttp().getRequest<Request>()
    const traceId = String(request.headers[REQUEST_ID_HEADER] ?? '')

    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'success',
        data,
        timestamp: Date.now(),
        traceId,
      })),
    )
  }
}
