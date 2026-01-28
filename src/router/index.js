import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/login',
      redirect: '/',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/redirect',
      name: 'redirect',
      component: () => import('../views/RedirectView.vue'),
    },
    {
      path: '/panel',
      name: 'panel',
      component: () => import('../views/PanelView.vue'),
      redirect: '/panel/basic',
      children: [
        {
          path: 'basic',
          name: 'panel-basic',
          component: () => import('../views/panel/BasicPanel.vue'),
        },
        {
          path: 'show',
          name: 'panel-show',
          component: () => import('../views/panel/ShowPanel.vue'),
        },
        {
          path: 'report',
          name: 'panel-report',
          component: () => import('../views/panel/ReportPanel.vue'),
        },
        {
          path: 'history',
          name: 'panel-history',
          component: () => import('../views/panel/HistoryPanel.vue'),
        },
      ],
    },
    // 404 捕获路由 - 必须放在最后
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
