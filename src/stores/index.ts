import { createPinia } from 'pinia'

export const pinia = createPinia()

export { useAppStore } from './app'
export { usePermissionStore } from './permission'
export { useTabsStore } from './tabs'
export { useUserStore } from './user'
