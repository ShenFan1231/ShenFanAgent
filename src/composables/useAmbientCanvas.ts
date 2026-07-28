import { useThrottleFn } from '@vueuse/core'
import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

import { useAppStore } from '@/stores/app'
import { prefersReducedMotion } from './useReducedMotion'

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  radius: number
  alpha: number
}

/**
 * 背景"星尘"层。
 *
 * 刻意做得很轻：
 * - 粒子数量按视口面积推导并封顶，4K 屏也不会失控
 * - DPR 上限 1.5，高分屏不做无意义的超采样
 * - 页面隐藏 / 标签切走 / 减少动效 时停掉 rAF，只留一帧静态画面
 * - 指针只做极小幅度的视差，不抢主内容注意力
 */
export function useAmbientCanvas(canvasRef: Ref<HTMLCanvasElement | null>) {
  const appStore = useAppStore()

  let ctx: CanvasRenderingContext2D | null = null
  let particles: Particle[] = []
  let frame = 0
  let width = 0
  let height = 0
  let dpr = 1
  let pointerX = 0
  let pointerY = 0
  let targetPointerX = 0
  let targetPointerY = 0
  let running = false
  let color = '52, 224, 214'

  function readColor(): void {
    const styles = getComputedStyle(document.documentElement)
    const brand = styles.getPropertyValue('--c-brand').trim()
    color = brand ? brand.split(/\s+/).join(', ') : '52, 224, 214'
  }

  function setup(): void {
    const canvas = canvasRef.value
    if (!canvas) return

    dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    width = canvas.clientWidth
    height = canvas.clientHeight
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)

    ctx = canvas.getContext('2d', { alpha: true })
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)

    const density = Math.round((width * height) / 26_000)
    const count = Math.max(24, Math.min(density, 90))

    particles = Array.from({ length: count }, () => spawn())
    readColor()
  }

  function spawn(): Particle {
    const z = 0.35 + Math.random() * 0.9
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      z,
      vx: (Math.random() - 0.5) * 0.16 * z,
      vy: -(0.08 + Math.random() * 0.22) * z,
      radius: 0.5 + Math.random() * 1.5 * z,
      alpha: 0.1 + Math.random() * 0.4,
    }
  }

  function draw(): void {
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)

    pointerX += (targetPointerX - pointerX) * 0.05
    pointerY += (targetPointerY - pointerY) * 0.05

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy

      if (p.y < -10) {
        p.y = height + 10
        p.x = Math.random() * width
      }
      if (p.x < -10) p.x = width + 10
      if (p.x > width + 10) p.x = -10

      const px = p.x + pointerX * 26 * p.z
      const py = p.y + pointerY * 18 * p.z

      ctx.beginPath()
      ctx.arc(px, py, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${color}, ${p.alpha})`
      ctx.fill()

      // 少量粒子带一点光晕，制造景深
      if (p.z > 1.05) {
        ctx.beginPath()
        ctx.arc(px, py, p.radius * 4.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, ${p.alpha * 0.07})`
        ctx.fill()
      }
    }
  }

  function loop(): void {
    draw()
    frame = requestAnimationFrame(loop)
  }

  function start(): void {
    if (running || !ctx) return
    if (prefersReducedMotion() || !appStore.showBackground) {
      draw()
      return
    }
    running = true
    frame = requestAnimationFrame(loop)
  }

  function stop(): void {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    running = false
  }

  const onResize = useThrottleFn(
    () => {
      stop()
      setup()
      start()
    },
    200,
    true,
  )

  function onPointerMove(event: PointerEvent): void {
    targetPointerX = (event.clientX / window.innerWidth - 0.5) * 2
    targetPointerY = (event.clientY / window.innerHeight - 0.5) * 2
  }

  function onVisibility(): void {
    if (document.hidden) stop()
    else start()
  }

  onMounted(() => {
    setup()
    start()
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
  })

  onBeforeUnmount(() => {
    stop()
    window.removeEventListener('resize', onResize)
    window.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('visibilitychange', onVisibility)
    particles = []
    ctx = null
  })

  // 主题切换后粒子换色；关闭背景动效时释放 rAF
  watch(
    () => appStore.theme,
    () => {
      readColor()
      if (!running) draw()
    },
  )

  watch(
    () => appStore.showBackground,
    (enabled) => {
      if (enabled) start()
      else {
        stop()
        ctx?.clearRect(0, 0, width, height)
      }
    },
  )

  return { start, stop }
}
