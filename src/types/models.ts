export type DataScope = 'ALL' | 'DEPT_TREE' | 'DEPT' | 'SELF' | 'CUSTOM'
export type UserStatus = 'active' | 'frozen' | 'pending'
export type MenuType = 'DIR' | 'MENU' | 'BUTTON' | 'LINK'

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
  mustChangePassword: boolean
}

export interface CaptchaPayload {
  captchaId: string
  question: string
  required: boolean
}

export interface LoginPayload {
  username: string
  password: string
  captchaId?: string
  captchaCode?: string
}

export interface Profile {
  id: number
  username: string
  displayName: string
  email?: string
  phone?: string
  avatar?: string
  status: UserStatus
  deptId?: number
  deptName?: string
  postId?: number
  postName?: string
  mustChangePassword: boolean
  dataScope: DataScope
  roles: string[]
  roleNames: string[]
  permissions: string[]
  lastLoginAt?: string
}

export interface MenuNode {
  id: number
  parentId?: number
  type: MenuType
  name: string
  path?: string
  component?: string
  icon?: string
  permission?: string
  visible: boolean
  hidden: boolean
  sortNo: number
  children?: MenuNode[]
}

export interface SysUser {
  id: number
  username: string
  displayName: string
  email?: string
  phone?: string
  avatar?: string
  status: UserStatus
  deptId?: number
  deptName?: string
  postId?: number
  postName?: string
  roleIds: number[]
  roleCodes: string[]
  roleNames: string[]
  lastLoginAt?: string
  createTime?: string
  remark?: string
  mustChangePassword: boolean
  locked: boolean
}

export interface SysRole {
  id: number
  code: string
  name: string
  description?: string
  builtin: boolean
  dataScope: DataScope
  status: string
  sortNo: number
  permissionCodes: string[]
  deptIds: number[]
  userCount: number
  createTime?: string
}

export interface SysDept {
  id: number
  parentId?: number
  parentName?: string
  name: string
  code: string
  leaderId?: number
  leaderName?: string
  phone?: string
  status: string
  sortNo: number
  memberCount: number
  remark?: string
  createTime?: string
}

export interface SysPost {
  id: number
  deptId: number
  deptName?: string
  name: string
  code: string
  level?: string
  headcount: number
  occupied: number
  status: string
  remark?: string
  createTime?: string
}

export interface DictType {
  id: number
  code: string
  name: string
  status: string
}

export interface DictItem {
  id: number
  dictCode: string
  label: string
  value: string
  sortNo: number
  status: string
}

export interface SysPermissionItem {
  id: number
  code: string
  name: string
  type: string
}

export interface SysConfig {
  id?: number
  configKey: string
  configValue?: string
  remark?: string
}

export interface SecurityPolicy {
  passwordMinLength: number
  passwordMaxLength: number
  passwordHistory: number
}

export interface LoginLog {
  id: number
  userId?: number
  username?: string
  success: number
  ip?: string
  userAgent?: string
  reason?: string
  createTime?: string
}

export interface OperLog {
  id: number
  userId?: number
  username?: string
  module?: string
  action?: string
  resource?: string
  resourceId?: string
  ip?: string
  success: number
  durationMs?: number
  createTime?: string
}

export interface Notice {
  id: number
  title: string
  content?: string
  type?: string
  readFlag: number
  createTime?: string
}

export interface Announcement {
  id: number
  title: string
  content?: string
  type: string
  status: 'draft' | 'published'
  publisherId?: number
  publisherName?: string
  publishTime?: string
  recipientCount?: number
  createTime?: string
}

export interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export interface ServerSnapshot {
  os: {
    name: string
    arch: string
    version: string
    cpuCount: number
    systemLoad: number
    cpuPercent: number
  }
  jvm: {
    name: string
    version: string
    vendor: string
    startTime: string
    uptime: string
    home: string
    pid: number
  }
  memory: {
    heapUsed: number
    heapMax: number
    nonHeapUsed: number
    physicalTotal: number
    physicalFree: number
  }
  disks: Array<{
    path: string
    type: string
    total: number
    usable: number
  }>
}

export interface FileObject {
  id: number
  originalName: string
  url: string
  contentType?: string
  sizeBytes?: number
  bizType?: string
  userId?: number
  uploader?: string
  createTime?: string
}

export interface OnlineSession {
  id: number
  userId?: number
  username?: string
  displayName?: string
  ip?: string
  userAgent?: string
  loginTime?: string
  expireTime?: string
  current?: boolean
}

export interface DashboardMetric {
  label: string
  value: string
  trend: string
  trendType: 'up' | 'down'
  permission?: string
}

export interface DashboardTask {
  title: string
  desc: string
  tag: string
  type: 'danger' | 'warning' | 'success' | 'info'
}

export interface DashboardOverview {
  displayName: string
  todoCount: number
  pendingApproval: number
  todayVisits: number
  onlineRate: string
  metrics: DashboardMetric[]
  tasks: DashboardTask[]
  traffic: { days: string[]; values: number[] }
  sources: { name: string; value: number }[]
  orders: { days: string[]; completed: number[]; pending: number[] }
}
