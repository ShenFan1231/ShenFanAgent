import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { setupRouterGuard } from './guard'
import { constantRoutes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_APP_BASE || '/'),
  routes: constantRoutes as RouteRecordRaw[],
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
})

setupRouterGuard(router)

export default router
