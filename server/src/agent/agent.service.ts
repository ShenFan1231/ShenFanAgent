import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  type MessageEvent,
} from '@nestjs/common'
import { AgentToolStatus, type Prisma } from '../../generated/prisma'
import { Observable } from 'rxjs'

import type { CreateConversationDto } from './dto/create-conversation.dto'
import type { CreateRunDto } from './dto/create-run.dto'
import {
  AGENT_PROVIDER,
  type AgentProvider,
} from './providers/agent-provider'
import { AgentRepository } from './agent.repository'

interface StreamPayload {
  type: string
  runId: string
  timestamp: string
  data: Record<string, unknown>
}

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds))

@Injectable()
export class AgentService {
  constructor(
    private readonly repository: AgentRepository,
    @Inject(AGENT_PROVIDER) private readonly provider: AgentProvider,
  ) {}

  async listConversations(userId: string) {
    const conversations = await this.repository.listConversations(userId)
    return conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      summary: conversation.summary ?? '',
      status: conversation.status.toLowerCase(),
      messageCount: conversation._count.messages,
      latestRun: conversation.runs[0]
        ? {
            status: conversation.runs[0].status.toLowerCase(),
            progress: conversation.runs[0].progress,
            updatedAt: conversation.runs[0].updatedAt.toISOString(),
          }
        : null,
      lastMessageAt: conversation.lastMessageAt?.toISOString() ?? '',
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    }))
  }

  async detail(id: string, userId: string) {
    const conversation = await this.repository.findConversation(id, userId)
    if (!conversation) throw new NotFoundException('会话不存在')
    return {
      id: conversation.id,
      title: conversation.title,
      summary: conversation.summary ?? '',
      status: conversation.status.toLowerCase(),
      messages: conversation.messages.map((message) => ({
        id: message.id,
        runId: message.runId ?? '',
        role: message.role.toLowerCase(),
        content: message.content,
        sequence: message.sequence,
        metadata: message.metadata,
        createdAt: message.createdAt.toISOString(),
      })),
      runs: conversation.runs.map((run) => this.toRun(run)),
      lastMessageAt: conversation.lastMessageAt?.toISOString() ?? '',
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    }
  }

  createConversation(userId: string, dto: CreateConversationDto) {
    return this.repository.createConversation(userId, dto.title?.trim() || '新会话')
  }

  async createRun(conversationId: string, userId: string, dto: CreateRunDto) {
    const run = await this.repository.createRun(conversationId, userId, dto.prompt.trim())
    if (!run) throw new NotFoundException('会话不存在')
    return this.toRun(run)
  }

  async getRun(id: string, userId: string) {
    const run = await this.repository.findRun(id, userId)
    if (!run) throw new NotFoundException('任务不存在')
    return this.toRun(run)
  }

  streamRun(id: string, userId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const controller = new AbortController()
      void this.execute(id, userId, controller.signal, (payload) => {
        if (!subscriber.closed) {
          subscriber.next({ type: payload.type, data: payload })
        }
      })
        .then(() => subscriber.complete())
        .catch((error: unknown) => subscriber.error(error))
      return () => controller.abort()
    })
  }

  private async execute(
    id: string,
    userId: string,
    signal: AbortSignal,
    emit: (payload: StreamPayload) => void,
  ): Promise<void> {
    const run = await this.repository.claimRun(id, userId)
    if (!run) {
      const existing = await this.repository.findRun(id, userId)
      if (!existing) throw new NotFoundException('任务不存在')
      throw new ConflictException('任务已开始或已完成')
    }

    const prompt = run.messages[0]?.content ?? ''
    try {
      const context = [...run.conversation.messages]
        .reverse()
        .map((message) => ({
          role: message.role === 'USER' ? ('user' as const) : ('assistant' as const),
          content: message.content,
        }))
      const plan = await this.provider.createPlan(prompt, context)
      await this.repository.updateRun(id, {
        provider: plan.provider,
        model: plan.model,
        taskTitle: plan.taskTitle,
        totalSteps: plan.tools.length + 2,
      })
      this.emit(emit, id, 'run.started', {
        status: 'running',
        taskTitle: plan.taskTitle,
        provider: plan.provider,
        model: plan.model,
        progress: 5,
      })
      await wait(120)
      this.emit(emit, id, 'task.progress', {
        progress: 12,
        currentStep: plan.introduction,
        completedSteps: 1,
        totalSteps: plan.tools.length + 2,
      })

      let completedSteps = 1
      for (let index = 0; index < plan.tools.length; index += 1) {
        const tool = plan.tools[index]!
        const callId = `${id}:${index + 1}`
        const created = await this.repository.createToolCall({
          runId: id,
          callId,
          name: tool.name,
          displayName: tool.displayName,
          status: AgentToolStatus.RUNNING,
          input: tool.input as Prisma.InputJsonValue,
          startedAt: new Date(),
        })
        await this.repository.updateRun(id, {
          currentStep: tool.displayName,
          completedSteps,
          progress: tool.progress,
        })
        this.emit(emit, id, 'tool.started', {
          id: created.id,
          callId,
          name: tool.name,
          displayName: tool.displayName,
          input: tool.input,
        })
        this.emit(emit, id, 'task.progress', {
          progress: tool.progress,
          currentStep: tool.statusText,
          completedSteps,
          totalSteps: plan.tools.length + 2,
        })
        await wait(220)
        await this.repository.updateToolCall(created.id, {
          status: AgentToolStatus.COMPLETED,
          output: tool.output as Prisma.InputJsonValue,
          completedAt: new Date(),
        })
        completedSteps += 1
        this.emit(emit, id, 'tool.completed', {
          id: created.id,
          callId,
          name: tool.name,
          displayName: tool.displayName,
          output: tool.output,
        })
      }

      let answer = ''
      await this.repository.updateRun(id, {
        currentStep: 'DeepSeek 正在生成',
        completedSteps,
        progress: 88,
      })
      this.emit(emit, id, 'task.progress', {
        progress: 88,
        currentStep: 'DeepSeek 正在生成',
        completedSteps,
        totalSteps: plan.tools.length + 2,
      })

      if (this.provider.streamAnswer) {
        for await (const delta of this.provider.streamAnswer(prompt, context, signal)) {
          answer += delta
          this.emit(emit, id, 'message.delta', { delta })
        }
      } else {
        answer = plan.answer
        const chunks = this.chunkText(answer, 14)
        for (const delta of chunks) {
          await wait(55)
          this.emit(emit, id, 'message.delta', { delta })
        }
      }
      if (!answer.trim()) throw new Error('Agent 未生成回答')

      const message = await this.repository.completeRun(id, run.conversationId, answer)
      this.emit(emit, id, 'message.completed', {
        messageId: message.id,
        content: answer,
      })
      this.emit(emit, id, 'run.completed', {
        status: 'completed',
        progress: 100,
        currentStep: '任务完成',
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Agent 执行失败'
      await this.repository.failRun(id, message)
      this.emit(emit, id, 'run.failed', { status: 'failed', error: message })
    }
  }

  private emit(
    emit: (payload: StreamPayload) => void,
    runId: string,
    type: string,
    data: Record<string, unknown>,
  ): void {
    emit({ type, runId, data, timestamp: new Date().toISOString() })
  }

  private chunkText(text: string, size: number): string[] {
    const chunks: string[] = []
    for (let index = 0; index < text.length; index += size) {
      chunks.push(text.slice(index, index + size))
    }
    return chunks
  }

  private toRun(run: {
    id: string
    conversationId: string
    status: string
    provider: string
    model: string
    taskTitle: string
    currentStep: string | null
    totalSteps: number
    completedSteps: number
    progress: number
    error: string | null
    startedAt: Date | null
    completedAt: Date | null
    createdAt: Date
    updatedAt: Date
    toolCalls?: Array<{
      id: string
      callId: string
      name: string
      displayName: string
      status: string
      input: unknown
      output: unknown
      error: string | null
      startedAt: Date | null
      completedAt: Date | null
    }>
  }) {
    return {
      id: run.id,
      conversationId: run.conversationId,
      status: run.status.toLowerCase(),
      provider: run.provider,
      model: run.model,
      taskTitle: run.taskTitle,
      currentStep: run.currentStep ?? '',
      totalSteps: run.totalSteps,
      completedSteps: run.completedSteps,
      progress: run.progress,
      error: run.error ?? '',
      startedAt: run.startedAt?.toISOString() ?? '',
      completedAt: run.completedAt?.toISOString() ?? '',
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
      toolCalls:
        run.toolCalls?.map((tool) => ({
          ...tool,
          status: tool.status.toLowerCase(),
          error: tool.error ?? '',
          startedAt: tool.startedAt?.toISOString() ?? '',
          completedAt: tool.completedAt?.toISOString() ?? '',
        })) ?? [],
    }
  }
}
