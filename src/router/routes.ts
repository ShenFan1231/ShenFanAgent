import type { RouteRecordRaw } from 'vue-router'

import BasicLayout from '@/layout/index.vue'

/**
 * 兜底路由。
 *
 * 两个刻意的选择：
 * - 跟基础路由一起注册：catch-all 的匹配分数最低，不会抢走具体路径；但如果等到动态路由
 *   注册后再加，首次进入 /dashboard 这类地址时 router 解析不到任何记录，会打印
 *   VUE_ROUTER_R0004 警告。
 * - 用 component 而不是 redirect：redirect 在解析阶段就生效，会在守卫注册动态路由之前
 *   把用户踢到 404。这里交给守卫去判断到底是"路径不存在"还是"没有权限"。
 */
export const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('@/views/error/404.vue'),
  meta: { title: '页面不存在', hideInMenu: true, hideTab: true },
}

/**
 * 不需要权限的基础路由：始终注册。
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false, hideInMenu: true, hideTab: true, fullPage: true },
  },
  {
    path: '/error',
    name: 'ErrorRoot',
    component: BasicLayout,
    redirect: '/error/404',
    meta: { hideInMenu: true, requiresAuth: false },
    children: [
      {
        path: '403',
        name: 'Error403',
        component: () => import('@/views/error/403.vue'),
        meta: { title: '无访问权限', hideInMenu: true, requiresAuth: false },
      },
      {
        path: '404',
        name: 'Error404',
        component: () => import('@/views/error/404.vue'),
        meta: { title: '页面不存在', hideInMenu: true, requiresAuth: false },
      },
    ],
  },
  notFoundRoute,
]

/**
 * 需要按角色 / 权限过滤的业务路由。
 * 登录成功拿到角色后由 permissionStore 过滤并 addRoute。
 */
export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Root',
    component: BasicLayout,
    redirect: '/dashboard',
    // 无 title 的容器路由：菜单生成时会把子项提升到顶层
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: '控制台',
          icon: 'i-lucide-layout-dashboard',
          keepAlive: true,
          affix: true,
          order: 1,
        },
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/analytics/index.vue'),
        meta: {
          title: '数据分析',
          icon: 'i-lucide-chart-spline',
          keepAlive: true,
          order: 2,
          permissions: ['report:view'],
        },
      },
    ],
  },
  {
    path: '/agent',
    name: 'Agent',
    component: BasicLayout,
    redirect: '/agent/workbench',
    meta: { title: 'AI Agent', icon: 'i-lucide-bot', order: 3 },
    children: [
      {
        path: 'workbench',
        name: 'AgentWorkbench',
        component: () => import('@/views/agent/workbench/index.vue'),
        meta: {
          title: 'Agent 工作台',
          icon: 'i-lucide-sparkles',
          keepAlive: true,
          permissions: ['agent:view'],
        },
      },
    ],
  },
  {
    path: '/order',
    name: 'Order',
    component: BasicLayout,
    redirect: '/order/list',
    meta: { title: '交易中心', icon: 'i-lucide-receipt-text', order: 4 },
    children: [
      {
        path: 'list',
        name: 'OrderList',
        component: () => import('@/views/order/list/index.vue'),
        meta: {
          title: '订单列表',
          icon: 'i-lucide-list-checks',
          keepAlive: true,
          permissions: ['order:view'],
        },
      },
      {
        path: 'detail/:id',
        name: 'OrderDetail',
        component: () => import('@/views/order/detail/index.vue'),
        meta: {
          title: '订单详情',
          icon: 'i-lucide-file-text',
          hideInMenu: true,
          keepAlive: true,
          permissions: ['order:view'],
        },
      },
    ],
  },
  {
    path: '/project',
    name: 'Project',
    component: BasicLayout,
    redirect: '/project/list',
    meta: { title: '项目中心', icon: 'i-lucide-boxes', order: 5 },
    children: [
      {
        path: 'list',
        name: 'ProjectList',
        component: () => import('@/views/project/list/index.vue'),
        meta: {
          title: '项目管理',
          icon: 'i-lucide-panels-top-left',
          keepAlive: true,
          permissions: ['project:view'],
        },
      },
    ],
  },
  {
    path: '/system',
    name: 'System',
    component: BasicLayout,
    redirect: '/system/account',
    meta: {
      title: '系统管理',
      icon: 'i-lucide-settings-2',
      order: 6,
      roles: ['super_admin', 'admin'],
    },
    children: [
      {
        path: 'account',
        name: 'SystemAccount',
        component: () => import('@/views/system/account/index.vue'),
        meta: {
          title: '用户管理',
          icon: 'i-lucide-users-round',
          keepAlive: true,
          permissions: ['user:view'],
          badge: 'New',
        },
      },
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import('@/views/system/role/index.vue'),
        meta: {
          title: '角色权限',
          icon: 'i-lucide-shield-check',
          keepAlive: true,
          roles: ['super_admin'],
        },
      },
      {
        path: 'operation-log',
        name: 'SystemOperationLog',
        component: () => import('@/views/system/operation-log/index.vue'),
        meta: {
          title: '操作日志',
          icon: 'i-lucide-scroll-text',
          keepAlive: true,
          permissions: ['log:view'],
        },
      },
      {
        path: 'setting',
        name: 'SystemSetting',
        component: () => import('@/views/system/setting/index.vue'),
        meta: {
          title: '系统设置',
          icon: 'i-lucide-sliders-horizontal',
          roles: ['super_admin'],
          permissions: ['system:config'],
        },
      },
    ],
  },
  {
    path: '/lab',
    name: 'Lab',
    component: BasicLayout,
    redirect: '/lab/showcase',
    meta: { title: '交互实验室', icon: 'i-lucide-flask-conical', order: 7 },
    children: [
      {
        path: 'showcase',
        name: 'LabShowcase',
        component: () => import('@/views/lab/showcase/index.vue'),
        meta: { title: '组件与动效', icon: 'i-lucide-sparkles', keepAlive: true },
      },
      {
        path: 'permission',
        name: 'LabPermission',
        component: () => import('@/views/lab/permission/index.vue'),
        meta: { title: '权限演示', icon: 'i-lucide-key-round', keepAlive: true },
      },
    ],
  },
  {
    path: '/account',
    name: 'Account',
    component: BasicLayout,
    redirect: '/account/profile',
    meta: { hideInMenu: true },
    children: [
      {
        path: 'profile',
        name: 'AccountProfile',
        component: () => import('@/views/account/profile/index.vue'),
        meta: { title: '个人中心', icon: 'i-lucide-id-card', hideInMenu: true, keepAlive: true },
      },
    ],
  },
]

