/**
 * 顶部路由进度条（替代 nprogress，零依赖）。
 * 只用 transform / opacity，动画跑在合成层。
 */
let bar: HTMLElement | null = null
let timer = 0
let progress = 0

function ensureBar(): HTMLElement {
  if (bar) return bar
  bar = document.createElement('div')
  bar.className = 'route-progress'
  bar.innerHTML = '<span class="route-progress__peg"></span>'
  document.body.appendChild(bar)
  return bar
}

function apply(value: number): void {
  const el = ensureBar()
  el.style.opacity = '1'
  el.style.transform = `scaleX(${value})`
}

export function startProgress(): void {
  window.clearInterval(timer)
  progress = 0.08
  apply(progress)
  // 逼近 90%：真实完成时间未知，用递减增量制造"还在加载"的感觉
  timer = window.setInterval(() => {
    progress += (0.92 - progress) * 0.12
    apply(progress)
  }, 220)
}

export function doneProgress(): void {
  window.clearInterval(timer)
  const el = ensureBar()
  progress = 1
  apply(progress)
  window.setTimeout(() => {
    el.style.opacity = '0'
    window.setTimeout(() => {
      el.style.transform = 'scaleX(0)'
    }, 220)
  }, 180)
}
