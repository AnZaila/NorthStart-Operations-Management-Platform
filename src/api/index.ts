import { request } from '@/api/http'
import type {
  CaptchaPayload,
  DashboardOverview,
  DictItem,
  DictType,
  LoginLog,
  LoginPayload,
  MenuNode,
  Notice,
  OperLog,
  OnlineSession,
  FileObject,
  ImportResult,
  Announcement,
  Profile,
  ServerSnapshot,
  SysConfig,
  SysDept,
  SysPermissionItem,
  SysPost,
  SysRole,
  SysUser,
  TokenPair,
} from '@/types/models'
import type { PageQuery, PageResult } from '@/types/api'

export const authApi = {
  captcha: () => request<CaptchaPayload>({ url: '/auth/captcha' }),
  login: (data: LoginPayload) => request<TokenPair>({ url: '/auth/login', method: 'post', data }),
  refresh: (refreshToken: string) =>
    request<TokenPair>({ url: '/auth/refresh', method: 'post', data: { refreshToken } }),
  logout: (refreshToken?: string) =>
    request<void>({ url: '/auth/logout', method: 'post', data: { refreshToken } }),
  me: () => request<Profile>({ url: '/auth/me' }),
  menus: () => request<MenuNode[]>({ url: '/auth/menus' }),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request<void>({ url: '/auth/password', method: 'post', data }),
  updateProfile: (data: Partial<Pick<Profile, 'displayName' | 'email' | 'phone' | 'avatar'>>) =>
    request<Profile>({ url: '/auth/profile', method: 'patch', data }),
  sessions: () => request<OnlineSession[]>({ url: '/auth/sessions' }),
  kickSession: (id: number) => request<void>({ url: `/auth/sessions/${id}/kick`, method: 'post' }),
}

export const userApi = {
  page: (
    params: PageQuery & { keyword?: string; status?: string; roleId?: number; deptId?: number },
  ) => request<PageResult<SysUser>>({ url: '/system/users', params }),
  detail: (id: number) => request<SysUser>({ url: `/system/users/${id}` }),
  create: (data: Record<string, unknown>) =>
    request<{ id: number }>({ url: '/system/users', method: 'post', data }),
  update: (id: number, data: Record<string, unknown>) =>
    request<void>({ url: `/system/users/${id}`, method: 'patch', data }),
  remove: (id: number) => request<void>({ url: `/system/users/${id}`, method: 'delete' }),
  disable: (id: number) => request<void>({ url: `/system/users/${id}/disable`, method: 'post' }),
  enable: (id: number) => request<void>({ url: `/system/users/${id}/enable`, method: 'post' }),
  unlock: (id: number) => request<void>({ url: `/system/users/${id}/unlock`, method: 'post' }),
  resetPassword: (id: number) =>
    request<{ temporaryPassword: string }>({
      url: `/system/users/${id}/reset-password`,
      method: 'post',
    }),
  grantRoles: (id: number, roleIds: number[]) =>
    request<void>({ url: `/system/users/${id}/roles`, method: 'put', data: { roleIds } }),
  importUsers: (file: File) => {
    const data = new FormData()
    data.append('file', file)
    return request<ImportResult>({ url: '/system/users/import', method: 'post', data, timeout: 60000 })
  },
}

export const roleApi = {
  list: () => request<SysRole[]>({ url: '/system/roles' }),
  detail: (id: number) => request<SysRole>({ url: `/system/roles/${id}` }),
  create: (data: Record<string, unknown>) =>
    request<{ id: number }>({ url: '/system/roles', method: 'post', data }),
  update: (id: number, data: Record<string, unknown>) =>
    request<void>({ url: `/system/roles/${id}`, method: 'put', data }),
  grant: (
    id: number,
    data: { permissionCodes: string[]; dataScope?: string; deptIds?: number[] },
  ) => request<void>({ url: `/system/roles/${id}/permissions`, method: 'put', data }),
  copy: (id: number) => request<{ id: number }>({ url: `/system/roles/${id}/copy`, method: 'post' }),
  members: (id: number) => request<SysUser[]>({ url: `/system/roles/${id}/users` }),
  remove: (id: number) => request<void>({ url: `/system/roles/${id}`, method: 'delete' }),
}

export const menuApi = {
  tree: () => request<MenuNode[]>({ url: '/system/menus' }),
  create: (data: Record<string, unknown>) =>
    request<{ id: number }>({ url: '/system/menus', method: 'post', data }),
  update: (id: number, data: Record<string, unknown>) =>
    request<void>({ url: `/system/menus/${id}`, method: 'put', data }),
  remove: (id: number) => request<void>({ url: `/system/menus/${id}`, method: 'delete' }),
}

export const permissionApi = {
  list: () => request<SysPermissionItem[]>({ url: '/system/permissions' }),
  create: (data: Record<string, unknown>) =>
    request<{ id: number }>({ url: '/system/permissions', method: 'post', data }),
  update: (id: number, data: Record<string, unknown>) =>
    request<void>({ url: `/system/permissions/${id}`, method: 'put', data }),
  remove: (id: number) => request<void>({ url: `/system/permissions/${id}`, method: 'delete' }),
}

export const dictApi = {
  types: () => request<DictType[]>({ url: '/system/dicts' }),
  data: (code: string) => request<DictItem[]>({ url: `/system/dicts/${code}` }),
  createType: (data: Record<string, unknown>) =>
    request<{ id: number }>({ url: '/system/dicts', method: 'post', data }),
  updateType: (id: number, data: Record<string, unknown>) =>
    request<void>({ url: `/system/dicts/${id}`, method: 'put', data }),
  removeType: (id: number) => request<void>({ url: `/system/dicts/${id}`, method: 'delete' }),
  createItem: (code: string, data: Record<string, unknown>) =>
    request<{ id: number }>({ url: `/system/dicts/${code}/items`, method: 'post', data }),
  updateItem: (id: number, data: Record<string, unknown>) =>
    request<void>({ url: `/system/dicts/items/${id}`, method: 'put', data }),
  removeItem: (id: number) => request<void>({ url: `/system/dicts/items/${id}`, method: 'delete' }),
}

export const configApi = {
  list: () => request<SysConfig[]>({ url: '/system/configs' }),
  save: (data: SysConfig[]) => request<void>({ url: '/system/configs', method: 'put', data }),
}

export const deptApi = {
  page: (params: PageQuery & { keyword?: string; status?: string; parentId?: number }) =>
    request<PageResult<SysDept>>({ url: '/org/departments', params }),
  options: () => request<SysDept[]>({ url: '/org/departments/options' }),
  create: (data: Record<string, unknown>) =>
    request<{ id: number }>({ url: '/org/departments', method: 'post', data }),
  update: (id: number, data: Record<string, unknown>) =>
    request<void>({ url: `/org/departments/${id}`, method: 'put', data }),
  disable: (id: number) => request<void>({ url: `/org/departments/${id}/disable`, method: 'post' }),
  enable: (id: number) => request<void>({ url: `/org/departments/${id}/enable`, method: 'post' }),
  remove: (id: number) => request<void>({ url: `/org/departments/${id}`, method: 'delete' }),
}

export const postApi = {
  page: (
    params: PageQuery & { keyword?: string; status?: string; level?: string; deptId?: number },
  ) => request<PageResult<SysPost>>({ url: '/org/positions', params }),
  options: () => request<SysPost[]>({ url: '/org/positions/options' }),
  create: (data: Record<string, unknown>) =>
    request<{ id: number }>({ url: '/org/positions', method: 'post', data }),
  update: (id: number, data: Record<string, unknown>) =>
    request<void>({ url: `/org/positions/${id}`, method: 'put', data }),
  disable: (id: number) => request<void>({ url: `/org/positions/${id}/disable`, method: 'post' }),
  enable: (id: number) => request<void>({ url: `/org/positions/${id}/enable`, method: 'post' }),
  remove: (id: number) => request<void>({ url: `/org/positions/${id}`, method: 'delete' }),
}

export const auditApi = {
  logins: (params: PageQuery & { keyword?: string; success?: number }) =>
    request<PageResult<LoginLog>>({ url: '/audit/logins', params }),
  operations: (params: PageQuery & { keyword?: string }) =>
    request<PageResult<OperLog>>({ url: '/audit/operations', params }),
  online: () => request<OnlineSession[]>({ url: '/audit/online' }),
  kick: (id: number) => request<void>({ url: `/audit/online/${id}/kick`, method: 'post' }),
}

export const fileApi = {
  page: (params: PageQuery) => request<PageResult<FileObject>>({ url: '/files', params }),
  upload: (file: File, bizType = 'common') => {
    const data = new FormData()
    data.append('file', file)
    data.append('bizType', bizType)
    return request<FileObject>({ url: '/files', method: 'post', data })
  },
  remove: (id: number) => request<void>({ url: `/files/${id}`, method: 'delete' }),
}

export const dashboardApi = {
  overview: () => request<DashboardOverview>({ url: '/dashboard/overview' }),
}

export const noticeApi = {
  page: (params: PageQuery & { keyword?: string; readFlag?: number }) =>
    request<PageResult<Notice>>({ url: '/ops/notifications', params }),
  unreadCount: () => request<{ count: number }>({ url: '/ops/notifications/unread-count' }),
  read: (id: number) => request<void>({ url: `/ops/notifications/${id}/read`, method: 'post' }),
  readAll: () => request<void>({ url: '/ops/notifications/read-all', method: 'post' }),
}

export const announcementApi = {
  page: (params: PageQuery & { keyword?: string; status?: string }) =>
    request<PageResult<Announcement>>({ url: '/ops/announcements', params }),
  create: (data: Record<string, unknown>) =>
    request<{ id: number }>({ url: '/ops/announcements', method: 'post', data }),
  update: (id: number, data: Record<string, unknown>) =>
    request<void>({ url: `/ops/announcements/${id}`, method: 'put', data }),
  publish: (id: number) =>
    request<void>({ url: `/ops/announcements/${id}/publish`, method: 'post' }),
  remove: (id: number) => request<void>({ url: `/ops/announcements/${id}`, method: 'delete' }),
}

export const monitorApi = {
  server: () => request<ServerSnapshot>({ url: '/monitor/server' }),
}
