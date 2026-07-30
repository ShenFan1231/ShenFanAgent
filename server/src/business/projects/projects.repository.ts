import { Injectable } from '@nestjs/common'

import {
  Prisma,
  ProjectStatus,
  ProjectType,
} from '../../../generated/prisma'
import { PrismaService } from '../../database/prisma.service'

const includeOwner = {
  owner: {
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true,
    },
  },
} as const

export interface ProjectListInput {
  page: number
  pageSize: number
  keyword?: string
  type?: ProjectType
  status?: ProjectStatus
}

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(input: ProjectListInput) {
    const keyword = input.keyword?.trim()
    const where: Prisma.ProjectWhereInput = {
      type: input.type,
      status: input.status,
      OR: keyword
        ? [
            { code: { contains: keyword, mode: 'insensitive' } },
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
          ]
        : undefined,
    }
    const [list, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: includeOwner,
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.project.count({ where }),
    ])
    return { list, total }
  }

  findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: includeOwner,
    })
  }

  findByCode(code: string) {
    return this.prisma.project.findUnique({ where: { code } })
  }

  create(data: Prisma.ProjectUncheckedCreateInput) {
    return this.prisma.project.create({
      data,
      include: includeOwner,
    })
  }

  update(id: string, data: Prisma.ProjectUncheckedUpdateInput) {
    return this.prisma.project.update({
      where: { id },
      data,
      include: includeOwner,
    })
  }
}
