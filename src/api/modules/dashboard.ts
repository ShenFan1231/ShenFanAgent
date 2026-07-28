import type { RangeKey } from '@/api/types/common'
import type {
  ActivityItem,
  DashboardOverview,
  RegionRank,
  SystemStatusData,
  TrafficSource,
  TrendChartData,
} from '@/api/types/dashboard'
import { api } from '@/utils/request'

export const dashboardApi = {
  /** 顶部四个核心指标 */
  overview() {
    return api.get<DashboardOverview>('/dashboard/overview')
  },

  /**
   * 趋势数据。切换时间范围时复用同一个 cancelKey，
   * 快速点击 7天/30天/90天 时旧请求会被自动取消。
   */
  trend(range: RangeKey) {
    return api.get<TrendChartData>('/dashboard/trend', { range }, { cancelKey: 'dashboard:trend' })
  },

  activities(limit = 12) {
    return api.get<ActivityItem[]>('/dashboard/activities', { limit })
  },

  systemStatus() {
    return api.get<SystemStatusData>('/dashboard/system-status', undefined, { silentError: true })
  },

  trafficSources() {
    return api.get<TrafficSource[]>('/dashboard/traffic-sources')
  },

  regions() {
    return api.get<RegionRank[]>('/dashboard/regions')
  },
}
