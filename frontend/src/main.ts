import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '@agroshield/design-tokens/tokens.css';
import './styles/app.css';
import App from './App.vue';
import router from './router';
import { onUnauthorized } from './api/client';
import { useAuthStore } from './stores/auth';
import { useAlertsStore } from './stores/alerts';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

onUnauthorized(() => {
  const auth = useAuthStore(pinia);
  const hadSession = auth.isAuthenticated;
  auth.markSessionExpired();
  const current = router.currentRoute.value;
  if (hadSession && current.meta.requiresAuth) {
    void router.replace({ name: 'login', query: { reason: 'expired', redirect: current.fullPath } });
  }
});

router.afterEach((to) => {
  if (!to.meta.requiresAuth) {
    useAlertsStore(pinia).reset();
  }
});

app.config.errorHandler = (error) => {
  if (import.meta.env.DEV) {
    console.error(error);
  }
};

app.mount('#app');
