import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import '@/styles/index.css'

import { createApp } from 'vue'

import App from './App.vue'
import { setupDirectives } from './directives'
import { setupMock } from './mock'
import router from './router'
import { pinia } from './stores'

// 挂载 mock 适配器（VITE_USE_MOCK=0 时此调用直接返回）
setupMock()

const app = createApp(App)

app.use(pinia)
app.use(router)
setupDirectives(app)

app.config.errorHandler = (error, _instance, info) => {
  // 生产环境这里接 Sentry / 自建日志上报
  console.error('[nebula] 未捕获的组件错误', info, error)
}

/**
 * 等首次导航（含登录态校验、动态路由注册）完成后再挂载：
 * index.html 里的启动画面会一直显示，刷新任意路由都不会闪白屏。
 */
router
  .isReady()
  .catch(() => undefined)
  .finally(() => app.mount('#app'))
