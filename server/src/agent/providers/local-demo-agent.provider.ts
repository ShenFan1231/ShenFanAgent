import { Injectable } from '@nestjs/common'

import type {
  AgentExecutionPlan,
  AgentProvider,
} from './agent-provider'

@Injectable()
export class LocalDemoAgentProvider implements AgentProvider {
  async createPlan(prompt: string): Promise<AgentExecutionPlan> {
    const normalized = prompt.trim()
    const isProject = /项目|风险|进度|里程碑/.test(normalized)
    const isOperation = /运营|订单|收入|转化|数据/.test(normalized)

    if (isProject) {
      return {
        provider: 'local-demo',
        model: 'nebula-agent-v1',
        taskTitle: '项目风险分析',
        introduction: '我会先读取项目概况，再评估进度与风险信号。',
        tools: [
          {
            name: 'projects.query',
            displayName: '读取项目数据',
            input: { scope: 'active', fields: ['progress', 'dueAt', 'members'] },
            output: { scanned: 3, active: 2, delayedRisk: 1 },
            progress: 38,
            statusText: '已获取 3 个项目的进度与排期',
          },
          {
            name: 'risk.evaluate',
            displayName: '评估交付风险',
            input: { dimensions: ['schedule', 'capacity', 'scope'] },
            output: { high: 1, medium: 1, low: 1 },
            progress: 72,
            statusText: '风险矩阵计算完成',
          },
        ],
        answer:
          '分析完成：当前最需要关注的是一个临近截止日期但进度不足的项目。建议今天确认关键路径负责人，将非核心需求移出本期，并在未来三天每天同步一次燃尽情况。其余项目整体可控，可继续按周复盘。',
      }
    }

    if (isOperation) {
      return {
        provider: 'local-demo',
        model: 'nebula-agent-v1',
        taskTitle: '运营数据洞察',
        introduction: '我会聚合核心业务指标，并定位变化最明显的维度。',
        tools: [
          {
            name: 'metrics.aggregate',
            displayName: '聚合经营指标',
            input: { range: 'last_7_days', metrics: ['orders', 'revenue', 'conversion'] },
            output: { orders: 1286, revenue: 428600, conversion: 0.064 },
            progress: 42,
            statusText: '核心指标聚合完成',
          },
          {
            name: 'trend.compare',
            displayName: '执行趋势对比',
            input: { baseline: 'previous_7_days' },
            output: { ordersChange: 0.123, revenueChange: 0.087, conversionChange: -0.004 },
            progress: 76,
            statusText: '环比趋势分析完成',
          },
        ],
        answer:
          '本周订单量和收入保持增长，订单增幅高于收入增幅，说明客单价略有回落。转化率基本稳定但仍有优化空间。建议优先检查高流量低转化渠道，并针对高价值用户设计组合包，以提升客单价。',
      }
    }

    return {
      provider: 'local-demo',
      model: 'nebula-agent-v1',
      taskTitle: '智能任务处理',
      introduction: '我会整理你的目标，检索工作台上下文，并生成可执行建议。',
      tools: [
        {
          name: 'context.search',
          displayName: '检索业务上下文',
          input: { query: normalized, limit: 5 },
          output: { matches: 4, sources: ['projects', 'orders', 'system_settings'] },
          progress: 48,
          statusText: '相关业务上下文检索完成',
        },
        {
          name: 'report.compose',
          displayName: '生成执行建议',
          input: { format: 'action_plan' },
          output: { sections: 3, confidence: 0.91 },
          progress: 80,
          statusText: '执行方案已生成',
        },
      ],
      answer:
        `已完成对“${normalized}”的处理。建议先明确可衡量的完成标准，再把任务拆成负责人、截止时间和验证方式三个维度；执行过程中保留关键事件记录，完成后用同一组指标复盘效果。`,
    }
  }
}
