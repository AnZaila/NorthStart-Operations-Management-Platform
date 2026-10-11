import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { RouteRecordRaw, Router } from 'vue-router'
import { authApi } from '@/api'
import type { MenuNode } from '@/types/models'
import { useSessionStore } from '@/stores/session'

const viewModules = import.meta.glob('../views/**/*.vue')

const PROTECTED_PATHS: Record<string, string> = {
  '/dashboard': 'dashboard:view',
  '/system/user': 'system:user:view',
  '/system/role': 'system:role:view',
  '/system/menu': 'system:menu:view',
  '/system/permission': 'system:permission:view',
  '/system/dict': 'system:dict:view',
  '/system/config': 'system:config:view',
  '/organization/department': 'org:dept:view',
  '/organization/position': 'org:position:view',
  '/audit/login': 'audit:login:view',
  '/audit/operate': 'audit:operate:view',
  '/audit/online': 'audit:online:kick',
  '/system/file': 'system:file:view',
  '/system/notice': 'ops:notice:view',
  '/monitor/server': 'monitor:server:view',
}

function resolveView(component?: string) {
  if (!component) {
    return undefined
  }
  const key = `../views/${component}.vue`
  const loader = viewModules[key]
  if (!loader) {
    console.warn(`[router] 未找到组件 ${component}`)
  }
  return loader
}

const enableLab = import.meta.env.VITE_ENABLE_LAB !== 'false'

function toRoutes(nodes: MenuNode[], parentPath = ''): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  for (const node of nodes) {
    if (node.type === 'BUTTON' || node.type === 'LINK') {
      continue
    }
    if (!enableLab && node.permission === 'lab:vue3:view') {
      continue
    }
    const children = toRoutes(node.children ?? [], node.path || parentPath)
    if (node.type === 'DIR') {
      routes.push(...children)
      continue
    }
    const loader = resolveView(node.component)
    if (!loader) {
      continue
    }
    routes.push({
      path: (node.path || '').replace(/^\//, ''),
      name: `menu-${node.id}`,
      component: loader,
      meta: {
        title: node.name,
        permission: node.permission,
        hidden: node.hidden,
      },
    })
  }
  return routes
}

function sidebarOf(nodes: MenuNode[]): MenuNode[] {
  return nodes
    .filter((node) => node.visible && !node.hidden && node.type !== 'BUTTON')
    .filter((node) => enableLab || node.permission !== 'lab:vue3:view')
    .map((node) => ({
      ...node,
      children: sidebarOf(node.children ?? []),
    }))
    .filter((node) => node.type !== 'DIR' || (node.children && node.children.length > 0))
}

export const usePermissionStore = defineStore('permission', () => {
  const menus = ref<MenuNode[]>([])
  const sidebar = computed(() => sidebarOf(menus.value))
  const routesReady = ref(false)
  const version = ref(0)

  async function ensureRoutes(router: Router) {
    if (routesReady.value) {
      return
    }
    menus.value = await authApi.menus()
    const routes = toRoutes(menus.value)
    for (const route of routes) {
      router.addRoute('RootLayout', route)
    }
    routesReady.value = true
    version.value += 1
  }

  function reset(router: Router) {
    for (const route of router.getRoutes()) {
      if (typeof route.name === 'string' && route.name.startsWith('menu-')) {
        router.removeRoute(route.name)
      }
    }
    menus.value = []
    routesReady.value = false
    version.value += 1
  }

  function canAccessPath(path: string) {
    const session = useSessionStore()
    const permission = PROTECTED_PATHS[path]
    if (!permission) {
      return true
    }
    return session.hasPermission(permission)
  }

  function isProtectedPath(path: string) {
    return path in PROTECTED_PATHS
  }

  return { menus, sidebar, routesReady, version, ensureRoutes, reset, canAccessPath, isProtectedPath }
})
