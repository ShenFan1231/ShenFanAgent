import {
  AxiosError,
  AxiosHeaders,
  CanceledError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

import type { ApiResult } from '@/api/types/common'
import http from '@/utils/request'
import { handlers, type MockContext } from './handlers'

const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function normalizePath(config: InternalAxiosRequestConfig): string {
  let url = config.url ?? ''
  const base = config.baseURL ?? BASE
  if (base && url.startsWith(base)) url = url.slice(base.length)
  return url.split('?')[0] || '/'
}

function envelope<T>(data: T, code = 0, message = 'success'): ApiResult<T> {
  return {
    code,
    message,
    data,
    timestamp: Date.now(),
    traceId: `mock-${Math.random().toString(36).slice(2, 10)}`,
  }
}

function respond<T>(
  config: InternalAxiosRequestConfig,
  body: ApiResult<T>,
  status = 200,
): AxiosResponse<ApiResult<T>> {
  return {
    data: body,
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
    headers: new AxiosHeaders(),
    config,
  }
}

/** 模拟网络时延，并且真实响应 AbortController */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new CanceledError())
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      window.clearTimeout(timer)
      reject(new CanceledError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function parseBody(data: unknown): Record<string, unknown> {
  if (!data) return {}
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return data as Record<string, unknown>
}

/**
 * 以 axios adapter 的形式接管请求。
 * 这样 mock 数据依然会经过完整的请求 / 响应拦截器链，
 * 将来把 VITE_USE_MOCK 置 0，业务代码一行都不用改。
 */
export function setupMock(): void {
  if (import.meta.env.VITE_USE_MOCK !== '1') return

  http.defaults.adapter = async (config) => {
    const path = normalizePath(config as InternalAxiosRequestConfig)
    const method = (config.method ?? 'get').toUpperCase()
    const cfg = config as InternalAxiosRequestConfig

    await delay(120 + Math.random() * 260, config.signal as AbortSignal | undefined)

    const route = handlers.find(
      (h) =>
        h.method === method &&
        (typeof h.path === 'string' ? h.path === path : h.path.test(path)),
    )

    if (!route) {
      return Promise.reject(
        new AxiosError(
          `Mock 未实现的接口: ${method} ${path}`,
          'ERR_BAD_REQUEST',
          cfg,
          null,
          respond(cfg, envelope(null, 404, `接口 ${path} 未找到`), 404),
        ),
      )
    }

    const authHeader = String(cfg.headers?.Authorization ?? '')
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (route.auth !== false && !token) {
      return Promise.reject(
        new AxiosError(
          'Unauthorized',
          'ERR_BAD_REQUEST',
          cfg,
          null,
          respond(cfg, envelope(null, 401, '登录状态已失效，请重新登录'), 401),
        ),
      )
    }

    const ctx: MockContext = {
      path,
      method,
      params: (config.params as Record<string, unknown>) ?? {},
      body: parseBody(config.data),
      token,
      match: typeof route.path === 'string' ? null : route.path.exec(path),
    }

    try {
      const result = await route.handler(ctx)
      if (result && typeof result === 'object' && 'code' in (result as object)) {
        const raw = result as ApiResult
        return respond(cfg, raw, raw.code === 0 ? 200 : 200)
      }
      return respond(cfg, envelope(result))
    } catch (error) {
      const message = error instanceof Error ? error.message : '服务异常'
      return Promise.reject(
        new AxiosError(message, 'ERR_BAD_RESPONSE', cfg, null, respond(cfg, envelope(null, 500, message), 500)),
      )
    }
  }
}
