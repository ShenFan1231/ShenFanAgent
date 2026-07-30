import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { AppEnvironment } from '../../config/environment'
import type {
  AgentContextMessage,
  AgentExecutionPlan,
  AgentProvider,
} from './agent-provider'
import { LocalDemoAgentProvider } from './local-demo-agent.provider'

interface DeepSeekErrorResponse {
  choices?: Array<{
    delta?: {
      content?: string | null
    }
  }>
  error?: {
    message?: string
  }
}

@Injectable()
export class DeepSeekAgentProvider implements AgentProvider {
  constructor(
    private readonly config: ConfigService<AppEnvironment, true>,
    private readonly localProvider: LocalDemoAgentProvider,
  ) {}

  async createPlan(
    prompt: string,
    _context: AgentContextMessage[] = [],
  ): Promise<AgentExecutionPlan> {
    const basePlan = await this.localProvider.createPlan(prompt)
    const model = this.config.get('DEEPSEEK_MODEL', { infer: true })
    return {
      ...basePlan,
      provider: 'deepseek',
      model,
      introduction: '正在连接 DeepSeek 实时生成回答。',
      answer: '',
    }
  }

  async *streamAnswer(
    prompt: string,
    context: AgentContextMessage[] = [],
    signal?: AbortSignal,
  ): AsyncGenerator<string> {
    const model = this.config.get('DEEPSEEK_MODEL', { infer: true })
    const baseUrl = this.config.get('DEEPSEEK_BASE_URL', { infer: true })
    const apiKey = this.config.get('DEEPSEEK_API_KEY', { infer: true })
    const timeout = this.config.get('DEEPSEEK_TIMEOUT_MS', { infer: true })
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    const abortFromCaller = () => controller.abort()
    signal?.addEventListener('abort', abortFromCaller, { once: true })

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                '你是 NEBULA 企业后台中的 AI Agent。请使用简体中文回答，结合用户上下文给出清晰、可执行的结论。不要声称调用了未提供的真实业务数据；需要数据时请明确说明依据来自工作台上下文。回答控制在 500 字以内。',
            },
            ...(context.length
              ? context.slice(-10)
              : [{ role: 'user' as const, content: prompt }]),
          ],
          temperature: 0.4,
          max_tokens: 1200,
          thinking: { type: 'disabled' },
          stream: true,
        }),
        signal: controller.signal,
      })
      if (!response.ok) {
        const raw = await response.text()
        let message = raw
        try {
          message = (JSON.parse(raw) as DeepSeekErrorResponse).error?.message || raw
        } catch {
          // Keep the plain response body for diagnostics.
        }
        throw new Error(message || `HTTP ${response.status}`)
      }
      if (!response.body) throw new Error('DeepSeek 未返回流式响应体')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let receivedContent = false
      let streamDone = false
      const cancelReader = () => {
        void reader.cancel().catch(() => undefined)
      }
      controller.signal.addEventListener('abort', cancelReader, { once: true })

      try {
        while (!streamDone) {
          const { value, done } = await reader.read()
          buffer += decoder.decode(value, { stream: !done })
          const lines = buffer.split(/\r?\n/)
          buffer = lines.pop() ?? ''
          let batch = ''

          for (const line of lines) {
            if (!line.startsWith('data:')) continue
            const data = line.slice(5).trim()
            if (!data) continue
            if (data === '[DONE]') {
              streamDone = true
              break
            }
            const chunk = JSON.parse(data) as DeepSeekErrorResponse
            const delta = chunk.choices?.[0]?.delta?.content
            if (delta) batch += delta
          }
          if (batch) {
            receivedContent = true
            yield batch
          }
          if (done || streamDone) break
          await new Promise<void>((resolve) => setImmediate(resolve))
        }
      } finally {
        controller.signal.removeEventListener('abort', cancelReader)
        if (streamDone) await reader.cancel().catch(() => undefined)
      }
      if (controller.signal.aborted) throw new Error('DeepSeek 流已取消或超时')
      if (!receivedContent) throw new Error('DeepSeek 流未返回文本内容')
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) throw error
      const detail =
        error instanceof Error && error.name === 'AbortError'
          ? `请求超过 ${timeout}ms`
          : error instanceof Error
            ? error.message
            : '未知错误'
      throw new ServiceUnavailableException(`DeepSeek 调用失败：${detail}`)
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', abortFromCaller)
    }
  }
}
