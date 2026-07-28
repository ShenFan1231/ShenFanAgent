import { onBeforeUnmount, ref, shallowRef, watch, type Ref } from 'vue'

import { RequestError } from '@/utils/request'

export interface UseAsyncDataOptions<T> {
  /** 立即执行，默认 true */
  immediate?: boolean
  /** 初始值，避免模板里到处判空 */
  initialData?: T
  /**
   * 最短 loading 时长。接口太快时骨架屏一闪而过反而更难受，
   * 给一个下限让加载态显得"稳"。
   */
  minLoading?: number
  /** 依赖变化时自动重新请求 */
  watchSource?: Ref<unknown> | Ref<unknown>[]
  onSuccess?: (data: T) => void
  onError?: (error: RequestError) => void
}

/**
 * 页面级异步数据的统一形态：loading / error / data / refresh。
 * 组件里不再手写 try-catch-finally，也不会忘记处理"卸载后 setState"。
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, options: UseAsyncDataOptions<T> = {}) {
  const { immediate = true, initialData, minLoading = 260, watchSource, onSuccess, onError } = options

  const data = shallowRef<T | undefined>(initialData)
  const loading = ref(false)
  const error = ref<RequestError | null>(null)
  /** 首次加载完成前为 true，用于区分"骨架屏"和"局部刷新" */
  const pristine = ref(true)

  let disposed = false
  let requestId = 0

  async function execute(): Promise<T | undefined> {
    const current = ++requestId
    loading.value = true
    error.value = null
    const startedAt = performance.now()

    try {
      const result = await fetcher()
      if (disposed || current !== requestId) return undefined

      const elapsed = performance.now() - startedAt
      if (elapsed < minLoading) {
        await new Promise((resolve) => setTimeout(resolve, minLoading - elapsed))
      }
      if (disposed || current !== requestId) return undefined

      data.value = result
      onSuccess?.(result)
      return result
    } catch (err) {
      if (disposed || current !== requestId) return undefined
      const requestError =
        err instanceof RequestError ? err : new RequestError((err as Error).message, -2)
      // 主动取消不算错误，保留上一次的数据
      if (!requestError.canceled) {
        error.value = requestError
        onError?.(requestError)
      }
      return undefined
    } finally {
      if (!disposed && current === requestId) {
        loading.value = false
        pristine.value = false
      }
    }
  }

  if (watchSource) {
    watch(watchSource as Ref<unknown>, () => void execute(), { deep: false })
  }

  if (immediate) void execute()

  onBeforeUnmount(() => {
    disposed = true
  })

  return { data, loading, error, pristine, refresh: execute }
}
