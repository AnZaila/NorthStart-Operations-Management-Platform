import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/LoginPage.vue'),
      meta: { title: '登录', public: true },
    },
    {
      path: '/500',
      name: 'ServerError',
      component: () => import('@/views/error/ServerError.vue'),
      meta: { title: '服务异常', public: true },
    },
    {
      path: '/',
      name: 'RootLayout',
      component: () => import('@/layout/LayoutIndex.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'inbox',
          name: 'Inbox',
          component: () => import('@/views/ops/InboxHome.vue'),
          meta: { title: '消息中心' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/404/NotFound.vue'),
      meta: { title: '页面不存在', public: true },
    },
  ],
})

setupGuards(router)

export default router
