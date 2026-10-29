# Frontend — panel AgroShield

Aplicación Vue 3 del panel operativo. Consume la API `/v1` por el mismo origen (`/api/v1`), mantiene la sesión con cookie HttpOnly y usa el token CSRF que devuelve el backend.

## Stack

- Vue 3.5 + `<script setup lang="ts">`.
- Vite 6, Pinia 3 y Vue Router 4.
- Vitest + jsdom + `@vue/test-utils` para pruebas unitarias.
- `@agroshield/design-tokens` como fuente única de color, tipografía, espaciado y foco.
- Sin framework CSS: estilos propios en `src/styles/app.css` con una escala rem fija para la interfaz.

## Arranque

Desde la raíz:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env   # opcional; los valores por defecto ya sirven
pnpm install --frozen-lockfile
pnpm dev:api
pnpm dev:app
```

La app queda en `http://localhost:5173`. El proxy de Vite reescribe `/api/*` hacia `http://localhost:3000/*`, de modo que la cookie `agroshield_session` y el CSRF permanecen same-origin.

## Rutas

| Ruta | Vista | Acceso |
| --- | --- | --- |
| `/login` | `LoginView` | Solo invitados |
| `/registro` | `RegisterView` | Solo invitados |
| `/panel` | `DashboardView` | Autenticado |
| `/panel/fincas` | `FarmsView` | Autenticado |
| `/panel/fincas/:farmId` | `FarmDetailView` | Autenticado |
| `/panel/zonas/:zoneId` | `ZoneDetailView` | Autenticado |
| `/panel/alertas` | `AlertsView` | Autenticado |
| `/panel/alertas/:alertId` | `AlertDetailView` | Autenticado |
| `/panel/cuenta` | `AccountView` | Autenticado |
| `/:pathMatch(.*)*` | `NotFoundView` | Público |

`router.beforeEach` llama a `auth.ensureReady()` una sola vez, restaura la sesión con `GET /v1/auth/me` y redirige a `/login?redirect=…&reason=auth|offline` cuando corresponde. `safeRedirect` solo acepta rutas internas.

## Funcionalidad

- **Sesión:** login, registro, logout, restauración al recargar, aviso de sesión caducada y redirección con motivo. El token CSRF vive en memoria; nunca se guarda en `localStorage`.
- **Resumen:** alertas abiertas, críticas, fincas, hectáreas, zonas y prioridad del día ordenada por fecha límite.
- **Fincas y zonas:** listado, creación de finca y zona, detalle con sensores, lecturas, salud del suelo, pronóstico demo, predicción demo y alertas de la zona.
- **Alertas:** cola filtrable por finca, zona y severidad; detalle con cuenta atrás, evidencia, recomendación y reconocimiento persistente.
- **Sensores:** inscripción con clave privada mostrada una sola vez, rotación y revocación. La UI advierte que la clave no se puede recuperar.
- **Cuenta:** edición del nombre de la organización para roles de escritura.
- **Estados:** carga, error con reintento, vacío, sin conexión y sesión caducada. `OfflineBanner` distingue la falta de red de un fallo del servidor y no simula éxito.
- **RBAC en UI:** `canWrite` y `canAcknowledge` ocultan acciones no permitidas; la API vuelve a comprobarlo.
- **Accesibilidad:** enlace de salto, landmarks, foco visible, tablas con `scope`, diálogos con foco atrapado, `aria-live` para avisos y contraste verificado con axe.
- **i18n preparada:** todos los textos de interfaz pasan por `src/i18n/index.ts` con claves planas y `t()`. Solo existe el catálogo `es`; añadir otro idioma no requiere tocar las vistas.

## Estructura

```text
frontend/src/
├── api/          cliente fetch, CSRF, errores Problem Details, tipos
├── components/   AppIcon, MetricChart, OfflineBanner, SoilStrata, StateMessage, StatusBadge, ToastHost
├── i18n/         catálogo de textos y helper `t()`
├── layouts/      AuthShell y AppShell
├── lib/          configuración, formato, online, redirecciones seguras
├── stores/       auth, alerts, health, toast
├── styles/       app.css
├── views/        pantallas de la aplicación
├── router.ts
└── main.ts
```

## Configuración

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api/v1` | Base same-origin de la API. No apuntar a otro origen. |
| `VITE_DEV_API_TARGET` | `http://localhost:3000` | Destino del proxy de Vite en desarrollo. |
| `VITE_PUBLIC_BASE` | `/` | `base` de Vite. El build Docker usa `/app/`. |
| `VITE_LANDING_URL` | `http://localhost:4321` | Enlace de vuelta al sitio público. |
| `VITE_SUPPORT_EMAIL` | vacío | Correo de soporte mostrado en Cuenta. |
| `VITE_APP_ENV` | `development` | Etiqueta de entorno. |

El build de producción se sirve bajo `/app/`; `createWebHistory(import.meta.env.BASE_URL)` mantiene los deep links. Caddy devuelve `index.html` para las rutas del panel y la página 404 de la landing para assets inexistentes.

## Pruebas y calidad

```bash
pnpm --filter @agroshield/frontend typecheck
pnpm --filter @agroshield/frontend test
pnpm --filter @agroshield/frontend build
```

- 13 pruebas: cliente HTTP (Problem Details, 401, CSRF), formato de fechas/cuentas atrás y redirecciones seguras.
- El QA de navegador (`node scripts/ui-qa.mjs`) cubre login, panel, fincas, zonas, alertas, reconocimiento persistente, sesión caducada, offline y 320 px.
- Capturas en `docs/design/evidencia/`; resultados en `docs/qa/ui-qa.json`.

## Decisiones de interfaz

- Rail verde profundo, contenido claro y densidad operativa: la pantalla debe leerse como una herramienta de trabajo, no como una landing.
- El medidor de estratos de suelo (`SoilStrata`) es la firma visual; no hay animación decorativa.
- Se usan controles estándar (botones, tablas, diálogos) para que la interfaz sea predecible con guantes, prisa o poca luz.
- La cuenta atrás se actualiza cada segundo y cambia de tono al acercarse el límite; el texto sigue siendo la fuente de verdad.
- No se muestran métricas inventadas ni datos de clientes: el seed es explícitamente demo y la UI lo etiqueta.

## Limitaciones

- Sin verificación de correo, recuperación de contraseña, MFA ni invitación de miembros.
- Sin gestión de roles desde la UI; el rol viene de la organización.
- Sin WebSocket: los datos se refrescan por petición.
- Sin `learning`, `community` ni `billing`.
- El pronóstico y la predicción son demostrativos y así se etiquetan.
