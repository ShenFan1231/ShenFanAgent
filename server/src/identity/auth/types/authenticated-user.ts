import type { Request } from 'express'

export interface AccessTokenPayload {
  sub: string
  sid: string
  type: 'access'
  iat?: number
  exp?: number
}

export interface AuthenticatedUser {
  userId: string
  sessionId: string
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser
}

export interface RequestMetadata {
  ipAddress?: string
  userAgent?: string
}
