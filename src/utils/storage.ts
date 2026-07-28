const NAMESPACE = 'nebula:'

type StorageKind = 'local' | 'session'

interface Envelope<T> {
  v: T
  /** 过期时间戳，0 表示永不过期 */
  e: number
}

function driver(kind: StorageKind): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    // 隐私模式 / 禁用存储时退化为无缓存，不影响主流程
    return null
  }
}

function createStorage(kind: StorageKind) {
  return {
    get<T>(key: string, fallback: T): T {
      const store = driver(kind)
      if (!store) return fallback
      try {
        const raw = store.getItem(NAMESPACE + key)
        if (!raw) return fallback
        const parsed = JSON.parse(raw) as Envelope<T>
        if (parsed && typeof parsed === 'object' && 'v' in parsed) {
          if (parsed.e && Date.now() > parsed.e) {
            store.removeItem(NAMESPACE + key)
            return fallback
          }
          return parsed.v
        }
        return fallback
      } catch {
        return fallback
      }
    },

    set<T>(key: string, value: T, ttlMs = 0): void {
      const store = driver(kind)
      if (!store) return
      try {
        const envelope: Envelope<T> = { v: value, e: ttlMs ? Date.now() + ttlMs : 0 }
        store.setItem(NAMESPACE + key, JSON.stringify(envelope))
      } catch {
        /* 配额溢出时静默失败 */
      }
    },

    remove(key: string): void {
      driver(kind)?.removeItem(NAMESPACE + key)
    },

    clear(): void {
      const store = driver(kind)
      if (!store) return
      Object.keys(store)
        .filter((k) => k.startsWith(NAMESPACE))
        .forEach((k) => store.removeItem(k))
    },
  }
}

export const local = createStorage('local')
export const session = createStorage('session')

export const StorageKeys = {
  APP: 'app',
  TOKEN: 'token',
  USER: 'user',
  TABS: 'tabs',
} as const
