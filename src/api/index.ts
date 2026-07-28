/**
 * 接口层统一出口。
 * 组件只从这里 import，永远不直接接触 axios。
 */
export { authApi } from './modules/auth'
export { dashboardApi } from './modules/dashboard'
export { systemApi } from './modules/system'

export { BizCode } from './types/common'

export type * from './types/auth'
export type * from './types/common'
export type * from './types/dashboard'
export type * from './types/system'
