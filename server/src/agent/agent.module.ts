import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { AppEnvironment } from '../config/environment'
import { AgentController } from './agent.controller'
import { AgentRepository } from './agent.repository'
import { AgentService } from './agent.service'
import { AGENT_PROVIDER } from './providers/agent-provider'
import { DeepSeekAgentProvider } from './providers/deepseek-agent.provider'
import { LocalDemoAgentProvider } from './providers/local-demo-agent.provider'

@Module({
  controllers: [AgentController],
  providers: [
    AgentRepository,
    AgentService,
    LocalDemoAgentProvider,
    DeepSeekAgentProvider,
    {
      provide: AGENT_PROVIDER,
      inject: [ConfigService, LocalDemoAgentProvider, DeepSeekAgentProvider],
      useFactory: (
        config: ConfigService<AppEnvironment, true>,
        localProvider: LocalDemoAgentProvider,
        deepseekProvider: DeepSeekAgentProvider,
      ) =>
        config.get('AGENT_PROVIDER', { infer: true }) === 'deepseek'
          ? deepseekProvider
          : localProvider,
    },
  ],
})
export class AgentModule {}
