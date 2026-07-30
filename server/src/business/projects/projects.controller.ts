import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'

import { RequirePermissions } from '../../identity/auth/decorators/require-permissions.decorator'
import { CreateProjectDto } from './dto/create-project.dto'
import { ProjectQueryDto } from './dto/project-query.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ProjectsService } from './projects.service'

@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  @RequirePermissions('project:view')
  list(@Query() query: ProjectQueryDto) {
    return this.service.list(query)
  }

  @Get(':id')
  @RequirePermissions('project:view')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.detail(id)
  }

  @Post()
  @RequirePermissions('project:create')
  create(@Body() dto: CreateProjectDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  @RequirePermissions('project:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @RequirePermissions('project:delete')
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.archive(id)
  }
}
