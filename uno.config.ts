import {
  defineConfig,
  presetIcons,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

/**
 * Colors are declared as CSS custom properties in `src/styles/theme.css` so a
 * single `data-theme` swap on <html> re-themes every utility class without a
 * rebuild. `rgb(var(--x) / <alpha-value>)` keeps opacity modifiers working.
 */
function themeColor(name: string) {
  return `rgb(var(--c-${name}) / <alpha-value>)`
}

export default defineConfig({
  presets: [
    presetWind3({ dark: { dark: '[data-theme="dark"]', light: '[data-theme="light"]' } }),
    presetIcons({
      scale: 1.2,
      /**
       * 显式声明图标集，而不是依赖 presetIcons 的文件系统自动发现 —— 后者在 pnpm 的
       * 隔离 node_modules 下会静默找不到 @iconify-json/*，结果是图标全部渲染成 0×0，
       * 且没有任何报错。显式 import 同时保证只打包 lucide 一套图标。
       */
      collections: {
        lucide: () =>
          import('@iconify-json/lucide/icons.json', { with: { type: 'json' } }).then((m) => m.default),
      },
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  content: {
    pipeline: {
      /**
       * 默认管线只扫描 .vue/.tsx 等模板文件，但本项目的图标名大量写在 .ts 里
       * （路由 meta.icon、mock 数据、菜单配置），不加进来这些 `i-lucide-*` 不会被生成。
       */
      include: [/\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/, /src\/.*\.ts($|\?)/],
    },
  },
  theme: {
    colors: {
      canvas: themeColor('canvas'),
      surface: themeColor('surface'),
      elevated: themeColor('elevated'),
      line: themeColor('line'),
      text: {
        DEFAULT: themeColor('text'),
        soft: themeColor('text-soft'),
        dim: themeColor('text-dim'),
      },
      brand: themeColor('brand'),
      violet: themeColor('violet'),
      success: themeColor('success'),
      warning: themeColor('warning'),
      danger: themeColor('danger'),
    },
    fontFamily: {
      sans: 'Inter, "Plus Jakarta Sans", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
      mono: '"JetBrains Mono", "SFMono-Regular", ui-monospace, monospace',
    },
    boxShadow: {
      glow: '0 0 0 1px rgb(var(--c-brand) / 0.22), 0 18px 50px -18px rgb(var(--c-brand) / 0.55)',
      panel: 'var(--shadow-panel)',
    },
  },
  shortcuts: [
    // Frosted panel: the base material used by every card in the app.
    [
      'panel',
      'relative rounded-2xl border border-line/70 bg-surface/70 backdrop-blur-xl shadow-panel',
    ],
    ['panel-pad', 'panel p-5'],
    ['flex-center', 'flex items-center justify-center'],
    ['flex-between', 'flex items-center justify-between'],
    [
      'focus-ring',
      'outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
    ],
    ['text-gradient', 'bg-gradient-to-r from-brand via-violet to-brand bg-clip-text text-transparent'],
  ],
  safelist: ['i-lucide-loader-circle'],
})
