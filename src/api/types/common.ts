/** 后端统一响应信封，所有接口都按这个结构返回。 */
export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
  /** 服务端时间戳，便于前端做时钟校准 */
  timestamp: number
  /** 链路追踪 ID，出错时可直接给后端排查 */
  traceId: string
}

/** 业务响应码（与后端约定，禁止散落在组件里硬编码数字）。 */
export const BizCode = {
  SUCCESS: 0,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATE_FAILED: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
} as const

export type BizCodeValue = (typeof BizCode)[keyof typeof BizCode]

export interface PageQuery {
  page: number
  pageSize: number
  keyword?: string
  sortBy?: string
  order?: 'asc' | 'desc'
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 时间范围筛选参数，图表 / 报表通用。 */
export type RangeKey = '7d' | '30d' | '90d'
