# Estado y trabajo pendiente — AgroShield

Registro reanudable de la entrega `0.1.0`. Última actualización: **2026-10-30**.

> **Commits de referencia:** `8ae7442` — `feat: deliver AgroShield demo platform`; `615caea` — `docs: record initial commit and final QA counts`; `0c41d3a` — `fix: harden containers and record Docker verification` (cierre de la ronda Docker).

## 1. Dónde está el proyecto

```text
C:\Users\vcris\OneDrive\Escritorio\AgroShield
```

- Rama: `main`; commits `8ae7442`, `615caea` y `0c41d3a`. El árbol queda limpio tras el commit de cierre de esta ronda.
- Workspace pnpm con `backend/`, `frontend/`, `landing/` y `packages/design-tokens/`.
- Node `24.15.0`, pnpm `11.1.2`, Docker `29.9.2`, Compose `v5.6.1`.
- Stack local Docker funcionando en `http://localhost:8088` (el `8080` del host lo ocupa `httpd.exe`).

## 2. Estado verificado

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| `pnpm typecheck` | Pasa | Salida de consola |
| `pnpm test` | 77/77 | 41 backend, 13 frontend, 23 landing |
| `pnpm build` | Pasa | `backend/dist`, `frontend/dist`, `landing/dist` |
| `pnpm verify:infra` | Pasa | Validación estática |
| `pnpm verify:links` | 73/73 | `docs/qa/link-check.json` |
| Smoke API | 23/23 | `scripts/e2e-smoke.mjs` |
| UI QA | 39/39 | `docs/qa/ui-qa.json` |
| axe | 0 violaciones | `docs/qa/axe/` |
| Lighthouse móvil home | 97/100/100/100 | `docs/qa/lighthouse-mobile-home.json` |
| Lighthouse móvil demo | 99/100/100/100 | `docs/qa/lighthouse-mobile-demo.json` |
| Lighthouse escritorio | 100/100/100/100 | `docs/qa/lighthouse-desktop-home.json` |
| Overflow 320 px | Corregido | `docs/design/evidencia/app-zone-320.png` |
| `docker run --rm hello-world` | Correcto | Consola, 2026-10-30 |
| Compose local/dev/prod | Configuración válida | `docker compose ... config -q` |
| Build backend/web | Correcto | `agroshield-backend:local`, `agroshield-web:local` |
| Trivy HIGH/CRITICAL | 0 en ambas imágenes | `pnpm scan:images` |
| Gitleaks working tree/historial | Limpio | `pnpm scan:secrets` |
| Smoke de API en Docker | 23/23 | `E2E_API_URL=http://localhost:8088/api` |
| Stack de producción | **No ejecutado** | Requiere dominio, TLS, secretos y legal |
| CI en GitHub Actions | **No ejecutado** | No hay remoto |

## 3. Trabajo pendiente

### P0 — Bloquea el lanzamiento

- [x] **Crear el commit inicial** en `main` (`8ae7442`) y actualizar este documento con el hash.
- [ ] **Ejecutar CI completo** (`.github/workflows/ci.yml`): quality, infra, secrets, containers.
- [x] **Verificar Docker en esta máquina (2026-10-30):**
  - [x] `docker run --rm hello-world`
  - [x] `docker compose -f compose.yaml config -q`
  - [x] `docker compose -f compose.dev.yaml config -q`
  - [x] `compose.prod.yaml config -q` con un env de prueba (sin secretos reales)
  - [x] builds de `agroshield-backend` y `agroshield-web`
  - [x] Trivy HIGH/CRITICAL — 0 hallazgos corregibles
  - [x] Gitleaks working tree e historial — limpio
  - [x] `docker compose up -d --build` + smoke + login demo — 23/23 en `8088`
  - Nota: `8080` estaba ocupado por `httpd.exe`; se usó un override temporal no versionado.
- [ ] **Completar identidad legal y contacto real** en `infra/env/prod.env` y en el build de la landing:
  - `PROD_LEGAL_ENTITY`, `PROD_LEGAL_ADDRESS`, `PROD_SUPPORT_EMAIL`, `PROD_WHATSAPP_NUMBER`
  - revisar `privacidad`, `terminos`, `cookies` con asesoría legal.
- [ ] **Secretos reales:** `PROD_SESSION_SECRET`, `PROD_POSTGRES_PASSWORD`, `PROD_DATABASE_URL`; permisos `600`; rotar cualquier valor expuesto.
- [ ] **Desplegar producción** con dominio real, TLS/ACME, HSTS, cookies `Secure`, CORS HTTPS y docs desactivadas.
- [ ] **Backups cifrados + restauración probada** de PostgreSQL.
- [ ] **Monitorización y logs** centralizados; alertas de caída/errores.

### P1 — Necesario antes de clientes reales

- [ ] `learning`, `community` y `billing`: decidir alcance e implementar, o mantener fuera del producto.
- [ ] Verificación de correo, recuperación de contraseña y MFA.
- [ ] Gestión de miembros y roles desde la UI.
- [ ] Retención y purga de leads, eventos de analítica y sesiones expiradas.
- [ ] Auditoría exportable de cambios sensibles (roles, sensores, organización).
- [ ] Sustituir `script-src 'unsafe-inline'` por nonces/hashes en Caddy.
- [ ] Añadir Playwright/UI QA a CI (hoy es local).
- [ ] Fijar GitHub Actions por SHA y añadir firma/procedencia de imágenes.
- [ ] Runbook de incidentes y canal `security@`.
- [ ] Revisar CSP y cabeceras con escáner externo; considerar WAF.
- [ ] Probar con lector de pantalla (NVDA/VoiceOver), Safari iOS y Firefox.
- [ ] Definir proceso de aprovisionamiento/revocación de sensores y de importación de datos.

### P2 — Mejora continua

- [ ] Modo oscuro o tema de campo nocturno (hoy `color-scheme: light`).
- [ ] Selector de idioma y catálogo inglés; el panel ya usa `t()`.
- [ ] Vídeo de producto real (hoy decisión documentada de no fabricarlo).
- [ ] WebSocket o SSE para alertas en tiempo real.
- [ ] Scheduler/cola para reevaluar alertas sin lecturas.
- [ ] Más pruebas de carga, caos y accesibilidad manual.
- [ ] Panel de métricas de analítica propia.
- [ ] Publicar `packages/design-tokens` si se reutiliza fuera del monorepo.

## 4. Rarezas conocidas y cómo tratarlas

| Rareza | Explicación | Acción |
| --- | --- | --- |
| PGlite devuelve datos obsoletos tras `pnpm seed` | PGlite es monoproceso; la API mantiene una conexión | Detener la API, ejecutar `pnpm seed`, reiniciar la API |
| UI QA requiere una alerta abierta | El flujo de reconocimiento necesita datos | Seed fresco y reinicio antes de `node scripts/ui-qa.mjs` |
| 5 errores de consola en UI QA | Comprobaciones negativas intencionadas (401 anónimo, 403 analítica/CSRF) | No son fallos; `failedRequests` está vacío |
| `pnpm install` en no-TTY purga `node_modules` | Comportamiento de pnpm | `CI=true pnpm install --frozen-lockfile --prod=false` |
| Chrome no está en PATH | Playwright usa `channel: 'chrome'` | `CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe` |
| Caddy no está instalado en el host | La imagen web compila su propio binario `2.11.7`; la validación estática lo omite si no hay `CADDY_BIN` | Usar el contenedor o `CADDY_BIN=...` |
| `make`, `gitleaks`, `trivy` ausentes en el host | Los escaneos se ejecutan en contenedores fijados por digest | Usar `pnpm scan:*` (requiere Docker) |
| Puerto `8080` ocupado por `httpd.exe` | El stack local no puede publicar el puerto por defecto | Publicar `8088` con un override local no versionado |
| Primer escaneo Trivy descarga ~131 MiB | Sin caché local | Se reutiliza el volumen `agroshield-trivy-cache` |
| `.taste-skill/` y `skills-lock.json` ignorados | Artefactos de tooling, no del producto | No commitear; la dirección está en `docs/design/` |
| `docs/design/direccion-taste.md` tiene caracteres dañados | Codificación original del generador | La versión legible es `docs/design/DESIGN.md` |

## 5. Cómo reanudar

### 5.1 Entorno

```powershell
cd C:\Users\vcris\OneDrive\Escritorio\AgroShield
Copy-Item .env.example .env -ErrorAction SilentlyContinue
Copy-Item landing/.env.example landing/.env -ErrorAction SilentlyContinue
$env:CI = 'true'
pnpm install --frozen-lockfile --prod=false
```

### 5.2 Calidad

```powershell
pnpm typecheck
pnpm test
pnpm build
pnpm verify:infra
```

### 5.3 Servidores locales

Tres terminales:

```powershell
pnpm dev:api
pnpm dev:app
pnpm dev:landing
```

Con PGlite, para sembrar:

```powershell
# detener la API (Ctrl+C o matar el proceso del puerto 3000)
pnpm seed
pnpm dev:api
```

Credenciales demo: `demo@agroshield.example` / valor de `DEMO_PASSWORD` en `.env` (ejemplo: `Demo-AgroShield-2026!`).

### 5.4 QA

```powershell
node scripts/e2e-smoke.mjs
node scripts/check-links.mjs
node scripts/ui-qa.mjs
```

El QA de UI escribe capturas en `docs/design/evidencia/` y resultados en `docs/qa/`. Requiere Chrome y los tres servidores.

### 5.5 Docker

El stack verificado sigue levantado en `http://localhost:8088` con el override temporal `C:\Users\vcris\AppData\Local\Temp\opencode\agroshield-local-8088.yaml` (no versionado). Para reproducirlo:

```powershell
docker run --rm hello-world
docker compose --env-file .env -f compose.yaml -f C:\Users\vcris\AppData\Local\Temp\opencode\agroshield-local-8088.yaml up -d --build
```

Si el `8080` está libre, usa el comando normal:

```powershell
docker compose --env-file .env -f compose.yaml up -d --build
# o: pnpm stack:up
```

Smoke: `http://localhost:8088/`, `/demo`, `/app/`, `/api/health`, `/documentation/json`, login demo. API smoke automatizado:

```powershell
$env:E2E_API_URL='http://localhost:8088/api'
node scripts/e2e-smoke.mjs
Remove-Item Env:E2E_API_URL
```

Tras el smoke, el seed deja 5 alertas abiertas y crea un lead `[E2E]`; para restaurar la base:

```powershell
docker compose --env-file .env -f compose.yaml -f C:\Users\vcris\AppData\Local\Temp\opencode\agroshield-local-8088.yaml run --rm seed
docker exec agroshield-local-db-1 psql -U agroshield -d agroshield -c "delete from leads where name like '%E2E%'; delete from analytics_events;"
```

### 5.6 CI

Subir `main` a GitHub y ejecutar el workflow `CI`. Si falla:

1. `quality`: revisar typecheck/tests/build.
2. `infra`: revisar render de Compose y Caddy.
3. `secrets`: revisar `.env` versionados o hallazgos de Gitleaks.
4. `containers`: revisar build, Trivy, arranque y smoke.

## 6. Mapa de archivos clave

| Ruta | Qué contiene |
| --- | --- |
| `README.md` | Visión, arranque, arquitectura, comandos |
| `PRODUCT.md` | Contexto de producto y restricciones |
| `DECISIONS.md` | Decisiones de arquitectura y producto |
| `SECURITY.md` | Modelo de seguridad y hardening |
| `backend/README.md` | API, dominio, migraciones, configuración |
| `frontend/README.md` | Panel, rutas, estados, i18n |
| `landing/README.md` | Sitio público, formulario, SEO, consentimiento |
| `infra/README.md` | Docker, Compose, Caddy, CI |
| `docs/design/DESIGN.md` | Sistema visual y evidencia |
| `docs/design/direccion-taste.md` | Dirección creativa original |
| `docs/launch-checklist.md` | Checklist de lanzamiento |
| `docs/qa/qa-report.md` | Informe de QA |
| `docs/status/PENDING.md` | Este documento |
| `docs/qa/ui-qa.json` | Último resultado de UI QA |
| `docs/qa/axe/` | Informes axe |
| `docs/qa/lighthouse-*.json` | Informes Lighthouse |
| `docs/design/evidencia/` | Capturas |
| `scripts/ui-qa.mjs` | QA de navegador |
| `scripts/e2e-smoke.mjs` | Smoke de API |
| `scripts/check-links.mjs` | Comprobación de enlaces |
| `scripts/validate-infra.mjs` | Validación estática de infraestructura |
| `scripts/stack.mjs` | Ciclo de vida de Compose |
| `scripts/scan.mjs` | Gitleaks/Trivy |
| `.github/workflows/ci.yml` | CI de cuatro jobs |

## 7. Reglas para la siguiente sesión

1. **No** ejecutes `pnpm seed` contra una base con datos reales; es destructivo para `agroshield-demo`.
2. **No** commitees `.env`, `infra/env/prod.env`, claves, capturas de debug ni `backend/.data/`.
3. **No** presentes `learning`, `community` o `billing` como funcionales.
4. **No** inventes clientes, métricas, testimonios ni resultados agronómicos.
5. **Sí** puedes afirmar que Docker, Trivy y Gitleaks se ejecutaron localmente el 2026-10-30 con los resultados de este documento. **No** afirmes que el stack de producción o CI se hayan ejecutado.
6. **Sí** actualiza `docs/qa/` y este documento tras cada ronda de verificación.
7. **Sí** reinicia la API tras `seed` con PGlite.
8. **Sí** conserva la dirección “un motivo” y los tokens compartidos.

## 8. Criterio de cierre

La entrega se considera cerrada cuando:

- El commit de cierre está en `main` y CI pasa.
- El stack Docker local arranca y el smoke pasa — **cumplido el 2026-10-30**; falta el stack de producción.
- La configuración legal/contacto está completa o el sitio sigue marcado como demo.
- `docs/status/PENDING.md` refleja el hash y el estado real, sin promesas no verificadas.
