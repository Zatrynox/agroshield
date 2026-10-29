import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { safeRedirect } from '@/lib/redirect';

export { safeRedirect };

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    title?: string;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, top: 80, behavior: 'smooth' };
    return { top: 0 };
  },
  routes: [
    {
      path: '/',
      redirect: '/panel',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true, title: 'Entrar' },
    },
    {
      path: '/registro',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true, title: 'Crear cuenta' },
    },
    {
      path: '/panel',
      component: () => import('@/layouts/AppShell.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { requiresAuth: true, title: 'Resumen' },
        },
        {
          path: 'fincas',
          name: 'farms',
          component: () => import('@/views/FarmsView.vue'),
          meta: { requiresAuth: true, title: 'Fincas' },
        },
        {
          path: 'fincas/:farmId',
          name: 'farm-detail',
          component: () => import('@/views/FarmDetailView.vue'),
          meta: { requiresAuth: true, title: 'Finca' },
        },
        {
          path: 'zonas/:zoneId',
          name: 'zone-detail',
          component: () => import('@/views/ZoneDetailView.vue'),
          meta: { requiresAuth: true, title: 'Zona' },
        },
        {
          path: 'alertas',
          name: 'alerts',
          component: () => import('@/views/AlertsView.vue'),
          meta: { requiresAuth: true, title: 'Alertas' },
        },
        {
          path: 'alertas/:alertId',
          name: 'alert-detail',
          component: () => import('@/views/AlertDetailView.vue'),
          meta: { requiresAuth: true, title: 'Alerta' },
        },
        {
          path: 'cuenta',
          name: 'account',
          component: () => import('@/views/AccountView.vue'),
          meta: { requiresAuth: true, title: 'Cuenta' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Página no encontrada' },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.ensureReady();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
        reason: auth.status === 'error' ? 'offline' : 'auth',
      },
    };
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' };
  }

  return true;
});

router.afterEach((to) => {
  const title = to.meta.title ? `${to.meta.title} · AgroShield` : 'AgroShield';
  document.title = title;
});

export default router;
