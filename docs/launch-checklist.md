# Checklist de lanzamiento — AgroShield

Lista de comprobaciones para pasar de la demo `0.1.0` a un entorno real. Las casillas marcadas se verificaron en la máquina de desarrollo; las pendientes bloquean o condicionan el lanzamiento.

> **Regla:** no se considera “hecho” nada que solo esté escrito. Docker, Trivy, Gitleaks y el stack de producción **no se ejecutaron localmente**; su verificación depende de CI y de un host con Docker.

## 1. Alcance y producto

- [x] Núcleo implementado: `iam`, `organizations`, `farms`, `sensors`, `alerts`, `soil-health`, `forecast`, `predictions`.
- [x] Soporte público: `leads`, `analytics`.
- [ ] `learning`, `community`, `billing` — **fuera de alcance**; no se presentan como funcionales.
- [x] La landing no promete comunidad, aprendizaje ni cobro.
- [x] Datos demo etiquetados; sin testimonios, logos, métricas ni clientes inventados.
- [ ] Decidir si se añaden esos contextos antes o después del primer cliente real.
- [x] Sin vídeo de producto; decisión documentada.
- [x] Un CTA principal (“Solicitar una demo”) y acceso discreto al panel.

## 2. Identidad legal y contenidos

- [ ] `PUBLIC_LEGAL_ENTITY` con razón social real.
- [ ] `PUBLIC_LEGAL_ADDRESS` con dirección postal real.
- [ ] `PUBLIC_SUPPORT_EMAIL` con buzón monitorizado.
- [ ] `PUBLIC_WHATSAPP_NUMBER` real o dejar vacío para ocultarlo.
- [ ] Revisar `privacidad`, `terminos` y `cookies` con asesoría legal.
- [ ] Definir base jurídica, plazos de conservación y encargados de tratamiento.
- [ ] Publicar canal de seguridad (`security@…`) y política de divulgación.
- [ ] Revisar créditos de fotografía y tipografía; conservar licencias.
- [ ] Verificar que no quedan placeholders `example.com`, `agroshield.example` ni `600000000` visibles.
- [ ] Revisar el aviso de “entorno de demostración” si el sitio deja de ser demo.

## 3. Configuración y secretos

- [ ] Crear `infra/env/prod.env` desde `infra/env/prod.env.example` con permisos `600`.
- [ ] `PROD_SITE_DOMAIN` apuntando al dominio real (sin esquema).
- [ ] `PROD_ACME_EMAIL` con buzón monitorizado.
- [ ] `PROD_POSTGRES_PASSWORD` aleatoria y URL-encoded si hace falta.
- [ ] `PROD_DATABASE_URL` coherente con usuario, contraseña y base.
- [ ] `PROD_SESSION_SECRET` de 32+ caracteres aleatorios; no reutilizar el de ejemplo.
- [ ] `COOKIE_SECURE=true`, `TRUST_PROXY=true`, `DEMO_MODE=false`, `ENABLE_API_DOCS=false`.
- [ ] `CORS_ORIGINS` solo HTTPS y solo el dominio real.
- [ ] Confirmar que `.env`, `infra/env/prod.env`, `*.pem`, `*.key` e `infra/certs/` no están versionados.
- [ ] Ejecutar Gitleaks sobre working tree e historial.
- [ ] Rotar cualquier secreto que haya estado expuesto.

## 4. Calidad y pruebas

- [x] `pnpm typecheck` — todos los paquetes.
- [x] `pnpm test` — 77 pruebas (41 backend, 13 frontend, 23 landing).
- [x] `pnpm build` — backend, frontend y landing.
- [x] `pnpm verify:infra` — validación estática.
- [x] `pnpm verify:links` — 73/73.
- [x] Smoke de API en vivo — 23/23.
- [x] UI QA — 39/39; axe 0 violaciones en 6 pantallas.
- [x] Lighthouse móvil home 97/100/100/100; demo 99/100/100/100; escritorio 100/100/100/100.
- [ ] Repetir typecheck, tests, build, enlaces y smoke sobre el commit final.
- [ ] Ejecutar UI QA sobre el build de producción servido por Caddy, no solo sobre dev.
- [ ] Añadir pruebas E2E al pipeline de CI (hoy el QA de navegador es local).
- [ ] Revisar cobertura de reglas de dominio y casos límite de cuenta atrás.

## 5. Seguridad

- [x] Argon2id, bloqueo tras 5 fallos, rate limits.
- [x] Cookie HttpOnly/SameSite/Secure en producción.
- [x] CSRF por cabecera en mutaciones autenticadas.
- [x] RBAC y filtrado por organización.
- [x] Claves Ed25519, rotación, revocación, deduplicación y ventana de reloj.
- [x] Problem Details sin trazas; logs con redacción.
- [x] CORS explícito, Helmet, CSP en Caddy y API.
- [x] Honeypot + captcha de prueba de trabajo de un solo uso.
- [x] Analítica solo con consentimiento; sin cookies de terceros.
- [ ] Sustituir `script-src 'unsafe-inline'` por nonces/hashes.
- [ ] Añadir verificación de correo, recuperación de contraseña y MFA.
- [ ] Definir retención y purga de leads, eventos y sesiones.
- [ ] Añadir auditoría exportable de cambios sensibles.
- [ ] Revisar CSP y cabeceras con un escáner externo.
- [ ] Considerar WAF/rate limit en el borde.
- [ ] Documentar respuesta a incidentes y contactos.

## 6. Infraestructura

- [ ] `docker run --rm hello-world` en el host de despliegue.
- [ ] `docker compose -f compose.yaml config -q`.
- [ ] `docker compose -f compose.dev.yaml config -q`.
- [ ] `docker compose --env-file infra/env/prod.env -f compose.prod.yaml config -q`.
- [ ] Validar ambos Caddyfiles con Caddy 2.11.7.
- [ ] Construir `agroshield-backend` y `agroshield-web`.
- [ ] Escanear ambas imágenes con Trivy (HIGH/CRITICAL corregibles).
- [ ] Levantar el stack local y probar landing, demo, 404, app, deep link, API, 401, OpenAPI y login demo.
- [ ] Levantar el stack de producción con TLS real y probar HSTS, cookies `Secure`, CORS y redirecciones.
- [ ] Verificar que Postgres y backend no están publicados.
- [ ] Verificar healthchecks, reinicio y logs rotados.
- [ ] Configurar backups cifrados de Postgres y probar restauración.
- [ ] Configurar monitorización, alertas y retención de logs.
- [ ] Verificar límites de CPU/memoria bajo carga.
- [ ] Fijar GitHub Actions por SHA y añadir firma/procedencia de imágenes.

> **Estado local:** Docker Desktop no pudo instalarse sin UAC. Las casillas de esta sección están **pendientes**; los archivos se validaron estáticamente y Caddy 2.11.7 validó los Caddyfiles. CI cubre hello-world, builds, Trivy, Gitleaks y smoke.

## 7. Datos y operación

- [ ] Confirmar que el seed **no** se ejecutará en producción (no existe en `compose.prod.yaml`).
- [ ] Limpiar leads `[E2E]` y `Finca QA` de la base local antes de compartirla.
- [ ] Definir proceso de alta de organización, miembros y roles.
- [ ] Definir proceso de aprovisionamiento y revocación de sensores.
- [ ] Definir proceso de importación de datos reales (no incluido).
- [ ] Definir retención de lecturas y agregados.
- [ ] Documentar runbook: arranque, migración, rollback lógico, incidentes.
- [ ] Verificar zona horaria y formato de fechas en el entorno real.

## 8. Landing y SEO

- [x] Título, descripción, canonical, robots, Open Graph, Twitter Card y JSON-LD.
- [x] Sitemap y `robots.txt` generados.
- [x] Favicons, manifest y OG image.
- [x] 404 real y página de gracias `noindex`.
- [x] Enlaces y anclas comprobados.
- [x] Consentimiento antes/después y rechazo persistente.
- [x] Formulario con validación, honeypot, captcha y persistencia real.
- [x] `/gracias` solo con recibo de un `201`.
- [ ] Verificar el sitio en el dominio real (canonical, sitemap, OG).
- [ ] Enviar sitemap a los buscadores.
- [ ] Revisar textos legales y de contacto en el dominio real.
- [ ] Verificar analítica con consentimiento en producción.
- [ ] Revisar Lighthouse sobre el dominio real y con red móvil.

## 9. Accesibilidad y navegador

- [x] axe sin violaciones en landing home, demo, login, dashboard, zona y alertas.
- [x] Sin overflow horizontal a 320 px en las pantallas auditadas.
- [x] Foco visible, teclado, diálogos y `aria-live`.
- [x] `prefers-reduced-motion`.
- [ ] Probar con lector de pantalla real (NVDA/VoiceOver).
- [ ] Probar en Safari iOS y Firefox.
- [ ] Revisar contraste con herramientas externas.
- [ ] Verificar formularios con autocompletado y zoom 200 %.

## 10. Criterios de salida

El lanzamiento puede considerarse listo cuando:

1. Las secciones 2, 3, 5 y 6 están completas y verificadas.
2. CI pasa en `main` con los cuatro jobs.
3. Existe un dominio con TLS válido, backups y monitorización.
4. Legal ha revisado privacidad, términos, cookies y tratamiento de datos.
5. Se ha ejecutado el smoke de producción y el login demo (o una cuenta real) funciona.
6. No hay secretos, datos de prueba ni placeholders en el entorno publicado.
7. El equipo acepta por escrito los límites de `learning`, `community` y `billing`.

## 11. Registro de verificación

| Fecha | Entorno | Resultado | Notas |
| --- | --- | --- | --- |
| 2026-10-29 | Host local (Windows, Node 24.15.0) | Typecheck, 77 tests, build, 73 enlaces, 23 API, 39 UI, axe 0, Lighthouse OK | Docker/Trivy/Gitleaks no disponibles |
| pendiente | CI | — | Ejecutar workflow completo |
| pendiente | Producción | — | Requiere dominio, secretos y legal |

Actualiza esta tabla al repetir las comprobaciones; no borres las filas anteriores.
