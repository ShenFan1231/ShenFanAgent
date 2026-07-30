<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

import { agentApi } from '@/api'
import type {
  AgentConversationListItem,
  AgentMessage,
  AgentRun,
  AgentStreamEvent,
  AgentToolCall,
} from '@/api/types/agent'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmpty from '@/components/ui/AppEmpty.vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import AppTag from '@/components/ui/AppTag.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useUserStore } from '@/stores/user'
import { toast } from '@/utils/toast'

const userStore = useUserStore()
const conversations = ref<AgentConversationListItem[]>([])
const activeId = ref('')
const messages = ref<AgentMessage[]>([])
const prompt = ref('')
const loading = ref(true)
const switching = ref(false)
const running = ref(false)
const activeRun = ref<AgentRun | null>(null)
const toolCalls = ref<AgentToolCall[]>([])
const messageViewport = ref<HTMLElement | null>(null)
let streamController: AbortController | null = null

const starterPrompts = [
  '分析当前项目进度并识别交付风险',
  '总结本周运营数据，给出三条建议',
  '帮我制定一个后台系统上线检查清单',
]

const runStatusMeta = computed(() => {
  const status = activeRun.value?.status ?? 'pending'
  const table = {
    pending: { label: '等待执行', tone: 'neutral' as const, icon: 'i-lucide-clock-3' },
    running: { label: '执行中', tone: 'brand' as const, icon: 'i-lucide-loader-circle' },
    completed: { label: '已完成', tone: 'success' as const, icon: 'i-lucide-circle-check-big' },
    failed: { label: '执行失败', tone: 'danger' as const, icon: 'i-lucide-circle-x' },
    cancelled: { label: '已取消', tone: 'warning' as const, icon: 'i-lucide-ban' },
  }
  return table[status]
})

const canSend = computed(
  () =>
    Boolean(activeId.value && prompt.value.trim()) &&
    !running.value &&
    userStore.hasPermission('agent:run'),
)

function formatTime(value: string): string {
  if (!value) return '刚刚'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

async function scrollToBottom(): Promise<void> {
  await nextTick()
  if (messageViewport.value) {
    messageViewport.value.scrollTop = messageViewport.value.scrollHeight
  }
}

async function loadConversations(preferredId?: string): Promise<void> {
  conversations.value = await agentApi.listConversations()
  const nextId =
    preferredId && conversations.value.some((item) => item.id === preferredId)
      ? preferredId
      : activeId.value && conversations.value.some((item) => item.id === activeId.value)
        ? activeId.value
        : conversations.value[0]?.id
  if (nextId && nextId !== activeId.value) await selectConversation(nextId)
}

async function createConversation(): Promise<void> {
  const created = await agentApi.createConversation()
  activeId.value = ''
  await loadConversations(created.id)
  if (!activeId.value) await selectConversation(created.id)
}

async function selectConversation(id: string): Promise<void> {
  if (running.value && id !== activeId.value) {
    toast.warning('当前任务仍在执行，请稍后切换会话')
    return
  }
  switching.value = true
  try {
    const detail = await agentApi.detail(id)
    activeId.value = id
    messages.value = detail.messages
    activeRun.value = detail.runs[0] ?? null
    toolCalls.value = detail.runs[0]?.toolCalls ?? []
    await scrollToBottom()
  } finally {
    switching.value = false
  }
}

function useStarter(text: string): void {
  prompt.value = text
}

function mergeTool(event: AgentStreamEvent, status: AgentToolCall['status']): void {
  const id = String(event.data.id ?? event.data.callId ?? '')
  const existing = toolCalls.value.find((item) => item.id === id || item.callId === event.data.callId)
  if (existing) {
    existing.status = status
    if (event.data.output) existing.output = event.data.output as Record<string, unknown>
    existing.completedAt = status === 'completed' ? event.timestamp : ''
    return
  }
  toolCalls.value.push({
    id,
    callId: String(event.data.callId ?? id),
    name: String(event.data.name ?? ''),
    displayName: String(event.data.displayName ?? event.data.name ?? 'Tool'),
    status,
    input: (event.data.input as Record<string, unknown>) ?? {},
    output: (event.data.output as Record<string, unknown>) ?? null,
    error: '',
    startedAt: event.timestamp,
    completedAt: status === 'completed' ? event.timestamp : '',
  })
}

function handleStreamEvent(event: AgentStreamEvent, assistant: AgentMessage): void {
  if (!activeRun.value) return
  if (event.type === 'run.started') {
    activeRun.value.status = 'running'
    activeRun.value.taskTitle = String(event.data.taskTitle ?? 'Agent 任务')
    activeRun.value.provider = String(event.data.provider ?? '')
    activeRun.value.model = String(event.data.model ?? '')
    activeRun.value.progress = Number(event.data.progress ?? 5)
  } else if (event.type === 'task.progress') {
    activeRun.value.progress = Number(event.data.progress ?? activeRun.value.progress)
    activeRun.value.currentStep = String(event.data.currentStep ?? '')
    activeRun.value.completedSteps = Number(
      event.data.completedSteps ?? activeRun.value.completedSteps,
    )
    activeRun.value.totalSteps = Number(event.data.totalSteps ?? activeRun.value.totalSteps)
  } else if (event.type === 'message.delta') {
    assistant.content += String(event.data.delta ?? '')
    void scrollToBottom()
  } else if (event.type === 'tool.started') {
    mergeTool(event, 'running')
  } else if (event.type === 'tool.completed') {
    mergeTool(event, 'completed')
  } else if (event.type === 'message.completed') {
    assistant.id = String(event.data.messageId ?? assistant.id)
    assistant.content = String(event.data.content ?? assistant.content)
  } else if (event.type === 'run.completed') {
    activeRun.value.status = 'completed'
    activeRun.value.progress = 100
    activeRun.value.currentStep = '任务完成'
  } else if (event.type === 'run.failed') {
    activeRun.value.status = 'failed'
    activeRun.value.error = String(event.data.error ?? '任务执行失败')
  }
}

async function sendMessage(): Promise<void> {
  const content = prompt.value.trim()
  if (!canSend.value || !content) return
  prompt.value = ''
  running.value = true
  toolCalls.value = []
  messages.value.push({
    id: `local-user-${Date.now()}`,
    runId: '',
    role: 'user',
    content,
    sequence: messages.value.length + 1,
    metadata: null,
    createdAt: new Date().toISOString(),
  })
  const assistant = reactive<AgentMessage>({
    id: `local-assistant-${Date.now()}`,
    runId: '',
    role: 'assistant',
    content: '',
    sequence: messages.value.length + 1,
    metadata: { streaming: true },
    createdAt: new Date().toISOString(),
  })
  messages.value.push(assistant)
  await scrollToBottom()

  try {
    const run = await agentApi.createRun(activeId.value, content)
    activeRun.value = run
    assistant.runId = run.id
    streamController = new AbortController()
    await agentApi.streamRun(
      run.id,
      (event) => handleStreamEvent(event, assistant),
      streamController.signal,
    )
    if (activeRun.value?.status === 'failed') {
      throw new Error(activeRun.value.error || 'Agent 任务执行失败')
    }
    await loadConversations(activeId.value)
    toast.success('Agent 任务已完成')
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      if (activeRun.value) activeRun.value.status = 'failed'
      assistant.content ||= '任务执行中断，请稍后重试。'
      toast.error((error as Error).message || 'Agent 任务执行失败')
    }
  } finally {
    running.value = false
    streamController = null
  }
}

function onComposerKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void sendMessage()
  }
}

async function initialize(): Promise<void> {
  loading.value = true
  try {
    await loadConversations()
    if (!conversations.value.length) await createConversation()
    else if (!activeId.value) await selectConversation(conversations.value[0]!.id)
  } finally {
    loading.value = false
  }
}

onMounted(() => void initialize())
onActivated(() => {
  if (!loading.value && !running.value) void loadConversations(activeId.value)
})
onBeforeUnmount(() => streamController?.abort())
</script>

<template>
  <div class="mx-auto flex h-full min-h-[680px] w-full max-w-[1760px] flex-col gap-4">
    <PageHeader
      title="Agent 工作台"
      description="可观测的 AI 任务编排、实时消息与工具调用中心"
      icon="i-lucide-bot"
    >
      <template #actions>
        <AppTag tone="success" dot size="xs">SSE 已连接</AppTag>
        <AppTag tone="violet" size="xs" icon="i-lucide-plug-zap">Provider 可替换</AppTag>
      </template>
    </PageHeader>

    <div class="agent-grid min-h-0 flex-1">
      <GlassPanel
        class="min-h-0 overflow-hidden"
        padding="none"
        variant="outline"
        body-class="flex h-full min-h-0 flex-col"
      >
        <div class="flex items-center justify-between border-b border-line/60 px-4 py-3.5">
          <div>
            <p class="text-sm font-semibold">会话</p>
            <p class="text-[11px] text-text-dim">{{ conversations.length }} 个历史任务</p>
          </div>
          <AppButton
            size="xs"
            variant="outline"
            icon="i-lucide-plus"
            :disabled="running"
            @click="createConversation"
          >
            新建
          </AppButton>
        </div>

        <div class="agent-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2.5">
          <button
            v-for="item in conversations"
            :key="item.id"
            class="group w-full rounded-xl border px-3 py-3 text-left transition-all duration-200"
            :class="
              activeId === item.id
                ? 'border-brand/35 bg-brand/10 shadow-[inset_3px_0_rgb(var(--c-brand))]'
                : 'border-transparent hover:border-line/70 hover:bg-elevated/60'
            "
            @click="selectConversation(item.id)"
          >
            <div class="flex items-start gap-2.5">
              <span
                class="flex-center mt-0.5 size-7 shrink-0 rounded-lg"
                :class="activeId === item.id ? 'bg-brand/18 text-brand' : 'bg-elevated text-text-dim'"
              >
                <i class="i-lucide-message-square-text text-xs" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] font-medium">{{ item.title }}</p>
                <p class="mt-1 line-clamp-2 text-[11px] leading-4 text-text-dim">
                  {{ item.summary || '等待开始新的智能任务' }}
                </p>
                <div class="mt-2 flex items-center justify-between text-[10px] text-text-dim">
                  <span>{{ item.messageCount }} 条消息</span>
                  <span>{{ formatTime(item.lastMessageAt || item.createdAt) }}</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </GlassPanel>

      <GlassPanel
        class="agent-console min-h-0 overflow-hidden"
        padding="none"
        variant="raised"
        body-class="flex h-full min-h-0 flex-col"
        :loading="loading || switching"
      >
        <div class="flex items-center justify-between border-b border-line/60 px-5 py-3.5">
          <div class="flex min-w-0 items-center gap-3">
            <span class="agent-orb flex-center size-9 shrink-0 rounded-xl text-[#04121a]">
              <i class="i-lucide-sparkles" />
            </span>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold">
                {{ conversations.find((item) => item.id === activeId)?.title || 'NEBULA Agent' }}
              </p>
              <p class="text-[11px] text-text-dim">
                {{ activeRun?.model || 'nebula-agent-v1' }} · 实时任务编排
              </p>
            </div>
          </div>
          <AppTag
            v-if="activeRun"
            :tone="runStatusMeta.tone"
            :icon="runStatusMeta.icon"
            :dot="activeRun.status === 'running'"
            size="xs"
          >
            {{ runStatusMeta.label }}
          </AppTag>
        </div>

        <div ref="messageViewport" class="agent-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div v-if="!messages.length" class="flex h-full flex-col items-center justify-center">
            <div class="agent-empty-icon flex-center mb-5 size-18 rounded-3xl">
              <i class="i-lucide-bot text-3xl text-brand" />
            </div>
            <h2 class="text-lg font-semibold">今天想分析什么？</h2>
            <p class="mt-1.5 max-w-md text-center text-xs leading-5 text-text-dim">
              Agent 会展示完整的思考进度、工具调用与结果生成过程。
            </p>
            <div class="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-3">
              <button
                v-for="starter in starterPrompts"
                :key="starter"
                class="rounded-xl border border-line/65 bg-surface/50 px-3 py-3 text-left text-xs leading-5 text-text-soft transition hover:border-brand/40 hover:bg-brand/8 hover:text-text"
                @click="useStarter(starter)"
              >
                <i class="i-lucide-wand-sparkles mb-2 block text-sm text-brand" />
                {{ starter }}
              </button>
            </div>
          </div>

          <div v-else class="mx-auto max-w-3xl space-y-5">
            <div
              v-for="message in messages"
              :key="message.id"
              class="flex gap-3"
              :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <AppAvatar
                v-if="message.role !== 'user'"
                name="AI"
                :size="30"
                class="mt-0.5 shrink-0 ring-1 ring-brand/30"
              />
              <div
                class="max-w-[82%] rounded-2xl px-4 py-3 text-[13px] leading-6 shadow-sm"
                :class="
                  message.role === 'user'
                    ? 'rounded-tr-md bg-[linear-gradient(130deg,rgb(var(--c-brand)/0.22),rgb(var(--c-violet)/0.18))] text-text ring-1 ring-brand/20'
                    : 'rounded-tl-md border border-line/70 bg-surface/75 text-text-soft'
                "
              >
                <p class="whitespace-pre-wrap">{{ message.content }}</p>
                <span
                  v-if="message.role === 'assistant' && running && !message.content"
                  class="inline-flex items-center gap-1 text-text-dim"
                >
                  <i class="i-lucide-loader-circle animate-spin text-brand" />
                  Agent 正在准备回答
                </span>
              </div>
              <AppAvatar
                v-if="message.role === 'user'"
                :src="userStore.avatar"
                :name="userStore.displayName"
                :size="30"
                class="mt-0.5 shrink-0"
              />
            </div>
          </div>
        </div>

        <div class="border-t border-line/60 bg-surface/30 p-3.5">
          <div class="mx-auto max-w-3xl rounded-2xl border border-line/80 bg-elevated/75 p-2 shadow-panel focus-within:border-brand/45">
            <textarea
              v-model="prompt"
              rows="2"
              maxlength="4000"
              :disabled="running"
              placeholder="输入任务，Enter 发送，Shift + Enter 换行…"
              class="max-h-36 min-h-14 w-full resize-none bg-transparent px-2.5 py-2 text-[13px] leading-5 text-text outline-none placeholder:text-text-dim disabled:opacity-60"
              @keydown="onComposerKeydown"
            />
            <div class="flex items-center justify-between px-1">
              <div class="flex items-center gap-2 text-[10px] text-text-dim">
                <span><i class="i-lucide-database mr-1" />业务数据上下文</span>
                <span><i class="i-lucide-shield-check mr-1" />RBAC 已校验</span>
              </div>
              <AppButton
                variant="primary"
                size="sm"
                icon="i-lucide-send-horizontal"
                :loading="running"
                :disabled="!canSend"
                @click="sendMessage"
              >
                {{ running ? '执行中' : '发送' }}
              </AppButton>
            </div>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel
        class="min-h-0 overflow-hidden"
        padding="none"
        variant="outline"
        body-class="agent-scroll h-full min-h-0 overflow-y-auto"
      >
        <div class="border-b border-line/60 px-4 py-3.5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold">任务观测</p>
              <p class="text-[11px] text-text-dim">Run / Tool 实时状态</p>
            </div>
            <span class="flex-center size-8 rounded-xl bg-violet/12 text-violet">
              <i class="i-lucide-activity text-sm" />
            </span>
          </div>
        </div>

        <div v-if="activeRun" class="space-y-5 p-4">
          <div>
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs font-medium">{{ activeRun.taskTitle }}</span>
              <span class="tabular text-[11px] text-brand">{{ activeRun.progress }}%</span>
            </div>
            <AppProgress :value="activeRun.progress" animated :height="7" />
            <div class="mt-2 flex items-center justify-between text-[10px] text-text-dim">
              <span>{{ activeRun.currentStep || '等待任务开始' }}</span>
              <span>{{ activeRun.completedSteps }}/{{ activeRun.totalSteps }} steps</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-xl border border-line/60 bg-surface/45 p-3">
              <p class="text-[10px] uppercase tracking-wider text-text-dim">Provider</p>
              <p class="mt-1 truncate text-xs font-medium">{{ activeRun.provider }}</p>
            </div>
            <div class="rounded-xl border border-line/60 bg-surface/45 p-3">
              <p class="text-[10px] uppercase tracking-wider text-text-dim">Model</p>
              <p class="mt-1 truncate text-xs font-medium">{{ activeRun.model }}</p>
            </div>
          </div>

          <div>
            <div class="mb-2.5 flex items-center justify-between">
              <p class="text-xs font-semibold">Tool 调用</p>
              <AppTag tone="neutral" size="xs">{{ toolCalls.length }}</AppTag>
            </div>
            <div v-if="toolCalls.length" class="relative space-y-2.5">
              <div
                v-for="tool in toolCalls"
                :key="tool.callId"
                class="rounded-xl border border-line/65 bg-surface/45 p-3 transition hover:border-brand/30"
              >
                <div class="flex items-start gap-2.5">
                  <span
                    class="flex-center size-7 shrink-0 rounded-lg"
                    :class="
                      tool.status === 'completed'
                        ? 'bg-success/12 text-success'
                        : 'bg-brand/12 text-brand'
                    "
                  >
                    <i
                      :class="
                        tool.status === 'completed'
                          ? 'i-lucide-check'
                          : 'i-lucide-loader-circle animate-spin'
                      "
                    />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs font-medium">{{ tool.displayName }}</p>
                    <p class="mt-0.5 truncate font-mono text-[9px] text-text-dim">{{ tool.name }}</p>
                  </div>
                  <AppTag
                    :tone="tool.status === 'completed' ? 'success' : 'brand'"
                    size="xs"
                  >
                    {{ tool.status === 'completed' ? '完成' : '调用中' }}
                  </AppTag>
                </div>
                <div class="mt-2.5 rounded-lg bg-elevated/65 px-2.5 py-2 font-mono text-[9px] leading-4 text-text-dim">
                  {{ JSON.stringify(tool.output || tool.input) }}
                </div>
              </div>
            </div>
            <div
              v-else
              class="rounded-xl border border-dashed border-line/70 px-3 py-5 text-center text-[11px] text-text-dim"
            >
              <i class="i-lucide-braces mb-2 block text-lg" />
              运行后将在这里展示工具调用
            </div>
          </div>

          <div class="rounded-xl border border-brand/20 bg-brand/7 p-3">
            <div class="flex items-center gap-2 text-[11px] font-medium text-brand">
              <i class="i-lucide-radio-tower" />
              实时事件流
            </div>
            <p class="mt-1.5 text-[10px] leading-4 text-text-dim">
              SSE 通道推送 run、progress、tool 与 message 事件，后端同时持久化完整轨迹。
            </p>
          </div>
        </div>

        <div v-else class="flex h-[70%] items-center justify-center p-4">
          <AppEmpty title="暂无运行任务" description="发送消息后可观测任务执行过程" icon="i-lucide-workflow" />
        </div>
      </GlassPanel>
    </div>
  </div>
</template>

<style scoped>
.agent-grid {
  display: grid;
  grid-template-columns: minmax(210px, 0.7fr) minmax(520px, 2fr) minmax(250px, 0.85fr);
  gap: 14px;
}

.agent-console {
  background-image:
    radial-gradient(circle at 50% -20%, rgb(var(--c-brand) / 0.11), transparent 36%),
    linear-gradient(rgb(var(--c-line) / 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgb(var(--c-line) / 0.1) 1px, transparent 1px);
  background-size:
    auto,
    32px 32px,
    32px 32px;
}

.agent-orb {
  background: linear-gradient(135deg, rgb(var(--c-brand)), rgb(var(--c-violet)));
  box-shadow: 0 0 24px rgb(var(--c-brand) / 0.28);
}

.agent-empty-icon {
  background: linear-gradient(145deg, rgb(var(--c-brand) / 0.12), rgb(var(--c-violet) / 0.12));
  box-shadow: 0 0 48px rgb(var(--c-brand) / 0.12);
  border: 1px solid rgb(var(--c-brand) / 0.22);
}

.agent-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--c-line)) transparent;
}

@media (max-width: 1280px) {
  .agent-grid {
    grid-template-columns: 220px minmax(480px, 1fr);
  }

  .agent-grid > :last-child {
    display: none;
  }
}

@media (max-width: 768px) {
  .agent-grid {
    grid-template-columns: 1fr;
  }

  .agent-grid > :first-child {
    display: none;
  }
}
</style>
