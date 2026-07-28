/**
 * 离线头像生成：把任意字符串映射成稳定的渐变 SVG data URI。
 * 好处是演示环境不依赖外部图床，主题切换也不会出现白底方块。
 */
function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function gradientAvatar(seed: string, label?: string): string {
  const h = hash(seed)
  const hueA = h % 360
  const hueB = (hueA + 48 + (h % 40)) % 360
  const text = (label ?? seed).slice(0, 2).toUpperCase()
  const id = `g${h % 9999}`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
<defs>
<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="hsl(${hueA} 82% 58%)"/>
<stop offset="100%" stop-color="hsl(${hueB} 78% 46%)"/>
</linearGradient>
</defs>
<rect width="96" height="96" rx="28" fill="url(#${id})"/>
<circle cx="72" cy="24" r="30" fill="rgba(255,255,255,0.16)"/>
<text x="50%" y="54%" dy="0.35em" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="36" font-weight="600" fill="rgba(255,255,255,0.94)">${text}</text>
</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
