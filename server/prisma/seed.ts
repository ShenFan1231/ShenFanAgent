import { hash } from 'bcryptjs'

import {
  AgentMessageRole,
  AgentRunStatus,
  AgentToolStatus,
  MenuType,
  NotificationType,
  OrderStatus,
  OperationLevel,
  Prisma,
  PrismaClient,
  ProjectStatus,
  ProjectType,
  UserStatus,
} from '../generated/prisma'

const prisma = new PrismaClient()

const permissions = [
  ['user:view', '查看用户', 'user', 'view'],
  ['user:create', '创建用户', 'user', 'create'],
  ['user:update', '更新用户', 'user', 'update'],
  ['user:delete', '删除用户', 'user', 'delete'],
  ['user:export', '导出用户', 'user', 'export'],
  ['order:view', '查看订单', 'order', 'view'],
  ['order:create', '创建订单', 'order', 'create'],
  ['order:refund', '订单退款', 'order', 'refund'],
  ['order:export', '导出订单', 'order', 'export'],
  ['notice:publish', '发布通知', 'notice', 'publish'],
  ['report:view', '查看报表', 'report', 'view'],
  ['system:config', '系统配置', 'system', 'config'],
  ['role:assign', '分配角色', 'role', 'assign'],
  ['log:view', '查看操作日志', 'log', 'view'],
  ['project:view', '查看项目', 'project', 'view'],
  ['project:create', '创建项目', 'project', 'create'],
  ['project:update', '更新项目', 'project', 'update'],
  ['project:delete', '删除项目', 'project', 'delete'],
  ['agent:view', '查看 Agent 工作台', 'agent', 'view'],
  ['agent:run', '运行 Agent 任务', 'agent', 'run'],
] as const

const roles = [
  {
    code: 'super_admin',
    name: '超级管理员',
    description: '拥有系统全部菜单与操作权限',
    isSystem: true,
    sort: 1,
  },
  {
    code: 'admin',
    name: '管理员',
    description: '负责用户、订单和运营数据管理',
    isSystem: true,
    sort: 2,
  },
  {
    code: 'operator',
    name: '运营',
    description: '以数据查看和日常运营操作为主',
    isSystem: true,
    sort: 3,
  },
] as const

interface MenuSeedDefinition {
  routeName: string
  parentRouteName?: string
  name: string
  path: string
  componentKey: string
  icon?: string
  permissionCode?: string
  type: MenuType
  hidden?: boolean
  sort: number
}

const menuDefinitions: MenuSeedDefinition[] = [
  {
    routeName: 'Dashboard',
    name: '控制台',
    path: '/dashboard',
    componentKey: 'dashboard',
    icon: 'i-lucide-layout-dashboard',
    type: MenuType.MENU,
    sort: 1,
  },
  {
    routeName: 'Analytics',
    name: '数据分析',
    path: '/analytics',
    componentKey: 'analytics',
    icon: 'i-lucide-chart-no-axes-combined',
    permissionCode: 'report:view',
    type: MenuType.MENU,
    sort: 2,
  },
  {
    routeName: 'AgentWorkbench',
    name: 'Agent 工作台',
    path: '/agent/workbench',
    componentKey: 'agent/workbench',
    icon: 'i-lucide-bot',
    permissionCode: 'agent:view',
    type: MenuType.MENU,
    sort: 3,
  },
  {
    routeName: 'Order',
    name: '交易中心',
    path: '/order',
    componentKey: 'layout',
    icon: 'i-lucide-receipt-text',
    type: MenuType.DIRECTORY,
    sort: 4,
  },
  {
    routeName: 'OrderList',
    parentRouteName: 'Order',
    name: '订单列表',
    path: '/order/list',
    componentKey: 'order/list',
    icon: 'i-lucide-list-filter',
    permissionCode: 'order:view',
    type: MenuType.MENU,
    sort: 1,
  },
  {
    routeName: 'OrderDetail',
    parentRouteName: 'Order',
    name: '订单详情',
    path: '/order/detail/:id',
    componentKey: 'order/detail',
    permissionCode: 'order:view',
    type: MenuType.MENU,
    hidden: true,
    sort: 2,
  },
  {
    routeName: 'ProjectList',
    name: '项目管理',
    path: '/project/list',
    componentKey: 'project/list',
    icon: 'i-lucide-boxes',
    permissionCode: 'project:view',
    type: MenuType.MENU,
    sort: 5,
  },
  {
    routeName: 'System',
    name: '系统管理',
    path: '/system',
    componentKey: 'layout',
    icon: 'i-lucide-settings-2',
    type: MenuType.DIRECTORY,
    sort: 6,
  },
  {
    routeName: 'SystemAccount',
    parentRouteName: 'System',
    name: '用户管理',
    path: '/system/account',
    componentKey: 'system/account',
    icon: 'i-lucide-users',
    permissionCode: 'user:view',
    type: MenuType.MENU,
    sort: 1,
  },
  {
    routeName: 'SystemRole',
    parentRouteName: 'System',
    name: '角色权限',
    path: '/system/role',
    componentKey: 'system/role',
    icon: 'i-lucide-shield-check',
    permissionCode: 'role:assign',
    type: MenuType.MENU,
    sort: 2,
  },
  {
    routeName: 'SystemSetting',
    parentRouteName: 'System',
    name: '系统设置',
    path: '/system/setting',
    componentKey: 'system/setting',
    icon: 'i-lucide-sliders-horizontal',
    permissionCode: 'system:config',
    type: MenuType.MENU,
    sort: 3,
  },
  {
    routeName: 'SystemOperationLog',
    parentRouteName: 'System',
    name: '操作日志',
    path: '/system/operation-log',
    componentKey: 'system/operation-log',
    icon: 'i-lucide-scroll-text',
    permissionCode: 'log:view',
    type: MenuType.MENU,
    sort: 4,
  },
  {
    routeName: 'Lab',
    name: '交互实验室',
    path: '/lab',
    componentKey: 'layout',
    icon: 'i-lucide-flask-conical',
    type: MenuType.DIRECTORY,
    sort: 7,
  },
  {
    routeName: 'LabShowcase',
    parentRouteName: 'Lab',
    name: '组件与动效',
    path: '/lab/showcase',
    componentKey: 'lab/showcase',
    icon: 'i-lucide-sparkles',
    type: MenuType.MENU,
    sort: 1,
  },
  {
    routeName: 'LabPermission',
    parentRouteName: 'Lab',
    name: '权限演示',
    path: '/lab/permission',
    componentKey: 'lab/permission',
    icon: 'i-lucide-key-round',
    type: MenuType.MENU,
    sort: 2,
  },
  {
    routeName: 'AccountProfile',
    name: '个人中心',
    path: '/account/profile',
    componentKey: 'account/profile',
    icon: 'i-lucide-id-card',
    type: MenuType.MENU,
    hidden: true,
    sort: 99,
  },
]

const rolePermissions: Record<string, string[]> = {
  super_admin: permissions.map(([code]) => code),
  admin: [
    'user:view',
    'user:create',
    'user:update',
    'user:export',
    'order:view',
    'order:create',
    'order:export',
    'notice:publish',
    'report:view',
    'log:view',
    'project:view',
    'project:create',
    'project:update',
    'agent:view',
    'agent:run',
  ],
  operator: ['user:view', 'order:view', 'report:view', 'project:view', 'agent:view', 'agent:run'],
}

const roleMenus: Record<string, string[]> = {
  super_admin: menuDefinitions.map(({ routeName }) => routeName),
  admin: [
    'Dashboard',
    'Analytics',
    'Order',
    'OrderList',
    'OrderDetail',
    'AgentWorkbench',
    'ProjectList',
    'System',
    'SystemAccount',
    'SystemOperationLog',
    'Lab',
    'LabShowcase',
    'LabPermission',
    'AccountProfile',
  ],
  operator: [
    'Dashboard',
    'Analytics',
    'Order',
    'OrderList',
    'OrderDetail',
    'AgentWorkbench',
    'ProjectList',
    'Lab',
    'LabShowcase',
    'LabPermission',
    'AccountProfile',
  ],
}

async function main(): Promise<void> {
  const rounds = Number(process.env.PASSWORD_HASH_ROUNDS ?? 12)
  if (!Number.isInteger(rounds) || rounds < 10 || rounds > 15) {
    throw new Error('PASSWORD_HASH_ROUNDS must be an integer between 10 and 15')
  }
  const passwordHash = await hash('nebula123', rounds)

  for (const [code, name, module, action] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { name, module, action, enabled: true },
      create: { code, name, module, action },
    })
  }

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        enabled: true,
        isSystem: role.isSystem,
        sort: role.sort,
      },
      create: role,
    })
  }

  const permissionRows = await prisma.permission.findMany()
  const permissionByCode = new Map(permissionRows.map((item) => [item.code, item]))
  const menuByRouteName = new Map<string, { id: string }>()

  for (const definition of menuDefinitions) {
    const parentId = definition.parentRouteName
      ? menuByRouteName.get(definition.parentRouteName)?.id
      : undefined
    if (definition.parentRouteName && !parentId) {
      throw new Error(`Menu parent is missing: ${definition.parentRouteName}`)
    }

    const permissionId = definition.permissionCode
      ? permissionByCode.get(definition.permissionCode)?.id
      : undefined
    const data = {
      name: definition.name,
      path: definition.path,
      componentKey: definition.componentKey,
      icon: definition.icon,
      type: definition.type,
      hidden: definition.hidden ?? false,
      sort: definition.sort,
      enabled: true,
      parentId,
      permissionId,
    }
    const menu = await prisma.menu.upsert({
      where: { routeName: definition.routeName },
      update: data,
      create: {
        routeName: definition.routeName,
        ...data,
      },
    })
    menuByRouteName.set(definition.routeName, menu)
  }

  const roleRows = await prisma.role.findMany()
  const roleByCode = new Map(roleRows.map((item) => [item.code, item]))

  for (const [roleCode, codes] of Object.entries(rolePermissions)) {
    const role = roleByCode.get(roleCode)
    if (!role) throw new Error(`Role is missing: ${roleCode}`)
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    })
    await prisma.rolePermission.createMany({
      data: codes.map((code) => ({
        roleId: role.id,
        permissionId: permissionByCode.get(code)!.id,
      })),
    })
  }

  for (const [roleCode, routeNames] of Object.entries(roleMenus)) {
    const role = roleByCode.get(roleCode)
    if (!role) throw new Error(`Role is missing: ${roleCode}`)
    await prisma.roleMenu.deleteMany({
      where: { roleId: role.id },
    })
    await prisma.roleMenu.createMany({
      data: routeNames.map((routeName) => ({
        roleId: role.id,
        menuId: menuByRouteName.get(routeName)!.id,
      })),
    })
  }

  const demoUsers = [
    {
      username: 'admin',
      nickname: '超级管理员',
      email: 'admin@nebula.local',
      department: '平台架构部',
      jobTitle: '系统负责人',
      roleCode: 'super_admin',
    },
    {
      username: 'manager',
      nickname: '业务管理员',
      email: 'manager@nebula.local',
      department: '运营中心',
      jobTitle: '运营经理',
      roleCode: 'admin',
    },
    {
      username: 'operator',
      nickname: '数据运营',
      email: 'operator@nebula.local',
      department: '运营中心',
      jobTitle: '运营专员',
      roleCode: 'operator',
    },
  ] as const

  const userByUsername = new Map<string, { id: string }>()
  for (const demo of demoUsers) {
    const user = await prisma.user.upsert({
      where: { username: demo.username },
      update: {
        passwordHash,
        nickname: demo.nickname,
        email: demo.email,
        department: demo.department,
        jobTitle: demo.jobTitle,
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      create: {
        username: demo.username,
        passwordHash,
        nickname: demo.nickname,
        email: demo.email,
        department: demo.department,
        jobTitle: demo.jobTitle,
      },
    })
    userByUsername.set(demo.username, user)
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: roleByCode.get(demo.roleCode)!.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: roleByCode.get(demo.roleCode)!.id,
      },
    })
  }

  for (const [index, demo] of demoUsers.entries()) {
    const suffix = String(index + 1).padStart(12, '0')
    const conversationId = `40000000-0000-4000-8000-${suffix}`
    const runId = `41000000-0000-4000-8000-${suffix}`
    const userMessageId = `42000000-0000-4000-8001-${suffix}`
    const assistantMessageId = `42000000-0000-4000-8002-${suffix}`
    const toolCallId = `43000000-0000-4000-8000-${suffix}`
    const userId = userByUsername.get(demo.username)!.id
    const completedAt = new Date(Date.now() - (index + 1) * 45 * 60 * 1000)
    const startedAt = new Date(completedAt.getTime() - 18_000)
    const prompt = '分析本周项目风险，并给出处理优先级。'
    const answer =
      '分析完成：当前最需要关注的是临近截止日期但进度不足的项目。建议今天确认关键路径负责人，将非核心需求移出本期，并在未来三天每天同步燃尽情况。'

    await prisma.agentConversation.upsert({
      where: { id: conversationId },
      update: {
        userId,
        title: '分析本周项目风险',
        summary: '已识别项目排期、资源和范围风险，并给出行动建议。',
        lastMessageAt: completedAt,
      },
      create: {
        id: conversationId,
        userId,
        title: '分析本周项目风险',
        summary: '已识别项目排期、资源和范围风险，并给出行动建议。',
        lastMessageAt: completedAt,
        createdAt: new Date(completedAt.getTime() - 30 * 60 * 1000),
      },
    })
    await prisma.agentRun.upsert({
      where: { id: runId },
      update: {
        requestedById: userId,
        status: AgentRunStatus.COMPLETED,
        taskTitle: '项目风险分析',
        currentStep: '任务完成',
        totalSteps: 3,
        completedSteps: 3,
        progress: 100,
        startedAt,
        completedAt,
      },
      create: {
        id: runId,
        conversationId,
        requestedById: userId,
        status: AgentRunStatus.COMPLETED,
        provider: 'local-demo',
        model: 'nebula-agent-v1',
        taskTitle: '项目风险分析',
        currentStep: '任务完成',
        totalSteps: 3,
        completedSteps: 3,
        progress: 100,
        startedAt,
        completedAt,
        createdAt: startedAt,
      },
    })
    await prisma.agentMessage.upsert({
      where: { id: userMessageId },
      update: { content: prompt, authorId: userId, runId },
      create: {
        id: userMessageId,
        conversationId,
        runId,
        authorId: userId,
        role: AgentMessageRole.USER,
        content: prompt,
        sequence: 1,
        createdAt: startedAt,
      },
    })
    await prisma.agentMessage.upsert({
      where: { id: assistantMessageId },
      update: { content: answer, runId },
      create: {
        id: assistantMessageId,
        conversationId,
        runId,
        role: AgentMessageRole.ASSISTANT,
        content: answer,
        sequence: 2,
        metadata: { streamed: true, seeded: true },
        createdAt: completedAt,
      },
    })
    await prisma.agentToolCall.upsert({
      where: { id: toolCallId },
      update: {
        status: AgentToolStatus.COMPLETED,
        output: { scanned: 3, active: 2, delayedRisk: 1 },
        startedAt,
        completedAt,
      },
      create: {
        id: toolCallId,
        runId,
        callId: `seed-project-risk-${demo.username}`,
        name: 'risk.evaluate',
        displayName: '评估交付风险',
        status: AgentToolStatus.COMPLETED,
        input: { dimensions: ['schedule', 'capacity', 'scope'] },
        output: { scanned: 3, active: 2, delayedRisk: 1 },
        startedAt,
        completedAt,
        createdAt: startedAt,
      },
    })
  }

  const channels = ['Web', 'App', '小程序', '开放平台', '线下门店']
  const customers = ['星海科技', '远山互动', '云图网络', '极光工作室', '北辰数字']
  const orderStatuses = [
    OrderStatus.PAID,
    OrderStatus.PAID,
    OrderStatus.PENDING,
    OrderStatus.REFUNDED,
    OrderStatus.CLOSED,
  ]
  const now = new Date()
  const demoOrderDateCode = '20260730'

  for (let index = 0; index < 72; index += 1) {
    const orderNo = `NB-${demoOrderDateCode}-${String(1000 + index)}`
    const createdAt = new Date(now.getTime() - (index * 7 + 3) * 60 * 60 * 1000)
    const data = {
      customer: customers[index % customers.length]!,
      channel: channels[index % channels.length]!,
      amount: new Prisma.Decimal(680 + ((index * 1973) % 88000) + (index % 10) / 10),
      status: orderStatuses[index % orderStatuses.length]!,
      items: (index % 9) + 1,
      createdAt,
    }
    await prisma.order.upsert({
      where: { orderNo },
      update: data,
      create: { orderNo, ...data },
    })
  }

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  await prisma.dailyMetric.deleteMany()
  for (let offset = 89; offset >= 0; offset -= 1) {
    const date = new Date(today.getTime() - offset * 86_400_000)
    const sequence = 90 - offset
    const wave = Math.sin(sequence / 5)
    const data = {
      visits: Math.round(34_000 + sequence * 180 + wave * 4_200),
      uniqueUsers: Math.round(19_000 + sequence * 95 + wave * 2_100),
      revenue: new Prisma.Decimal(
        Math.round((480_000 + sequence * 4_600 + wave * 68_000) * 100) / 100,
      ),
      newUsers: Math.round(820 + sequence * 8 + wave * 160),
      activeUsers: Math.round(7_200 + sequence * 32 + wave * 760),
      orders: Math.round(560 + sequence * 4 + wave * 72),
    }
    await prisma.dailyMetric.upsert({
      where: { date },
      update: data,
      create: { date, ...data },
    })
  }

  const trafficSources = [
    ['自然搜索', 4820],
    ['广告投放', 3160],
    ['社交媒体', 2410],
    ['合作渠道', 1580],
    ['直接访问', 1120],
  ] as const
  for (const [index, [name, value]] of trafficSources.entries()) {
    await prisma.trafficSourceMetric.upsert({
      where: { name },
      update: { value, sort: index + 1 },
      create: { name, value, sort: index + 1 },
    })
  }

  const regions = [
    ['华东', 48620],
    ['华南', 36140],
    ['华北', 29880],
    ['西南', 18260],
    ['海外', 11430],
  ] as const
  for (const [index, [region, value]] of regions.entries()) {
    await prisma.regionMetric.upsert({
      where: { region },
      update: { value, sort: index + 1 },
      create: { region, value, sort: index + 1 },
    })
  }

  const settings: Array<{
    key: string
    group: string
    label: string
    value: Prisma.InputJsonValue
    description: string
    sensitive?: boolean
  }> = [
    { key: 'siteName', group: 'basic', label: '站点名称', value: 'NEBULA 控制台', description: '后台系统显示名称' },
    { key: 'apiBase', group: 'basic', label: '接口前缀', value: '/api', description: '前端访问 API 的统一前缀' },
    { key: 'timeout', group: 'basic', label: '请求超时', value: '15000', description: '前端请求超时时间（毫秒）' },
    { key: 'sessionTtl', group: 'security', label: '会话有效期', value: '7200', description: '访问令牌有效期（秒）', sensitive: true },
    { key: 'logLevel', group: 'observability', label: '日志级别', value: 'info', description: '服务端最低日志级别' },
    { key: 'mfa', group: 'security', label: '强制二次验证', value: true, description: '管理员登录要求二次验证', sensitive: true },
    { key: 'ipWhitelist', group: 'security', label: 'IP 白名单', value: false, description: '仅允许白名单网段访问', sensitive: true },
    { key: 'auditLog', group: 'observability', label: '操作审计', value: true, description: '记录写操作与导出行为' },
    { key: 'autoBackup', group: 'backup', label: '每日自动备份', value: true, description: '每天 03:00 执行数据库备份' },
  ]
  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        group: setting.group,
        label: setting.label,
        description: setting.description,
        value: setting.value,
        sensitive: setting.sensitive ?? false,
      },
      create: {
        ...setting,
        sensitive: setting.sensitive ?? false,
      },
    })
  }

  const projectDefinitions = [
    {
      code: 'GAME-NEBULA',
      name: '星穹远征',
      description: '跨平台科幻策略游戏，展示实时运营指标与活动编排。',
      type: ProjectType.GAME,
      status: ProjectStatus.ACTIVE,
      owner: 'manager',
      members: 18,
      progress: 72,
      budget: 2_800_000,
      tags: ['Unity', 'LiveOps', 'Global'],
      startedOffset: 160,
      dueOffset: 95,
    },
    {
      code: 'APP-ORBIT',
      name: 'Orbit 数据中台',
      description: '统一指标、用户画像与实时数据消费的企业应用。',
      type: ProjectType.APPLICATION,
      status: ProjectStatus.ACTIVE,
      owner: 'admin',
      members: 12,
      progress: 84,
      budget: 1_600_000,
      tags: ['Vue3', 'NestJS', 'PostgreSQL'],
      startedOffset: 220,
      dueOffset: 45,
    },
    {
      code: 'AGENT-ATLAS',
      name: 'Atlas Agent',
      description: '面向运维与数据分析场景的工具调用型 AI Agent。',
      type: ProjectType.AI_AGENT,
      status: ProjectStatus.PLANNING,
      owner: 'operator',
      members: 7,
      progress: 28,
      budget: 920_000,
      tags: ['Agent', 'SSE', 'Tools'],
      startedOffset: 30,
      dueOffset: 150,
    },
    {
      code: 'GAME-ECHO',
      name: '回响计划',
      description: '轻量叙事解谜游戏原型与用户测试项目。',
      type: ProjectType.GAME,
      status: ProjectStatus.PAUSED,
      owner: 'manager',
      members: 5,
      progress: 46,
      budget: 480_000,
      tags: ['Prototype', 'Narrative'],
      startedOffset: 120,
      dueOffset: 60,
    },
  ] as const
  for (const project of projectDefinitions) {
    const data = {
      name: project.name,
      description: project.description,
      type: project.type,
      status: project.status,
      ownerId: userByUsername.get(project.owner)?.id,
      members: project.members,
      progress: project.progress,
      budget: new Prisma.Decimal(project.budget),
      tags: [...project.tags],
      startedAt: new Date(today.getTime() - project.startedOffset * 86_400_000),
      dueAt: new Date(today.getTime() + project.dueOffset * 86_400_000),
    }
    await prisma.project.upsert({
      where: { code: project.code },
      update: data,
      create: { code: project.code, ...data },
    })
  }

  const notificationDefinitions = [
    ['10000000-0000-4000-8000-000000000001', NotificationType.SYSTEM, '实时计算集群恢复正常', '华北-2 区域实时任务延迟已恢复到正常水位。'],
    ['10000000-0000-4000-8000-000000000002', NotificationType.TODO, '待复核项目预算', 'Atlas Agent 项目预算变更等待超级管理员复核。'],
    ['10000000-0000-4000-8000-000000000003', NotificationType.MESSAGE, '运营周报已生成', '本周项目与交易运营报告已生成，可以前往数据分析查看。'],
  ] as const
  for (const [index, [id, type, title, content]] of notificationDefinitions.entries()) {
    await prisma.notification.upsert({
      where: { id },
      update: { type, title, content },
      create: {
        id,
        type,
        title,
        content,
        createdAt: new Date(now.getTime() - (index + 1) * 35 * 60 * 1000),
      },
    })
  }

  const operationDefinitions = [
    ['20000000-0000-4000-8000-000000000001', 'auth', 'login', '管理员登录系统', OperationLevel.SUCCESS],
    ['20000000-0000-4000-8000-000000000002', 'project', 'update', '更新 Atlas Agent 项目进度', OperationLevel.INFO],
    ['20000000-0000-4000-8000-000000000003', 'order', 'refund', '订单退款进入人工复核', OperationLevel.WARNING],
    ['20000000-0000-4000-8000-000000000004', 'system', 'config', '更新系统审计配置', OperationLevel.SUCCESS],
  ] as const
  for (const [index, [id, module, action, summary, level]] of operationDefinitions.entries()) {
    await prisma.operationLog.upsert({
      where: { id },
      update: { module, action, summary, level },
      create: {
        id,
        userId: userByUsername.get(index === 2 ? 'operator' : 'admin')?.id,
        module,
        action,
        summary,
        level,
        success: true,
        createdAt: new Date(now.getTime() - (index + 1) * 48 * 60 * 1000),
      },
    })
  }

  console.log('[seed] identity and business data initialized')
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
