import { Injectable } from '@nestjs/common'

import {
  AgentMessageRole,
  AgentRunStatus,
  AgentToolStatus,
  type Prisma,
} from '../../generated/prisma'
import { PrismaService } from '../database/prisma.service'

const conversationDetailInclude = {
  messages: { orderBy: { sequence: 'asc' as const } },
  runs: {
    orderBy: { createdAt: 'desc' as const },
    include: { toolCalls: { orderBy: { createdAt: 'asc' as const } } },
  },
} as const

@Injectable()
export class AgentRepository {
  constructor(private readonly prisma: PrismaService) {}

  listConversations(userId: string) {
    return this.prisma.agentConversation.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: [
        { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      include: {
        _count: { select: { messages: true } },
        runs: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { status: true, progress: true, updatedAt: true },
        },
      },
    })
  }

  findConversation(id: string, userId: string) {
    return this.prisma.agentConversation.findFirst({
      where: { id, userId },
      include: conversationDetailInclude,
    })
  }

  createConversation(userId: string, title: string) {
    return this.prisma.agentConversation.create({
      data: { userId, title },
      include: conversationDetailInclude,
    })
  }

  async createRun(conversationId: string, userId: string, prompt: string) {
    return this.prisma.$transaction(async (transaction) => {
      const conversation = await transaction.agentConversation.findFirst({
        where: { id: conversationId, userId },
      })
      if (!conversation) return null

      const aggregate = await transaction.agentMessage.aggregate({
        where: { conversationId },
        _max: { sequence: true },
      })
      const sequence = (aggregate._max.sequence ?? 0) + 1
      const now = new Date()
      const run = await transaction.agentRun.create({
        data: {
          conversationId,
          requestedById: userId,
          provider: 'local-demo',
          model: 'nebula-agent-v1',
          taskTitle: '正在分析任务',
          totalSteps: 4,
        },
      })
      await transaction.agentMessage.create({
        data: {
          conversationId,
          runId: run.id,
          authorId: userId,
          role: AgentMessageRole.USER,
          content: prompt,
          sequence,
        },
      })
      await transaction.agentConversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: now,
          title:
            conversation.title === '新会话'
              ? prompt.slice(0, 28)
              : undefined,
        },
      })
      return run
    })
  }

  async claimRun(id: string, userId: string) {
    const claimed = await this.prisma.agentRun.updateMany({
      where: { id, requestedById: userId, status: AgentRunStatus.PENDING },
      data: {
        status: AgentRunStatus.RUNNING,
        startedAt: new Date(),
        currentStep: '准备执行',
        progress: 5,
      },
    })
    if (claimed.count !== 1) return null
    return this.prisma.agentRun.findUnique({
      where: { id },
      include: {
        conversation: {
          include: {
            messages: {
              where: { role: { in: [AgentMessageRole.USER, AgentMessageRole.ASSISTANT] } },
              orderBy: { sequence: 'desc' },
              take: 12,
            },
          },
        },
        messages: { where: { role: AgentMessageRole.USER }, orderBy: { sequence: 'desc' }, take: 1 },
      },
    })
  }

  findRun(id: string, userId: string) {
    return this.prisma.agentRun.findFirst({
      where: { id, requestedById: userId },
      include: {
        toolCalls: { orderBy: { createdAt: 'asc' } },
        messages: { orderBy: { sequence: 'asc' } },
      },
    })
  }

  updateRun(id: string, data: Prisma.AgentRunUpdateInput) {
    return this.prisma.agentRun.update({ where: { id }, data })
  }

  createToolCall(data: Prisma.AgentToolCallUncheckedCreateInput) {
    return this.prisma.agentToolCall.create({ data })
  }

  updateToolCall(id: string, data: Prisma.AgentToolCallUpdateInput) {
    return this.prisma.agentToolCall.update({ where: { id }, data })
  }

  async completeRun(runId: string, conversationId: string, answer: string) {
    return this.prisma.$transaction(async (transaction) => {
      const aggregate = await transaction.agentMessage.aggregate({
        where: { conversationId },
        _max: { sequence: true },
      })
      const message = await transaction.agentMessage.create({
        data: {
          conversationId,
          runId,
          role: AgentMessageRole.ASSISTANT,
          content: answer,
          sequence: (aggregate._max.sequence ?? 0) + 1,
          metadata: { streamed: true },
        },
      })
      await transaction.agentRun.update({
        where: { id: runId },
        data: {
          status: AgentRunStatus.COMPLETED,
          currentStep: '任务完成',
          completedSteps: 4,
          progress: 100,
          completedAt: new Date(),
        },
      })
      await transaction.agentConversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          summary: answer.slice(0, 180),
        },
      })
      return message
    })
  }

  failRun(id: string, error: string) {
    return this.prisma.agentRun.update({
      where: { id },
      data: {
        status: AgentRunStatus.FAILED,
        error,
        currentStep: '执行失败',
        completedAt: new Date(),
      },
    })
  }
}
