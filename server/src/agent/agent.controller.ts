import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Sse,
} from '@nestjs/common'

import { RawResponse } from '../common/decorators/raw-response.decorator'
import { CurrentUser } from '../identity/auth/decorators/current-user.decorator'
import { RequirePermissions } from '../identity/auth/decorators/require-permissions.decorator'
import type { AuthenticatedUser } from '../identity/auth/types/authenticated-user'
import { AgentService } from './agent.service'
import { CreateConversationDto } from './dto/create-conversation.dto'
import { CreateRunDto } from './dto/create-run.dto'

@Controller('agent')
export class AgentController {
  constructor(private readonly service: AgentService) {}

  @Get('conversations')
  @RequirePermissions('agent:view')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listConversations(user.userId)
  }

  @Post('conversations')
  @RequirePermissions('agent:run')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.service.createConversation(user.userId, dto)
  }

  @Get('conversations/:id')
  @RequirePermissions('agent:view')
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.detail(id, user.userId)
  }

  @Post('conversations/:id/runs')
  @RequirePermissions('agent:run')
  createRun(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRunDto,
  ) {
    return this.service.createRun(id, user.userId, dto)
  }

  @Get('runs/:id')
  @RequirePermissions('agent:view')
  getRun(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getRun(id, user.userId)
  }

  @Sse('runs/:id/events')
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('X-Accel-Buffering', 'no')
  @RawResponse()
  @RequirePermissions('agent:run')
  stream(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.streamRun(id, user.userId)
  }
}
