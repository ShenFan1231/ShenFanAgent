/**
 * 菜单模型与路由解耦：菜单由路由表推导（router/helper.ts），
 * 也可以在接入真实后端后由接口直接下发同样结构。
 */
export interface MenuItem {
  /** 路由 name，作为唯一 key */
  key: string
  /** 完整跳转路径 */
  path: string
  title: string
  icon?: string
  badge?: string | number
  /** 外链地址，存在时点击直接打开新窗口 */
  link?: string
  /** 排序权重，越小越靠前 */
  order?: number
  children?: MenuItem[]
}

export interface BreadcrumbItem {
  title: string
  path?: string
  icon?: string
}
