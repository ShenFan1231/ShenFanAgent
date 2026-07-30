import type { PageResult } from '@/api/types/common'
import type {
  CreateProjectPayload,
  ProjectItem,
  ProjectQuery,
  UpdateProjectPayload,
} from '@/api/types/project'
import { api } from '@/utils/request'

function compactQuery(query: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== '' && value !== undefined),
  )
}

export const projectsApi = {
  list(query: ProjectQuery) {
    return api.get<PageResult<ProjectItem>>('/projects', compactQuery(query), {
      cancelKey: 'projects:list',
    })
  },

  detail(id: string) {
    return api.get<ProjectItem>(`/projects/${id}`)
  },

  create(payload: CreateProjectPayload) {
    return api.post<ProjectItem>('/projects', payload)
  },

  update(id: string, payload: UpdateProjectPayload) {
    return api.patch<ProjectItem>(`/projects/${id}`, payload)
  },

  archive(id: string) {
    return api.delete<ProjectItem>(`/projects/${id}`)
  },
}
