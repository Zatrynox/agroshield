import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { ApiError, api, setCsrfToken } from '@/api/client';
import type { Role, Session } from '@/api/types';

type AuthStatus = 'unknown' | 'authenticated' | 'anonymous' | 'error';

const WRITE_ROLES: readonly Role[] = ['owner', 'admin', 'agronomist'];
const ACK_ROLES: readonly Role[] = ['owner', 'admin', 'agronomist', 'operator'];

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null);
  const status = ref<AuthStatus>('unknown');
  const sessionExpired = ref(false);
  const bootstrapError = ref<string | null>(null);
  let readyPromise: Promise<void> | null = null;

  const isAuthenticated = computed(() => status.value === 'authenticated' && session.value !== null);
  const role = computed<Role | null>(() => session.value?.role ?? null);
  const canWrite = computed(() => (role.value ? WRITE_ROLES.includes(role.value) : false));
  const canAcknowledge = computed(() => (role.value ? ACK_ROLES.includes(role.value) : false));
  const displayName = computed(() => session.value?.user.name ?? '');
  const organizationName = computed(() => session.value?.organization.name ?? '');

  function applySession(next: Session): void {
    session.value = next;
    setCsrfToken(next.csrfToken);
    status.value = 'authenticated';
    sessionExpired.value = false;
    bootstrapError.value = null;
  }

  function clearLocalSession(): void {
    session.value = null;
    setCsrfToken(null);
    status.value = 'anonymous';
  }

  async function bootstrap(): Promise<void> {
    bootstrapping: status.value = 'unknown';
    bootstrapError.value = null;
    try {
      const next = await api.get<Session>('/auth/me', { skipUnauthorizedHandler: true });
      applySession(next);
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        clearLocalSession();
        return;
      }
      status.value = 'error';
      bootstrapError.value =
        error instanceof ApiError
          ? error.detail
          : 'No hemos podido comprobar tu sesión. Revisa la conexión.';
    }
  }

  async function ensureReady(): Promise<void> {
    if (status.value !== 'unknown') return;
    if (!readyPromise) {
      readyPromise = bootstrap().finally(() => {
        readyPromise = null;
      });
    }
    await readyPromise;
  }

  async function login(email: string, password: string): Promise<void> {
    const next = await api.post<Session>(
      '/auth/login',
      { email: email.trim(), password },
      { skipUnauthorizedHandler: true },
    );
    applySession(next);
  }

  async function register(input: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }): Promise<void> {
    const next = await api.post<Session>(
      '/auth/register',
      {
        email: input.email.trim(),
        password: input.password,
        name: input.name.trim(),
        organizationName: input.organizationName.trim(),
      },
      { skipUnauthorizedHandler: true },
    );
    applySession(next);
  }

  async function logout(): Promise<void> {
    try {
      await api.post<void>('/auth/logout', undefined, { skipUnauthorizedHandler: true });
    } finally {
      clearLocalSession();
    }
  }

  function markSessionExpired(): void {
    if (!session.value) return;
    clearLocalSession();
    sessionExpired.value = true;
  }

  function clearExpiredNotice(): void {
    sessionExpired.value = false;
  }

  function updateOrganizationName(name: string): void {
    if (session.value) {
      session.value = {
        ...session.value,
        organization: { ...session.value.organization, name },
      };
    }
  }

  return {
    session,
    status,
    sessionExpired,
    bootstrapError,
    isAuthenticated,
    role,
    canWrite,
    canAcknowledge,
    displayName,
    organizationName,
    ensureReady,
    bootstrap,
    login,
    register,
    logout,
    markSessionExpired,
    clearExpiredNotice,
    clearLocalSession,
    updateOrganizationName,
  };
});
