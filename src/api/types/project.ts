import type { PageQuery } from './common'

export type ProjectType = 'game' | 'application' | 'ai_agent'
export type ProjectStatus = 'planning' | 'active' | 'paused' | 'archived'

export interface ProjectOwner {
  id: string
  username: string
  nickname: string
  avatar: string
}

export interface ProjectItem {
  id: string
  code: string
  name: string
  description: string
  type: ProjectType
  status: ProjectStatus
  owner: ProjectOwner | null
  members: number
  progress: number
  budget: number
  tags: string[]
  startedAt: string
  dueAt: string
  createdAt: string
  updatedAt: string
}

export interface ProjectQuery extends PageQuery {
  type?: ProjectType | ''
  status?: ProjectStatus | ''
}

export interface CreateProjectPayload {
  code: string
  name: string
  description?: string
  type: ProjectType
  ownerId?: string
  members: number
  budget: number
  tags?: string[]
  startedAt?: string
  dueAt?: string
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  status?: ProjectStatus
  ownerId?: string
  members?: number
  progress?: number
  budget?: number
  tags?: string[]
  startedAt?: string
  dueAt?: string
}
