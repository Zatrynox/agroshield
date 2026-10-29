# Seguridad — AgroShield

Modelo de seguridad de la entrega `0.1.0`. Describe lo que está implementado, lo que se verificó y lo que debe completarse antes de operar con datos reales.

> **Alcance:** demo local y revisión. No es una auditoría independiente ni una garantía de cumplimiento. Antes de producción, completar el [checklist de lanzamiento](docs/launch-checklist.md) y revisar el apartado de hardening.

## Principios

1. **Fallo cerrado:** una configuración insegura impide arrancar en producción.
2. **Mínimo privilegio:** roles explícitos, consultas por organización, contenedores no-root y sin capacidades.
3. **Sin secretos versionados:** solo plantillas; CI bloquea `.env` reales y escanea con Gitleaks.
4. **Datos mínimos:** la analítica es propia y solo con consentimiento; los leads guardan hash de IP, no la IP.
5. **Mensajes honestos:** los errores no filtran trazas; la UI no simula éxito.

## Autenticación y sesión

| Control | Implementación |
| --- | --- |
| Hash de contraseña | Argon2id (`@node-rs/argon2`) |
| Longitud mínima | 12 caracteres |
| Bloqueo | 5 fallos consecutivos → 15 minutos |
| Sesión | Token opaco; se guarda SHA-256 en base de datos |
| Cookie | `agroshield_session`, `HttpOnly`, `SameSite=Lax`, `Secure` en producción, `Path=/` |
| CSRF | Cabecera `x-csrf-token` validada contra la sesión en mutaciones autenticadas |
| CORS | Lista explícita `CORS_ORIGINS`; credenciales permitidas solo para esos orígenes |
| Rate limit | Global 300/min por IP; login 10/5 min; registro 10/10 min; captcha 30/min; leads 5/hora; analítica 120/min |
| Logs | Redacción de `cookie`, `authorization`, `x-csrf-token`, `x-sensor-signature`, `set-cookie`, `password`, `passwordHash`, `csrfToken` |

- El token CSRF se devuelve en login/registro y se mantiene **solo en memoria** en el cliente. No se usa `localStorage`.
- `GET /v1/auth/me` restaura la sesión; `GET /v1/auth/session-status` solo devuelve `{ authenticated }` y se usa desde la landing.
- Logout revoca la sesión en servidor y borra la cookie.
- No hay verificación de correo, recuperación de contraseña, MFA ni refresh tokens.

### Riesgos aceptados

- El bloqueo por cuenta permite un ataque de denegación de servicio temporal contra un usuario conocido. Se mitiga con rate limit por IP y se documenta.
- SameSite=Lax + CSRF header cubre el flujo web; no hay protección para clientes que no puedan enviar cabeceras personalizadas.
- La sesión no rota el token en cada petición; la expiración es absoluta (`SESSION_TTL_HOURS`, 8 h por defecto).

## Autorización y aislamiento

- Roles: `owner`, `admin`, `agronomist`, `operator`, `viewer`.
- Escritura de fincas/zonas/sensores: `owner`, `admin`, `agronomist`.
- Reconocimiento de alertas: `owner`, `admin`, `agronomist`, `operator`.
- Toda consulta de datos se filtra por `organization_id` de la sesión; no se acepta un tenant por parámetro.
- La UI oculta acciones no permitidas, pero **la API es la autoridad** y vuelve a comprobar el rol.
- No hay gestión de miembros ni cambio de rol desde la UI.

## Sensores y lecturas

- Par de claves **Ed25519** por sensor. La privada se entrega una sola vez al inscribir o rotar; el servidor solo guarda la pública.
- Payload canónico versionado (`agroshield-readings-v1`), independiente del orden de propiedades JSON.
- Cabeceras `x-sensor-timestamp` y `x-sensor-signature`; ventana de reloj `SENSOR_MAX_SKEW_SECONDS` (300 s por defecto).
- Verificación de que el sensor pertenece a una zona de la organización y está activo.
- Deduplicación por `clientReadingId` o `Idempotency-Key`.
- Rotación revoca la clave anterior; borrado revoca el sensor.
- Las claves privadas de demo se generan en `backend/.data/demo-keys/` (ignorado por git) y nunca se versionan.

**Limitación:** no hay atestación de hardware, aprovisionamiento masivo, almacén HSM ni rotación automática. Una clave privada comprometida puede firmar hasta que se revoque.

## Entrada y salida

- Zod valida cuerpo, parámetros y query; los esquemas son estrictos donde corresponde.
- Límite de cuerpo: 64 KiB.
- Timeouts de petición (20 s) y conexión (10 s).
- Problem Details (`application/problem+json`) sin trazas internas.
- El HTML de la landing escapa por defecto; el JSON-LD se serializa con `JSON.stringify`.
- No se usa `v-html` con datos de usuario en el panel.
- Honeypot en el formulario de demo; captcha de prueba de trabajo de un solo uso.
- Sanitización de textos en dominio y límites de longitud en base de datos.

## Cabeceras y navegador

Caddy aplica en todas las respuestas, incluidos errores:

```text
Content-Security-Policy: default-src 'self'; base-uri 'self'; frame-ancestors 'none';
  form-action 'self'; img-src 'self' data:; font-src 'self';
  style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline';
  worker-src 'self' blob:; connect-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload   (solo producción)
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

- `script-src 'unsafe-inline'` es necesario por los scripts inline de Astro en esta entrega; es una deuda de hardening (nonces/hashes).
- El backend desactiva su propia CSP en `/docs` para que Swagger UI funcione; en producción la documentación está desactivada.
- La API añade `Referrer-Policy: no-referrer` y una CSP `default-src 'none'` a sus respuestas.

## Datos y privacidad

- **Leads:** nombre, empresa, correo, teléfono opcional, mensaje, consentimiento, hash SHA-256 de IP y user-agent truncado. No se guarda la IP en claro.
- **Analítica:** eventos first-party con consentimiento; rechazar no envía nada. La decisión se guarda en `localStorage`.
- **Sesiones:** token hasheado; el token en claro solo existe en la cookie del navegador.
- **Seed:** datos ficticios; la organización demo se elimina y recrea. No usar sobre datos reales.
- **Retención:** no hay purga automática de leads, eventos o sesiones expiradas. Debe definirse antes de producción.
- **Derechos:** las páginas legales explican el contacto, pero no hay automatización de acceso/supresión.

## Infraestructura

- Imágenes fijadas por digest; build multi-stage; usuarios no-root (UID 10001).
- `read_only: true`, `cap_drop: ALL`, `no-new-privileges:true`, `tmpfs` solo en `/tmp`.
- Postgres y backend en redes internas; solo el contenedor web publica puertos.
- Volúmenes nombrados; sin bind mounts de datos en producción.
- Healthchecks y dependencias ordenadas.
- Producción: TLS con ACME, HSTS, cookies seguras, CORS HTTPS, `TRUST_PROXY=true`, `DEMO_MODE=false`, docs desactivadas.
- El backend rechaza secretos de ejemplo, base no PostgreSQL y cookies inseguras en producción.
- Límites de CPU/memoria y logs rotados.

### Verificación

| Comprobación | Estado local | Dónde se verifica |
| --- | --- | --- |
| `docker run --rm hello-world` | **No ejecutado** (sin Docker) | CI `infra` y `containers` |
| Render de los tres Compose | Validado estáticamente | CI `infra` |
| Validación de Caddy local/prod | Validado con Caddy 2.11.7 | CI `infra` |
| Build de imágenes | **No ejecutado** | CI `containers` |
| Trivy HIGH/CRITICAL | **No ejecutado** | CI `containers` |
| Gitleaks working tree/historial | **No ejecutado** | CI `secrets` |
| Smoke del stack y login demo | **No ejecutado** | CI `containers` |

No se afirma que estas comprobaciones se hayan ejecutado en la máquina de desarrollo.

## Secretos

- `.env`, `.env.*` (excepto `.env.example`), `*.pem`, `*.key`, `infra/env/prod.env` e `infra/certs/` están ignorados.
- `SESSION_SECRET` debe tener 32+ caracteres aleatorios; producción rechaza placeholders.
- `PROD_POSTGRES_PASSWORD` y `PROD_DATABASE_URL` se generan con `openssl rand` y se guardan con permisos `600`.
- Las claves de sensor de demo se generan localmente y están ignoradas.
- No hay secretos en imágenes: llegan por entorno en runtime.
- Rotación: si un secreto se filtra, rota `SESSION_SECRET` (invalida sesiones), la contraseña de base y las claves de sensor afectadas.

## Hardening pendiente antes de producción

1. Ejecutar y aprobar CI completo (Docker, Trivy, Gitleaks, smoke).
2. Sustituir `script-src 'unsafe-inline'` por nonces/hashes.
3. Añadir verificación de correo, recuperación de contraseña y MFA.
4. Definir retención y purga de leads, analítica y sesiones.
5. Añadir backups cifrados y probar restauración.
6. Centralizar logs/métricas/alertas y auditoría exportable.
7. Fijar GitHub Actions por SHA y añadir firma/procedencia de imágenes.
8. Revisar legalmente privacidad, términos, cookies y encargados de tratamiento.
9. Considerar WAF/rate limit en el borde y protección DDoS.
10. Revisar CSP y cabeceras con un escáner externo.
11. Añadir gestión de miembros y auditoría de cambios de rol.
12. Documentar el procedimiento de respuesta a incidentes y contacto de seguridad.

## Reporte de vulnerabilidades

No hay un canal público de seguridad verificado en esta entrega. Antes de publicar, configura un buzón monitorizado (por ejemplo `security@<dominio>`) y publícalo en `SECURITY.md` y en la landing. Mientras tanto, no abras issues públicos con detalles explotables.

Al reportar, incluye: versión/commit, ruta o componente, pasos de reproducción, impacto y cualquier prueba de concepto. No incluyas datos personales de terceros ni secretos reales.

## Referencias internas

- [`DECISIONS.md`](DECISIONS.md) — decisiones de seguridad y arquitectura.
- [`docs/launch-checklist.md`](docs/launch-checklist.md) — bloqueos de lanzamiento.
- [`infra/README.md`](infra/README.md) — configuración de contenedores.
- [`backend/README.md`](backend/README.md) — autenticación, CSRF y lecturas firmadas.
- [`docs/qa/qa-report.md`](docs/qa/qa-report.md) — evidencia de pruebas.
