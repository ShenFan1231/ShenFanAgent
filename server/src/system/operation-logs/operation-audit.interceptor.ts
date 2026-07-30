import {
  CallHandler,
  ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common'
import type { Response } from 'express'
import { catchError, tap, throwError, type Observable } from 'rxjs'

import { OperationLevel } from '../../../generated/prisma'
import type { AuthenticatedRequest } from '../../identity/auth/types/authenticated-user'
import { OperationLogsRepository } from './operation-logs.repository'

@Injectable()
export class OperationAuditInterceptor implements NestInterceptor {
  constructor(private readonly repository: OperationLogsRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const response = context.switchToHttp().getResponse<Response>()
    const method = request.method.toUpperCase()
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return next.handle()

    const startedAt = Date.now()
    return next.handle().pipe(
      tap(() => {
        void this.record(request, response.statusCode, Date.now() - startedAt, true)
      }),
      catchError((error: unknown) => {
        const statusCode =
          typeof error === 'object' && error && 'status' in error
            ? Number((error as { status: unknown }).status)
            : 500
        void this.record(request, statusCode, Date.now() - startedAt, false)
        return throwError(() => error)
      }),
    )
  }

  private async record(
    request: AuthenticatedRequest,
    statusCode: number,
    durationMs: number,
    success: boolean,
  ): Promise<void> {
    try {
      const path = request.originalUrl || request.url
      const segments = path.split('?')[0]!.split('/').filter(Boolean)
      const apiIndex = segments.indexOf('api')
      const resourceSegments = segments.slice(apiIndex >= 0 ? apiIndex + 1 : 0)
      const module = resourceSegments[0] ?? 'system'
      const resource =
        module === 'system'
          ? resourceSegments[1] ?? module
          : module === 'auth'
            ? resourceSegments[1] ?? module
            : module
      const resourceId = resourceSegments.find((segment) =>
        /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(segment),
      )
      await this.repository.create({
        userId: request.user?.userId,
        level: success ? OperationLevel.SUCCESS : OperationLevel.DANGER,
        module,
        action: `${request.method.toLowerCase()}:${resource ?? module}`,
        resource,
        resourceId,
        summary: `${success ? '完成' : '失败'} ${request.method.toUpperCase()} ${path.split('?')[0]}`,
        method: request.method,
        path,
        ipAddress: request.ip || request.socket.remoteAddress || undefined,
        userAgent: request.get('user-agent')?.slice(0, 500),
        statusCode,
        durationMs,
        success,
      })
    } catch {
      // Audit persistence must never break the business request.
    }
  }
}
