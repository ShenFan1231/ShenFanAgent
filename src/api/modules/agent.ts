import type {
  AgentConversation,
  AgentConversationListItem,
  AgentRun,
  AgentStreamEvent,
} from '@/api/types/agent'
import { api } from '@/utils/request'
import { local, StorageKeys } from '@/utils/storage'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function wait(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, milliseconds)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

async function streamMockRun(
  runId: string,
  onEvent: (event: AgentStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const emit = (type: AgentStreamEvent['type'], data: Record<string, unknown>) =>
    onEvent({ type, runId, data, timestamp: new Date().toISOString() })
  emit('run.started', {
    status: 'running',
    taskTitle: '运营数据洞察',
    provider: 'mock',
    model: 'nebula-agent-v1',
    progress: 5,
  })
  await wait(160, signal)
  emit('message.delta', { delta: '我会聚合核心指标，并定位变化最明显的维度。' })
  const tools = [
    {
      id: `${runId}-tool-1`,
      callId: `${runId}:1`,
      name: 'metrics.aggregate',
      displayName: '聚合经营指标',
      input: { range: 'last_7_days' },
      output: { orders: 1286, revenue: 428600 },
      progress: 44,
    },
    {
      id: `${runId}-tool-2`,
      callId: `${runId}:2`,
      name: 'trend.compare',
      displayName: '执行趋势对比',
      input: { baseline: 'previous_7_days' },
      output: { ordersChange: 0.123 },
      progress: 78,
    },
  ]
  for (const tool of tools) {
    emit('tool.started', tool)
    emit('task.progress', {
      progress: tool.progress,
      currentStep: tool.displayName,
      completedSteps: tool === tools[0] ? 1 : 2,
      totalSteps: 4,
    })
    await wait(260, signal)
    emit('tool.completed', tool)
  }
  const answer =
    '分析完成：本周订单和收入保持增长，建议优先检查高流量低转化渠道，并通过高价值组合包提升客单价。'
  for (let index = 0; index < answer.length; index += 12) {
    await wait(55, signal)
    emit('message.delta', { delta: answer.slice(index, index + 12) })
  }
  emit('message.completed', { messageId: `${runId}-answer`, content: answer })
  emit('run.completed', { status: 'completed', progress: 100, currentStep: '任务完成' })
}

async function streamRun(
  runId: string,
  onEvent: (event: AgentStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (import.meta.env.VITE_USE_MOCK === '1') {
    return streamMockRun(runId, onEvent, signal)
  }

  const token = local.get<string>(StorageKeys.TOKEN, '')
  const response = await fetch(`${API_BASE}/agent/runs/${runId}/events`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'text/event-stream',
      Authorization: token ? `Bearer ${token}` : '',
      'X-Request-Id': crypto.randomUUID?.() ?? String(Date.now()),
    },
    signal,
  })
  if (!response.ok || !response.body) {
    const message = await response.text()
    throw new Error(message || `Agent stream failed (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const frames = buffer.split(/\r?\n\r?\n/)
    buffer = frames.pop() ?? ''
    for (const frame of frames) {
      const data = frame
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n')
      if (data) {
        const event = JSON.parse(data) as AgentStreamEvent
        onEvent(event)
        if (event.type === 'message.delta') {
          await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
        }
      }
    }
    if (done) break
  }
}

export const agentApi = {
  listConversations() {
    return api.get<AgentConversationListItem[]>('/agent/conversations')
  },
  createConversation(title?: string) {
    return api.post<AgentConversation>('/agent/conversations', { title })
  },
  detail(id: string) {
    return api.get<AgentConversation>(`/agent/conversations/${id}`)
  },
  createRun(conversationId: string, prompt: string) {
    return api.post<AgentRun>(`/agent/conversations/${conversationId}/runs`, { prompt })
  },
  getRun(id: string) {
    return api.get<AgentRun>(`/agent/runs/${id}`)
  },
  streamRun,
}
