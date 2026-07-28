/**
 * 可复现随机数：图表基线数据用固定种子生成，
 * 保证每次刷新看到的趋势一致（真实感），只有"实时"指标才叠加抖动。
 */
export function createPrng(seed: number) {
  let state = seed >>> 0 || 1
  return function next(): number {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state / 0xffffffff
  }
}

export function randomInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

export function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)]!
}

/**
 * 生成带趋势与周末效应的时间序列，比纯随机更像真实业务数据。
 */
export function series(
  rand: () => number,
  length: number,
  base: number,
  options: { growth?: number; volatility?: number; weekly?: boolean } = {},
): number[] {
  const { growth = 0.012, volatility = 0.08, weekly = true } = options
  const out: number[] = []
  let value = base
  for (let i = 0; i < length; i++) {
    value *= 1 + growth + (rand() - 0.5) * volatility
    const weekend = weekly && [0, 6].includes((i + 3) % 7) ? 0.82 : 1
    out.push(Math.max(0, Math.round(value * weekend)))
  }
  return out
}
