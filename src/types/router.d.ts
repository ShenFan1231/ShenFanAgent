import 'vue-router'
import type { PermissionKey, RoleKey } from './permission'

declare module 'vue-router' {
  interface RouteMeta {
    /** 标签页 / 文档标题 / 面包屑显示的名称 */
    title?: string
    /** UnoCSS 图标类名，如 `i-lucide-gauge` */
    icon?: string
    /** 是否加入 KeepAlive 缓存 */
    keepAlive?: boolean
    /** 是否需要登录态，默认 true（由 router/routes 显式声明 false 才放行） */
    requiresAuth?: boolean
    /** 允许访问的角色，缺省表示所有已登录角色可见 */
    roles?: RoleKey[]
    /** 进入页面所需的按钮级权限（任一命中即可） */
    permissions?: PermissionKey[]
    /** 在侧边栏隐藏（详情页、错误页等） */
    hideInMenu?: boolean
    /** 不生成标签页（登录页、全屏页） */
    hideTab?: boolean
    /** 固定标签页，不可关闭 */
    affix?: boolean
    /** 菜单排序，越小越靠前 */
    order?: number
    /** 菜单右侧徽标 */
    badge?: string | number
    /** 只有一个子路由时是否仍然显示父级菜单 */
    alwaysShow?: boolean
    /** 面包屑里跳过该层级 */
    breadcrumbHidden?: boolean
    /** 使用无布局的整页模式（登录页） */
    fullPage?: boolean
    /** 覆盖默认路由过渡名 */
    transition?: string
    /** 菜单外链 */
    link?: string
  }
}

export {}
