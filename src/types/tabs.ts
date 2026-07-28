export interface TabItem {
  /** 唯一标识，使用 fullPath，保证同一路由不同参数各占一个标签 */
  key: string
  /** 路由 name，权限校验与菜单高亮使用 */
  name: string
  path: string
  fullPath: string
  title: string
  icon?: string
  affix: boolean
  keepAlive: boolean
  /**
   * 缓存版本号。刷新标签页时自增，从而生成新的缓存 key，
   * 让 <KeepAlive> 丢弃旧实例并重新挂载组件。
   */
  version: number
}

/** KeepAlive include 使用的缓存 key：`${tab.key}::${tab.version}` */
export type CacheKey = string
