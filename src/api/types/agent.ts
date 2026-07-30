export type AgentRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type AgentToolStatus = 'pending' | 'running' | 'completed' | 'failed'
export type AgentMessageRole = 'user' | 'assistant' | 'system' | 'tool'

export interface AgentToolCall {
  id: string
  callId: string
  name: string
  displayName: string
  status: AgentToolStatus
  input: Record<string, unknown>
  output: Record<string, unknown> | null
  error: string
  startedAt: string
  completedAt: string
}

export interface AgentRun {
  id: string
  conversationId: string
  status: AgentRunStatus
  provider: string
  model: string
  taskTitle: string
  currentStep: string
  totalSteps: number
  completedSteps: number
  progress: number
  error: string
  startedAt: string
  completedAt: string
  createdAt: string
  updatedAt: string
  toolCalls: AgentToolCall[]
}

export interface AgentMessage {
  id: string
  runId: string
  role: AgentMessageRole
  content: string
  sequence: number
  metadata: unknown
  createdAt: string
}

export interface AgentConversationListItem {
  id: string
  title: string
  summary: string
  status: 'active' | 'archived'
  messageCount: number
  latestRun: Pick<AgentRun, 'status' | 'progress' | 'updatedAt'> | null
  lastMessageAt: string
  createdAt: string
  updatedAt: string
}

export interface AgentConversation {
  id: string
  title: string
  summary: string
  status: 'active' | 'archived'
  messages: AgentMessage[]
  runs: AgentRun[]
  lastMessageAt: string
  createdAt: string
  updatedAt: string
}

export type AgentStreamEventType =
  | 'run.started'
  | 'task.progress'
  | 'message.delta'
  | 'tool.started'
  | 'tool.completed'
  | 'message.completed'
  | 'run.completed'
  | 'run.failed'

export interface AgentStreamEvent {
  type: AgentStreamEventType
  runId: string
  timestamp: string
  data: Record<string, unknown>
}
