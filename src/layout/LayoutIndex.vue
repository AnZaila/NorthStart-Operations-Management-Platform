<template>
  <TopProgressBar/>
  <el-container class="layout-container">
    <el-aside :width="appStore.collapsed ? '90px' : '244px'" class="layout-aside">
      <div class="brand-block" :class="{ isCollapsed: appStore.collapsed }">
        <div class="brand-mark">N</div>
        <div v-if="!appStore.collapsed" class="brand-copy">
          <strong>Northstar</strong>
          <span>运营管理平台</span>
        </div>
      </div>
      <el-scrollbar>
        <el-menu
          :key="permissionStore.version"
          :default-active="route.path"
          :collapse="appStore.collapsed"
          router
          class="side-menu"
        >
          <SidebarMenuTree :menus="permissionStore.sidebar" />
        </el-menu>
      </el-scrollbar>

      <div class="aside-foot">
        <div class="status-dot"></div>
        <span v-if="!appStore.collapsed" style="min-width: 73px">系统运行正常</span>
      </div>
    </el-aside>

    <el-container class="content-container">
      <LayoutHeader
        v-model:collapsed="appStore.collapsed"
        :is-dark="appStore.theme === 'dark'"
        :today-label="todayLabel"
        @toggle-theme="appStore.toggleTheme"
        @command="handleCommand"
      />
      <TagsView />
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { usePermissionStore } from '@/stores/permission'
import { useSessionStore } from '@/stores/session'
import { useTabsStore } from '@/stores/tabs'
import LayoutHeader from './components/LayoutHeader.vue'
import SidebarMenuTree from './components/SidebarMenuTree.vue'
import TagsView from './components/TagsView.vue'
import TopProgressBar from '@/components/TopProgressBar.vue'

const appStore = useAppStore()
const permissionStore = usePermissionStore()
const sessionStore = useSessionStore()
const tabsStore = useTabsStore()
const route = useRoute()
const router = useRouter()

const todayLabel = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

async function handleCommand(command: string) {
  if (command === 'logout') {
    await sessionStore.logout()
    permissionStore.reset(router)
    tabsStore.reset()
    ElMessage.success('已安全退出')
    await router.push('/login')
  }
  if (command === 'profile') {
    await router.push('/profile')
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
}

.layout-aside {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-surface-elevated);
  border-right: 1px solid var(--color-border);
  transition: width 0.25s ease;
  box-shadow: 10px 0 30px var(--color-shadow-soft);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 84px;
  padding: 0 22px;
  color: var(--color-text-strong);
  &.isCollapsed {
    justify-content: center;
  }
}

.brand-mark {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 10px 10px 10px 3px;
  background: var(--color-surface-muted);
  color: var(--color-primary);
  font-family: Georgia, serif;
  font-size: 21px;
  font-weight: 700;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.2;

  strong {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 20px;
    letter-spacing: 0.02em;
  }

  span {
    margin-top: 4px;
    color: var(--color-text-muted);
    font-size: 11px;
    letter-spacing: 0.18em;
  }
}

.side-menu {
  flex: 1;
  width: 100%;
  border-right: 0;
  background: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--color-text);
  --el-menu-active-color: var(--color-primary);
  --el-menu-hover-bg-color: var(--color-surface-muted);

  :deep(.el-menu-item) {
    position: relative;

    .menu-item-link {
      display: flex;
      align-items: center;
      min-width: 0;
      flex: 1;
      height: 100%;
      color: inherit;
      text-decoration: none;
    }

    &::before {
      content: '';
      display: inline-block;
      position: absolute;
      width: 2.5px;
      height: 0;
      left: 10px;
      border-radius: 4px;
      background-color: var(--el-color-primary);
      transition: 0.3s;
    }
  }

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 50px;
    margin: 0 12px;
    border-radius: 8px;
    color: var(--color-text);
    font-size: 14px;
    background-color: transparent;
  }

  :deep(.el-menu-item:hover),
  :deep(.el-sub-menu__title:hover) {
    background: var(--color-surface-muted);
    color: var(--color-text-strong);
  }

  :deep(.el-menu-item.is-active) {
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-weight: 600;
    &::before {
      height: 30%;
    }
  }

  :deep(.el-sub-menu .el-menu-item) {
    min-width: auto;
    padding-left: 57px !important;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 13px;
    &:hover {
      background: var(--color-surface-muted);
    }
  }

  :deep(.el-sub-menu .el-menu-item.is-active) {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }

  :deep(.el-sub-menu__icon-arrow) {
    color: var(--color-text-muted);
  }
}

.aside-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin: auto 22px 24px;
  padding-top: 18px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 12px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 0 4px var(--color-success-soft);
}

.content-container {
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.layout-main {
  min-height: 0;
  flex: 1;
  padding: 20px;
  overflow: auto;
  background: transparent;
}

.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 720px) {
  .layout-aside {
    width: 76px !important;
  }

  .brand-block {
    justify-content: center;
    padding: 0;
  }

  .aside-foot span,
  .side-menu :deep(.el-menu-item),
  .side-menu :deep(.el-sub-menu__title) {
    justify-content: center;
    padding: 0 !important;
  }

  .side-menu :deep(.el-sub-menu .el-menu-item) {
    padding-left: 0 !important;
    text-align: center;
  }

  .layout-main {
    padding: 20px 16px;
  }
}
</style>
