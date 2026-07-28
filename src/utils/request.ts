import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

import { BizCode, type ApiResult } from '@/api/types/common'
import { local, StorageKeys } from './storage'
import { toast } from './toast'

/** 业务侧可以在每个请求上附加的扩展项 */
export interface RequestExtras {
  /** 不弹出错误提示，由调用方自行处理 */
  silentError?: boolean
  /** 不携带 token（登录、验证码等公开接口） */
  withoutToken?: boolean
  /**
   * 取消标识。相同 key 的请求再次发起时，前一个会被自动 abort，
   * 适用于搜索联想、快速切换筛选条件等场景。
   */
  cancelKey?: string
  /** 返回完整信封（包含 code/message），默认只返回 data */
  returnRaw?: boolean
  /** 失败重试次数，仅对幂等请求生效 */
  retry?: number
}

declare module 'axios' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface AxiosRequestConfig extends RequestExtras {
    /** 内部使用：已重试次数 */
    __retryCount?: number
  }
}

/** 统一错误对象，组件里 catch 到的永远是它。 */
export class RequestError extends Error {
  code: number
  traceId?: string
  /** 是否由主动取消导致（组件卸载、切换筛选），通常不需要提示 */
  canceled: boolean

  constructor(message: string, code: number, traceId?: string, canceled = false) {
    super(message)
    this.name = 'RequestError'
    this.code = code
    this.traceId = traceId
    this.canceled = canceled
  }
}

const ENV = import.meta.env

/* -------------------------------------------------------------------------- */
/* 请求取消登记表                                                              */
/* -------------------------------------------------------------------------- */
const pendingMap = new Map<string, AbortController>()

function registerCancel(config: InternalAxiosRequestConfig): void {
  const key = config.cancelKey
  if (!key) return
  pendingMap.get(key)?.abort()
  const controller = new AbortController()
  config.signal = controller.signal
  pendingMap.set(key, controller)
}

function releaseCancel(config?: AxiosRequestConfig): void {
  if (config?.cancelKey) pendingMap.delete(config.cancelKey)
}

/** 手动取消：页面卸载或用户主动中断时调用 */
export function cancelRequest(key: string): void {
  pendingMap.get(key)?.abort()
  pendingMap.delete(key)
}

export function cancelAllRequests(): void {
  pendingMap.forEach((controller) => controller.abort())
  pendingMap.clear()
}

/* -------------------------------------------------------------------------- */
/* 实例                                                                        */
/* -------------------------------------------------------------------------- */
const http: AxiosInstance = axios.create({
  baseURL: ENV.VITE_API_BASE_URL || '/api',
  timeout: Number(ENV.VITE_REQUEST_TIMEOUT ?? 15000),
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use(
  (config) => {
    if (!config.withoutToken) {
      const token = local.get<string>(StorageKeys.TOKEN, '')
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
    config.headers['X-Request-Id'] = crypto.randomUUID?.() ?? String(Date.now())
    registerCancel(config)
    return config
  },
  (error: unknown) => Promise.reject(error),
)

http.interceptors.response.use(
  (response: AxiosResponse<ApiResult>) => {
    releaseCancel(response.config)
    const envelope = response.data

    // 非信封结构（例如文件流）直接透传
    if (!envelope || typeof envelope !== 'object' || !('code' in envelope)) return response

    if (envelope.code === BizCode.SUCCESS) return response

    return Promise.reject(
      new RequestError(envelope.message || '请求失败', envelope.code, envelope.traceId),
    )
  },
  async (error: AxiosError<ApiResult>) => {
    releaseCancel(error.config)

    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(new RequestError('请求已取消', -1, undefined, true))
    }

    // 幂等请求的自动重试
    const config = error.config
    const maxRetry = config?.retry ?? 0
    if (config && maxRetry > 0 && (config.method === 'get' || config.method === undefined)) {
      config.__retryCount = (config.__retryCount ?? 0) + 1
      if (config.__retryCount <= maxRetry) {
        await new Promise((resolve) => setTimeout(resolve, 300 * config.__retryCount!))
        return http.request(config)
      }
    }

    const status = error.response?.status ?? 0
    const payload = error.response?.data
    const message = payload?.message || mapHttpMessage(status, error.message)

    if (status === BizCode.UNAUTHORIZED || payload?.code === BizCode.UNAUTHORIZED) {
      await handleUnauthorized()
    }

    return Promise.reject(new RequestError(message, payload?.code ?? status, payload?.traceId))
  },
)

function mapHttpMessage(status: number, fallback: string): string {
  const table: Record<number, string> = {
    0: '网络异常，请检查连接后重试',
    400: '请求参数有误',
    401: '登录状态已失效，请重新登录',
    403: '没有访问权限',
    404: '请求的资源不存在',
    408: '请求超时',
    429: '操作过于频繁，请稍后再试',
    500: '服务器开小差了',
    502: '网关异常',
    503: '服务暂不可用',
    504: '网关超时',
  }
  return table[status] ?? fallback ?? '请求失败'
}

/** 401 统一出口：清理登录态并跳回登录页（动态引入以避免与 store 形成循环依赖） */
let redirecting = false
async function handleUnauthorized(): Promise<void> {
  if (redirecting) return
  redirecting = true
  try {
    const [{ useUserStore }, { default: router }] = await Promise.all([
      import('@/stores/user'),
      import('@/router'),
    ])
    const userStore = useUserStore()
    await userStore.resetState()
    const redirect = router.currentRoute.value.fullPath
    await router.replace({
      path: '/login',
      query: redirect && redirect !== '/login' ? { redirect } : undefined,
    })
  } finally {
    window.setTimeout(() => (redirecting = false), 800)
  }
}

/* -------------------------------------------------------------------------- */
/* 对外的类型化方法                                                            */
/* -------------------------------------------------------------------------- */
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await http.request<ApiResult<T>>(config)
    const envelope = response.data
    if (config.returnRaw) return envelope as unknown as T
    return envelope?.data as T
  } catch (error) {
    const err =
      error instanceof RequestError
        ? error
        : new RequestError((error as Error)?.message ?? '未知错误', -2)
    if (!err.canceled && !config.silentError) {
      toast.error(err.message, err.traceId ? `traceId: ${err.traceId}` : undefined)
    }
    throw err
  }
}

export const api = {
  get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) {
    return request<T>({ ...config, url, params, method: 'GET' })
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return request<T>({ ...config, url, data, method: 'POST' })
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return request<T>({ ...config, url, data, method: 'PUT' })
  },
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return request<T>({ ...config, url, data, method: 'PATCH' })
  },
  delete<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) {
    return request<T>({ ...config, url, params, method: 'DELETE' })
  },
}

export default http
