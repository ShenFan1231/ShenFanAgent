import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    base: env.VITE_APP_BASE ?? '/',
    plugins: [vue(), UnoCSS()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5273,
      host: true,
      proxy: {
        // Point this at a real gateway once the backend is available;
        // the mock adapter short-circuits requests before they reach the network.
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:8888',
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          /**
           * 把体积大且更新频率低的依赖单独拆包，利于长期缓存。
           * 用函数形式而不是对象形式：Vite 8 的 rolldown 只接受函数。
           */
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return
            if (/[\\/]node_modules[\\/](echarts|zrender)[\\/]/.test(id)) return 'echarts'
            if (/[\\/]node_modules[\\/]gsap[\\/]/.test(id)) return 'gsap'
            if (/[\\/]node_modules[\\/](vue|vue-router|pinia|@vue)[\\/]/.test(id)) return 'vue'
          },
        },
      },
    },
  }
})
