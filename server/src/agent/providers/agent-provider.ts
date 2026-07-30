export const AGENT_PROVIDER = Symbol('AGENT_PROVIDER')

export interface AgentToolStep {
  name: string
  displayName: string
  input: Record<string, unknown>
  output: Record<string, unknown>
  progress: number
  statusText: string
}

export interface AgentExecutionPlan {
  provider: string
  model: string
  taskTitle: string
  introduction: string
  tools: AgentToolStep[]
  answer: string
}

export interface AgentContextMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AgentProvider {
  createPlan(
    prompt: string,
    context?: AgentContextMessage[],
  ): Promise<AgentExecutionPlan>
  streamAnswer?(
    prompt: string,
    context?: AgentContextMessage[],
    signal?: AbortSignal,
  ): AsyncIterable<string>
}
