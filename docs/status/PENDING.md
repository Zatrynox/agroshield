# Estado y trabajo pendiente — AgroShield

Registro reanudable de la entrega `0.1.0`. Última actualización: **2026-10-29** (hora local del registro de QA).

> **Commit de referencia:** se completará al crear el commit inicial en `main`. Mientras no exista commit, el estado vive en el árbol de trabajo.

## 1. Dónde está el proyecto

```text
C:\Users\vcris\OneDrive\Escritorio\AgroShield
```

- Rama: `main` (sin commits al empezar; el commit inicial se crea al cerrar esta entrega).
- Workspace pnpm con `backend/`, `frontend/`, `landing/` y `packages/design-tokens/`.
- Node `24.15.0`, pnpm `11.1.2`.
- Docker **no disponible** en esta máquina (Docker Desktop requiere UAC).

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
| Docker / Trivy / Gitleaks | **No ejecutado** | Pendiente de CI |

## 3. Trabajo pendiente

### P0 — Bloquea el lanzamiento

- [ ] **Crear el commit inicial** en `main` y actualizar este documento con el hash.
- [ ] **Ejecutar CI completo** (`.github/workflows/ci.yml`): quality, infra, secrets, containers.
- [ ] **Verificar Docker en un host con Docker Desktop/Engine:**
  - `docker run --rm hello-world`
  - `docker compose -f compose.yaml config -q`
  - `docker compose -f compose.dev.yaml config -q`
  - `docker compose --env-file infra/env/prod.env -f compose.prod.yaml config -q`
  - builds de `agroshield-backend` y `agroshield-web`
  - Trivy HIGH/CRITICAL
  - Gitleaks working tree e historial
  - `docker compose -f compose.yaml up -d --build` + smoke + login demo
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
| Caddy no está instalado | Se usó un binario temporal | `CADDY_BIN=%TEMP%\opencode\caddy\caddy.exe` |
| `make`, `gitleaks`, `trivy` ausentes | Entorno Windows sin esas herramientas | Usar `pnpm stack:*`, `pnpm scan:*` o CI |
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

### 5.5 Docker (en un host con Docker)

```powershell
docker run --rm hello-world
docker compose --env-file .env -f compose.yaml up -d --build
# o: pnpm stack:up
```

Smoke manual: `http://localhost:8080/`, `/demo`, `/app/`, `/api/health`, `/documentation/json`, login demo.

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
5. **No** afirmes que Docker/Trivy/Gitleaks se ejecutaron localmente: no fue posible.
6. **Sí** actualiza `docs/qa/` y este documento tras cada ronda de verificación.
7. **Sí** reinicia la API tras `seed` con PGlite.
8. **Sí** conserva la dirección “un motivo” y los tokens compartidos.

## 8. Criterio de cierre

La entrega se considera cerrada cuando:

- El commit inicial está en `main` y CI pasa.
- El stack Docker arranca en un host con Docker y el smoke pasa.
- La configuración legal/contacto está completa o el sitio sigue marcado como demo.
- `docs/status/PENDING.md` refleja el hash y el estado real, sin promesas no verificadas.
