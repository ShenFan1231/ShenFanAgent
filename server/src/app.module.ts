import { MiddlewareConsumer, Module, type NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AgentModule } from './agent/agent.module'
import { DashboardModule } from './business/dashboard/dashboard.module'
import { NotificationsModule } from './business/notifications/notifications.module'
import { OrdersModule } from './business/orders/orders.module'
import { ProjectsModule } from './business/projects/projects.module'
import { RequestContextMiddleware } from './common/middleware/request-context.middleware'
import { validateEnvironment } from './config/environment'
import { PrismaModule } from './database/prisma.module'
import { HealthModule } from './health/health.module'
import { IdentityAdminModule } from './identity/admin/identity-admin.module'
import { AuthModule } from './identity/auth/auth.module'
import { OperationLogsModule } from './system/operation-logs/operation-logs.module'
import { SettingsModule } from './system/settings/settings.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: ['.env.local', '.env'],
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    AgentModule,
    IdentityAdminModule,
    DashboardModule,
    OrdersModule,
    NotificationsModule,
    SettingsModule,
    OperationLogsModule,
    ProjectsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*path')
  }
}
