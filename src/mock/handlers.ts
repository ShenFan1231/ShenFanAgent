import type { LoginParams } from '@/api/types/auth'
import type {
  AgentConversation,
  AgentConversationListItem,
  AgentRun,
} from '@/api/types/agent'
import type { RangeKey } from '@/api/types/common'
import type {
  CreateProjectPayload,
  ProjectItem,
  ProjectStatus,
  ProjectType,
  UpdateProjectPayload,
} from '@/api/types/project'
import type {
  AccountItem,
  AccountStatus,
  OperationLevel,
  OperationLogItem,
  OrderItem,
  OrderStatus,
  SystemSettings,
} from '@/api/types/system'
import type { RoleKey } from '@/types/permission'
import {
  buildAccounts,
  buildActivities,
  buildNotifications,
  buildOrders,
  buildOverview,
  buildProfile,
  buildRegionRank,
  buildSystemStatus,
  buildTrafficSources,
  buildTrend,
  resolveRole,
} from './data'

export interface MockContext {
  path: string
  method: string
  params: Record<string, unknown>
  body: Record<string, unknown>
  /** 从 Authorization 头解析出的 token */
  token: string
  match: RegExpExecArray | null
}

export interface MockRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string | RegExp
  /** false 表示公开接口，不校验 token */
  auth?: boolean
  handler: (ctx: MockContext) => unknown | Promise<unknown>
}

/** 演示环境把角色编进 token，退出登录后刷新也能还原身份 */
function issueToken(role: RoleKey): string {
  return `mock.${role}.${Math.random().toString(36).slice(2, 12)}`
}

function roleFromToken(token: string): RoleKey {
  const role = token.split('.')[1] as RoleKey | undefined
  return role && ['super_admin', 'admin', 'operator'].includes(role) ? role : 'operator'
}

function paginate<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize,
  }
}

function num(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

let mockSettings: SystemSettings = {
  siteName: 'NEBULA 控制台',
  apiBase: '/api',
  timeout: '15000',
  sessionTtl: '7200',
  logLevel: 'info',
  mfa: true,
  ipWhitelist: false,
  auditLog: true,
  autoBackup: true,
}

let mockProjects: ProjectItem[] = [
  {
    id: 'PROJECT-MOCK-1',
    code: 'GAME-NEBULA',
    name: '星穹远征',
    description: '跨平台科幻策略游戏，展示实时运营指标与活动编排。',
    type: 'game',
    status: 'active',
    owner: null,
    members: 18,
    progress: 72,
    budget: 2_800_000,
    tags: ['Unity', 'LiveOps'],
    startedAt: new Date(Date.now() - 160 * 86_400_000).toISOString(),
    dueAt: new Date(Date.now() + 95 * 86_400_000).toISOString(),
    createdAt: new Date(Date.now() - 160 * 86_400_000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PROJECT-MOCK-2',
    code: 'AGENT-ATLAS',
    name: 'Atlas Agent',
    description: '面向运维与数据分析场景的工具调用型 AI Agent。',
    type: 'ai_agent',
    status: 'planning',
    owner: null,
    members: 7,
    progress: 28,
    budget: 920_000,
    tags: ['Agent', 'SSE', 'Tools'],
    startedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    dueAt: new Date(Date.now() + 150 * 86_400_000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockOperationLogs: OperationLogItem[] = [
  {
    id: 'LOG-MOCK-1',
    level: 'success',
    module: 'project',
    action: 'patch:projects',
    resource: 'projects',
    resourceId: 'PROJECT-MOCK-2',
    summary: '完成 PATCH /api/projects/PROJECT-MOCK-2',
    method: 'PATCH',
    path: '/api/projects/PROJECT-MOCK-2',
    ipAddress: '127.0.0.1',
    statusCode: 200,
    durationMs: 18,
    success: true,
    operator: { username: 'admin', nickname: '超级管理员', avatar: '' },
    createdAt: new Date().toISOString(),
  },
]

const mockAgentConversation: AgentConversation = {
  id: '11111111-1111-4111-8111-111111111111',
  title: '分析本周项目风险',
  summary: '已识别项目排期、资源和范围风险，并给出三项行动建议。',
  status: 'active',
  messages: [
    {
      id: 'mock-agent-message-1',
      runId: 'mock-agent-run-seed',
      role: 'user',
      content: '分析本周项目风险，并给出优先级。',
      sequence: 1,
      metadata: null,
      createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    },
    {
      id: 'mock-agent-message-2',
      runId: 'mock-agent-run-seed',
      role: 'assistant',
      content: '已完成分析：一个项目存在较高排期风险，建议今天确认关键路径负责人。',
      sequence: 2,
      metadata: { streamed: true },
      createdAt: new Date(Date.now() - 3_500_000).toISOString(),
    },
  ],
  runs: [],
  lastMessageAt: new Date(Date.now() - 3_500_000).toISOString(),
  createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  updatedAt: new Date(Date.now() - 3_500_000).toISOString(),
}

let mockAgentConversations: AgentConversation[] = [mockAgentConversation]

function toConversationList(item: AgentConversation): AgentConversationListItem {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    status: item.status,
    messageCount: item.messages.length,
    latestRun: item.runs[0]
      ? {
          status: item.runs[0].status,
          progress: item.runs[0].progress,
          updatedAt: item.runs[0].updatedAt,
        }
      : null,
    lastMessageAt: item.lastMessageAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export const handlers: MockRoute[] = [
  /* ------------------------------------------------------------- auth --- */
  {
    method: 'POST',
    path: '/auth/login',
    auth: false,
    handler: (ctx) => {
      const params = ctx.body as unknown as LoginParams
      if (!params.username || !params.password) {
        throw new Error('用户名与密码不能为空')
      }
      if (params.password.length < 6) {
        return {
          code: 422,
          message: '密码长度至少 6 位',
          data: null,
          timestamp: Date.now(),
          traceId: 'mock-login',
        }
      }
      const role = resolveRole(params)
      return {
        token: issueToken(role),
        refreshToken: issueToken(role),
        expiresIn: 7200,
      }
    },
  },
  {
    method: 'GET',
    path: '/auth/profile',
    handler: (ctx) => buildProfile(ctx.token ? roleFromToken(ctx.token) : 'operator'),
  },
  { method: 'POST', path: '/auth/logout', handler: () => ({ success: true }) },

  /* -------------------------------------------------------- dashboard --- */
  { method: 'GET', path: '/dashboard/overview', handler: () => buildOverview() },
  {
    method: 'GET',
    path: '/dashboard/trend',
    handler: (ctx) => buildTrend((str(ctx.params.range) || '7d') as RangeKey),
  },
  {
    method: 'GET',
    path: '/dashboard/activities',
    handler: (ctx) => buildActivities(num(ctx.params.limit, 12)),
  },
  { method: 'GET', path: '/dashboard/system-status', handler: () => buildSystemStatus() },
  { method: 'GET', path: '/dashboard/traffic-sources', handler: () => buildTrafficSources() },
  { method: 'GET', path: '/dashboard/regions', handler: () => buildRegionRank() },

  /* ----------------------------------------------------------- system --- */
  {
    method: 'GET',
    path: '/system/accounts',
    handler: (ctx) => {
      const keyword = str(ctx.params.keyword).toLowerCase()
      const status = str(ctx.params.status) as AccountStatus | ''
      const role = str(ctx.params.role) as RoleKey | ''

      let list: AccountItem[] = buildAccounts()
      if (keyword) {
        list = list.filter(
          (item) =>
            item.nickname.toLowerCase().includes(keyword) ||
            item.username.toLowerCase().includes(keyword) ||
            item.email.toLowerCase().includes(keyword),
        )
      }
      if (status) list = list.filter((item) => item.status === status)
      if (role) list = list.filter((item) => item.role === role)

      return paginate(list, num(ctx.params.page, 1), num(ctx.params.pageSize, 10))
    },
  },
  {
    method: 'POST',
    path: '/system/accounts',
    handler: (ctx) => ({ id: `ACC-${Date.now()}`, ...ctx.body }),
  },
  {
    method: 'DELETE',
    path: /^\/system\/accounts\/[\w-]+$/,
    handler: (ctx) => ({ id: ctx.path.split('/').pop(), deleted: true }),
  },

  /* ----------------------------------------------------------- orders --- */
  {
    method: 'GET',
    path: '/orders',
    handler: (ctx) => {
      const status = str(ctx.params.status) as OrderStatus | ''
      const keyword = str(ctx.params.keyword).toLowerCase()
      let list: OrderItem[] = buildOrders()
      if (status) list = list.filter((item) => item.status === status)
      if (keyword) {
        list = list.filter(
          (item) =>
            item.orderNo.toLowerCase().includes(keyword) ||
            item.customer.toLowerCase().includes(keyword),
        )
      }
      return paginate(list, num(ctx.params.page, 1), num(ctx.params.pageSize, 10))
    },
  },
  {
    method: 'GET',
    path: /^\/orders\/[\w-]+$/,
    handler: (ctx) => buildOrders().find((item) => item.id === ctx.path.split('/').pop()) ?? null,
  },

  /* ---------------------------------------------------- notifications --- */
  { method: 'GET', path: '/notifications', handler: () => buildNotifications() },
  { method: 'POST', path: '/notifications/read-all', handler: () => ({ success: true }) },

  /* ------------------------------------------------------------ agent --- */
  {
    method: 'GET',
    path: '/agent/conversations',
    handler: () => mockAgentConversations.map(toConversationList),
  },
  {
    method: 'POST',
    path: '/agent/conversations',
    handler: (ctx) => {
      const now = new Date().toISOString()
      const conversation: AgentConversation = {
        id: crypto.randomUUID(),
        title: str(ctx.body.title) || '新会话',
        summary: '',
        status: 'active',
        messages: [],
        runs: [],
        lastMessageAt: '',
        createdAt: now,
        updatedAt: now,
      }
      mockAgentConversations = [conversation, ...mockAgentConversations]
      return conversation
    },
  },
  {
    method: 'GET',
    path: /^\/agent\/conversations\/[\w-]+$/,
    handler: (ctx) =>
      mockAgentConversations.find((item) => item.id === ctx.path.split('/').pop()) ?? null,
  },
  {
    method: 'POST',
    path: /^\/agent\/conversations\/[\w-]+\/runs$/,
    handler: (ctx) => {
      const conversationId = ctx.path.split('/')[3]!
      const conversation = mockAgentConversations.find((item) => item.id === conversationId)
      const now = new Date().toISOString()
      const run: AgentRun = {
        id: crypto.randomUUID(),
        conversationId,
        status: 'pending',
        provider: 'mock',
        model: 'nebula-agent-v1',
        taskTitle: '正在分析任务',
        currentStep: '',
        totalSteps: 4,
        completedSteps: 0,
        progress: 0,
        error: '',
        startedAt: '',
        completedAt: '',
        createdAt: now,
        updatedAt: now,
        toolCalls: [],
      }
      if (conversation) {
        conversation.messages.push({
          id: crypto.randomUUID(),
          runId: run.id,
          role: 'user',
          content: str(ctx.body.prompt),
          sequence: conversation.messages.length + 1,
          metadata: null,
          createdAt: now,
        })
        conversation.runs.unshift(run)
        conversation.lastMessageAt = now
      }
      return run
    },
  },

  /* ---------------------------------------------------------- settings --- */
  { method: 'GET', path: '/system/settings', handler: () => mockSettings },
  {
    method: 'PUT',
    path: '/system/settings',
    handler: (ctx) => {
      mockSettings = { ...mockSettings, ...(ctx.body as Partial<SystemSettings>) }
      return mockSettings
    },
  },

  /* ---------------------------------------------------- operation logs --- */
  {
    method: 'GET',
    path: '/system/operation-logs',
    handler: (ctx) => {
      const keyword = str(ctx.params.keyword).toLowerCase()
      const module = str(ctx.params.module)
      const level = str(ctx.params.level) as OperationLevel | ''
      let list = [...mockOperationLogs]
      if (keyword) {
        list = list.filter(
          (item) =>
            item.summary.toLowerCase().includes(keyword) ||
            item.operator.nickname.toLowerCase().includes(keyword),
        )
      }
      if (module) list = list.filter((item) => item.module === module)
      if (level) list = list.filter((item) => item.level === level)
      return paginate(list, num(ctx.params.page, 1), num(ctx.params.pageSize, 20))
    },
  },

  /* --------------------------------------------------------- projects --- */
  {
    method: 'GET',
    path: '/projects',
    handler: (ctx) => {
      const keyword = str(ctx.params.keyword).toLowerCase()
      const type = str(ctx.params.type) as ProjectType | ''
      const status = str(ctx.params.status) as ProjectStatus | ''
      let list = [...mockProjects]
      if (keyword) {
        list = list.filter(
          (item) =>
            item.name.toLowerCase().includes(keyword) ||
            item.code.toLowerCase().includes(keyword),
        )
      }
      if (type) list = list.filter((item) => item.type === type)
      if (status) list = list.filter((item) => item.status === status)
      return paginate(list, num(ctx.params.page, 1), num(ctx.params.pageSize, 12))
    },
  },
  {
    method: 'POST',
    path: '/projects',
    handler: (ctx) => {
      const payload = ctx.body as unknown as CreateProjectPayload
      const now = new Date().toISOString()
      const project: ProjectItem = {
        id: `PROJECT-MOCK-${Date.now()}`,
        code: payload.code,
        name: payload.name,
        description: payload.description ?? '',
        type: payload.type,
        status: 'planning',
        owner: null,
        members: payload.members,
        progress: 0,
        budget: payload.budget,
        tags: payload.tags ?? [],
        startedAt: payload.startedAt ?? '',
        dueAt: payload.dueAt ?? '',
        createdAt: now,
        updatedAt: now,
      }
      mockProjects = [project, ...mockProjects]
      return project
    },
  },
  {
    method: 'PATCH',
    path: /^\/projects\/[\w-]+$/,
    handler: (ctx) => {
      const id = ctx.path.split('/').pop()!
      const payload = ctx.body as unknown as UpdateProjectPayload
      const current = mockProjects.find((item) => item.id === id)
      if (!current) return null
      const next = { ...current, ...payload, updatedAt: new Date().toISOString() }
      mockProjects = mockProjects.map((item) => (item.id === id ? next : item))
      return next
    },
  },
  {
    method: 'DELETE',
    path: /^\/projects\/[\w-]+$/,
    handler: (ctx) => {
      const id = ctx.path.split('/').pop()!
      const current = mockProjects.find((item) => item.id === id)
      if (!current) return null
      const next: ProjectItem = { ...current, status: 'archived' }
      mockProjects = mockProjects.map((item) => (item.id === id ? next : item))
      return next
    },
  },
]
