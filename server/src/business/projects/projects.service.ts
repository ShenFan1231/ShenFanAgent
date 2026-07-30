import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import {
  Prisma,
  ProjectStatus,
  ProjectType,
} from '../../../generated/prisma'
import type { CreateProjectDto } from './dto/create-project.dto'
import type { ProjectQueryDto } from './dto/project-query.dto'
import type { UpdateProjectDto } from './dto/update-project.dto'
import { ProjectsRepository } from './projects.repository'

const typeMap = {
  game: ProjectType.GAME,
  application: ProjectType.APPLICATION,
  ai_agent: ProjectType.AI_AGENT,
} as const

const statusMap = {
  planning: ProjectStatus.PLANNING,
  active: ProjectStatus.ACTIVE,
  paused: ProjectStatus.PAUSED,
  archived: ProjectStatus.ARCHIVED,
} as const

@Injectable()
export class ProjectsService {
  constructor(private readonly repository: ProjectsRepository) {}

  async list(query: ProjectQueryDto) {
    const result = await this.repository.list({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword,
      type: query.type ? typeMap[query.type] : undefined,
      status: query.status ? statusMap[query.status] : undefined,
    })
    return {
      list: result.list.map((item) => this.toItem(item)),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    }
  }

  async detail(id: string) {
    const project = await this.repository.findById(id)
    if (!project) throw new NotFoundException('项目不存在')
    return this.toItem(project)
  }

  async create(dto: CreateProjectDto) {
    const code = dto.code.trim().toUpperCase()
    if (await this.repository.findByCode(code)) {
      throw new ConflictException('项目编码已存在')
    }
    const project = await this.repository.create({
      code,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      type: typeMap[dto.type],
      ownerId: dto.ownerId,
      members: dto.members,
      budget: new Prisma.Decimal(dto.budget),
      tags: dto.tags ?? [],
      startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
    })
    return this.toItem(project)
  }

  async update(id: string, dto: UpdateProjectDto) {
    if (!(await this.repository.findById(id))) throw new NotFoundException('项目不存在')
    const project = await this.repository.update(id, {
      name: dto.name?.trim(),
      description: dto.description?.trim(),
      status: dto.status ? statusMap[dto.status] : undefined,
      ownerId: dto.ownerId,
      members: dto.members,
      progress: dto.progress,
      budget: dto.budget === undefined ? undefined : new Prisma.Decimal(dto.budget),
      tags: dto.tags,
      startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
    })
    return this.toItem(project)
  }

  async archive(id: string) {
    if (!(await this.repository.findById(id))) throw new NotFoundException('项目不存在')
    return this.toItem(await this.repository.update(id, { status: ProjectStatus.ARCHIVED }))
  }

  private toItem(project: Awaited<ReturnType<ProjectsRepository['findById']>> & {}) {
    if (!project) throw new NotFoundException('项目不存在')
    return {
      id: project.id,
      code: project.code,
      name: project.name,
      description: project.description ?? '',
      type: project.type.toLowerCase(),
      status: project.status.toLowerCase(),
      owner: project.owner
        ? {
            id: project.owner.id,
            username: project.owner.username,
            nickname: project.owner.nickname,
            avatar: project.owner.avatar ?? '',
          }
        : null,
      members: project.members,
      progress: project.progress,
      budget: Number(project.budget),
      tags: project.tags,
      startedAt: project.startedAt?.toISOString() ?? '',
      dueAt: project.dueAt?.toISOString() ?? '',
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }
  }
}
