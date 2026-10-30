# Decisiones — AgroShield

Registro de las decisiones que sostienen la entrega `0.1.0`. Cada entrada indica contexto, decisión y consecuencia. No es un historial exhaustivo: recoge las bifurcaciones que afectan al mantenimiento o al lanzamiento.

## Producto y alcance

### D1. Entrega demo verificable, no producción

**Contexto:** el encargo pide una plataforma completa con infraestructura, pero no hay dominio, identidad legal ni credenciales reales. Docker Desktop sí se pudo arrancar durante la entrega.

**Decisión:** entregar una demo funcional y honesta, con datos sembrados explícitamente etiquetados, límites documentados y un checklist de lanzamiento. No se inventan clientes, métricas, testimonios ni resultados agronómicos.

**Consecuencia:** el stack local, las imágenes, Trivy y Gitleaks se verificaron en la máquina; lo que sigue sin verificar (TLS real, producción, CI) queda declarado como pendiente, no como hecho.

### D2. Contextos implementados y contextos ausentes

**Decisión:** implementar `iam`, `organizations`, `farms`, `sensors`, `alerts`, `soil-health`, `forecast`, `predictions`, `leads` y `analytics`. Dejar `learning`, `community` y `billing` fuera y no presentarlos como funcionales.

**Motivo:** era preferible un núcleo coherente y probado a tres contextos vacíos que aparentaran funcionalidad. La landing y el panel no prometen comunidad anonimizada, aprendizaje ni cobro.

**Consecuencia:** el README y el checklist lo declaran; añadirlos requiere migraciones, rutas y UI propias.

### D3. Un solo CTA en la landing

**Decisión:** el CTA principal es **Solicitar una demo** → `/demo`. El acceso al panel es un enlace discreto; WhatsApp es un canal auxiliar y solo aparece con un número real.

**Motivo:** la landing debe tener una acción medible. WhatsApp competía con el formulario y no dejaba rastro persistente.

**Consecuencia:** la tensión entre “una sola acción” y “varios canales” se resuelve dando prioridad visual al formulario; WhatsApp queda subordinado y oculto si no hay número configurado.

### D4. Sin vídeo de producto

**Decisión:** no incluir vídeo. No había material real, `ffmpeg`/ImageMagick no estaban disponibles y generar un montaje habría sido material ficticio.

**Consecuencia:** la landing usa seis fotografías reales con licencia y crédito. Si aparece un vídeo honesto, se añadirá como bucle silencioso con póster y respetando `prefers-reduced-motion`.

## Arquitectura

### D5. Monorepo pnpm con paquetes por superficie

**Decisión:** un workspace pnpm con `backend/`, `frontend/`, `landing/` y `packages/design-tokens/`. Los tokens se consumen como dependencia `workspace:*`.

**Motivo:** una sola instalación, un lockfile y tipos/estilos compartidos sin publicar paquetes.

**Consecuencia:** los Dockerfiles copian todos los manifests para que el lockfile resuelva; el filtrado de pnpm limita la instalación a lo necesario por imagen.

### D6. Backend DDD + CQRS con buses en memoria

**Decisión:** cada contexto separa `domain`, `application`, `infrastructure` e `interfaces/http`. Los comandos, consultas y eventos pasan por buses propios en memoria.

**Motivo:** aislar reglas de negocio, permitir pruebas de dominio sin HTTP y dejar una costura clara para Redis/NATS.

**Consecuencia:** no hay eventos distribuidos ni garantías de entrega. Sustituir los buses no requiere cambiar handlers, pero sí añadir infraestructura de mensajería y idempotencia.

### D7. PostgreSQL con SQL versionado; PGlite para pruebas

**Decisión:** migraciones SQL en `backend/migrations/`, aplicadas por un runner propio con `schema_migrations`. Producción usa `pg` y PostgreSQL 17; pruebas y desarrollo local usan PGlite con semántica PostgreSQL.

**Motivo:** evitar un ORM que ocultara el esquema y mantener pruebas rápidas sin un servicio externo.

**Consecuencia:** PGlite es monoproceso; tras `seed` hay que reiniciar la API local. Producción rechaza cualquier URL que no sea PostgreSQL. No hay rollback automático: las migraciones son forward-only.

### D8. Fastify + Zod + OpenAPI

**Decisión:** Fastify 5 con `fastify-type-provider-zod`, esquemas Zod en rutas y `@fastify/swagger` con `transform: jsonSchemaTransform`.

**Motivo:** validación y contrato desde la misma definición; OpenAPI verificable en pruebas.

**Consecuencia:** sin `jsonSchemaTransform`, los esquemas Zod rompen la generación OpenAPI. La documentación se desactiva en producción.

### D9. Problem Details e idempotencia

**Decisión:** errores HTTP con `application/problem+json` (`type`, `title`, `status`, `detail`, `instance`), sin trazas internas. Las lecturas de sensor aceptan `Idempotency-Key` y `clientReadingId`; los leads tienen rate limit.

**Motivo:** un contrato de error estable facilita el cliente y evita filtrar detalles.

**Consecuencia:** el cliente Vue interpreta `detail`; las mutaciones críticas deben seguir siendo idempotentes por diseño, no solo por cabecera.

## Seguridad

### D10. Sesión opaca con cookie HttpOnly y CSRF por sincronización

**Decisión:** cookie `agroshield_session` HttpOnly, SameSite=Lax, Secure en producción, `Path=/`. El token de sesión se guarda hasheado (SHA-256) en base de datos. Las mutaciones requieren `x-csrf-token`, emitido en login/registro y validado contra la sesión.

**Motivo:** no exponer tokens a JavaScript y bloquear CSRF sin duplicar cookies.

**Consecuencia:** el cliente guarda el CSRF solo en memoria; recargar exige `GET /v1/auth/me`. No hay refresh tokens ni sesiones en múltiples dispositivos gestionadas desde la UI.

### D11. Argon2id y bloqueo de cuenta

**Decisión:** Argon2id para contraseñas; cinco fallos consecutivos bloquean la cuenta 15 minutos; rate limit adicional por ruta.

**Consecuencia:** el bloqueo es por cuenta, no por IP; un atacante puede provocar bloqueos temporales. Se acepta por simplicidad y se documenta.

### D12. Claves de sensor Ed25519

**Decisión:** al inscribir un sensor se genera un par Ed25519. La clave privada se devuelve una sola vez; el servidor guarda la pública. Las lecturas se firman sobre un payload canónico con timestamp; se admite rotación y revocación.

**Motivo:** autenticar dispositivos sin compartir secretos de usuario y permitir revocación.

**Consecuencia:** la ventana de reloj es 300 s por defecto; la deduplicación evita reenvíos. No hay aprovisionamiento masivo ni rotación automática.

### D13. Captcha propio de prueba de trabajo

**Decisión:** `GET /v1/captcha` emite un reto HMAC; el navegador calcula `SHA-256(challenge + ":" + solution)` con un prefijo de ceros (dificultad 4). El backend guarda el uso y lo invalida.

**Motivo:** evitar dependencias externas y costes, y no enviar datos a terceros.

**Consecuencia:** no es un captcha visual; frena automatización básica, no ataques dirigidos. El worker se sirve same-origin y la CSP permite `worker-src blob:`.

### D14. Producción falla cerrada

**Decisión:** `src/config/env.ts` rechaza en producción `DEMO_MODE=true`, cookies inseguras, secretos de ejemplo, base no PostgreSQL, CORS HTTP, `TRUST_PROXY=false` y documentación activa.

**Motivo:** un despliegue mal configurado debe detenerse, no arrancar en modo inseguro.

**Consecuencia:** el operador debe completar `infra/env/prod.env`; Compose también exige las variables obligatorias.

### D15. Sin secretos versionados

**Decisión:** `.env` e `infra/env/prod.env` están ignorados; solo se versionan `.env.example`. CI comprueba que no haya `.env` reales y ejecuta Gitleaks sobre working tree e historial. Trivy escanea imágenes.

**Consecuencia:** las credenciales locales del seed son ficticias y están en `.env.example`. Nunca deben reutilizarse.

## Frontend y diseño

### D16. Dirección “un motivo”: testigo de suelo

**Decisión:** adoptar la dirección Taste `one-motif` con semilla `1290151057`: el testigo estratificado de suelo como escenario, máscara, viñeta y marca. Tipografía Switzer; paleta hueso/tinta/campo/arcilla/ocre/teal; movimiento de cortina.

**Motivo:** el producto trata sobre lo que ocurre bajo tierra; el motivo es específico, no genérico, y organiza la página sin decoración arbitraria.

**Consecuencia:** la evidencia está en `docs/design/`. Cambiar el motivo implica revisar landing, panel y tokens.

### D17. Panel denso y predecible; landing expresiva

**Decisión:** el panel usa rail verde, tablas, formularios y estados estándar, con escala rem fija y sin animación decorativa. La landing concentra la expresividad.

**Motivo:** el panel se usa con prisa, guantes y mala luz; la landing debe explicar y convencer.

**Consecuencia:** los tokens son compartidos, pero los patrones de composición difieren a propósito.

### D18. Subpath `/app` para el panel

**Decisión:** Vite compila con `VITE_PUBLIC_BASE=/app/` y `createWebHistory(import.meta.env.BASE_URL)`. Caddy redirige `/app` a `/app/` y sirve `index.html` para deep links.

**Motivo:** un solo origen y un solo certificado; la landing ocupa la raíz.

**Consecuencia:** los enlaces del panel deben usar el router, no rutas absolutas sin base. Caddy conserva la query en la redirección exacta.

### D19. Proxy same-origin en desarrollo

**Decisión:** tanto Vite como Astro proxyan `/api` al backend y eliminan el prefijo. El cliente usa `/api/v1`.

**Motivo:** evitar CORS y mantener cookies/CSRF same-origin también en local.

**Consecuencia:** el backend ve el `Host` del proxy; `TRUST_PROXY` se ajusta por entorno.

### D20. i18n preparada, solo español

**Decisión:** todos los textos del panel pasan por `t()` con claves planas y un catálogo `es`. La landing está en español.

**Motivo:** evitar una migración costosa si se añade otro idioma, sin pagar el coste de traducir ahora.

**Consecuencia:** no hay selector de idioma ni rutas localizadas; añadir otro catálogo requiere revisar plurales y fechas.

## Landing, datos y legal

### D21. Analítica propia y consent-gated

**Decisión:** eventos first-party a `POST /v1/analytics/events`, solo tras aceptar. Rechazar guarda la decisión en `localStorage` y no envía nada. Nunca se envía `consent:false`.

**Motivo:** minimizar datos y evitar cookies de terceros.

**Consecuencia:** no hay atribución multicanal ni panel de métricas. La decisión se puede cambiar desde el banner y `/cookies`.

### D22. `/gracias` solo con recibo real

**Decisión:** el formulario guarda un recibo en `sessionStorage` únicamente tras un `201`; `/gracias` valida forma, caducidad y referencia. Sin recibo muestra un estado vacío.

**Motivo:** no simular éxito ni permitir confirmaciones por URL.

**Consecuencia:** recargar en otra pestaña sin el recibo no muestra confirmación; es el comportamiento deseado.

### D23. Identidad legal por entorno

**Decisión:** `PUBLIC_LEGAL_ENTITY`, `PUBLIC_LEGAL_ADDRESS`, `PUBLIC_SUPPORT_EMAIL` y `PUBLIC_WHATSAPP_NUMBER` se configuran por entorno. Los placeholders se ocultan.

**Motivo:** no inventar una sociedad, dirección o teléfono.

**Consecuencia:** las páginas legales son plantillas honestas y deben revisarse antes de publicar. El checklist lo bloquea.

### D24. Fotografías reales con licencia

**Decisión:** usar seis fotografías de Wikimedia Commons, con autor, licencia y enlace en `/creditos` y `credits.json`. No se presentan como clientes ni como capturas del producto.

**Consecuencia:** si se sustituyen, hay que actualizar créditos y el JSON; las imágenes se optimizan en build.

## Pruebas e infraestructura

### D25. Pirámide de pruebas y QA de navegador

**Decisión:** 41 pruebas de backend (dominio, integración PGlite, contrato OpenAPI), 13 de frontend y 23 de landing; además 39 comprobaciones de UI con Playwright/axe, 23 de API en vivo y 73 de enlaces.

**Motivo:** cubrir reglas, contrato, persistencia y los flujos que solo se ven en navegador.

**Consecuencia:** el QA de UI requiere seed, tres servidores y Chrome; no corre en CI de calidad. Los smoke de API y UI son locales; CI cubre build, tests, infra y el stack Docker.

### D26. Docker local verificado; producción y CI pendientes

**Contexto:** Docker Desktop se pudo arrancar, pero el puerto `8080` del host está ocupado por `httpd.exe` y no hay dominio, TLS ni secretos de producción.

**Decisión:** verificar el stack local completo (hello-world, Compose, builds, Trivy, Gitleaks y smoke) publicando el puerto `8088` con un override temporal no versionado. Mantener `8080` como puerto por defecto en `compose.yaml`. No ejecutar el stack de producción.

**Consecuencia:** el stack local y las imágenes están verificados; el `8088` es una particularidad del host, no del repositorio. El stack de producción y CI siguen siendo la fuente de verdad pendiente para el lanzamiento.

### D27. Imágenes fijadas por digest y CI con acciones por tag

**Decisión:** fijar imágenes base y de escaneo por digest. Las GitHub Actions usan tags de versión (`@v4`), no SHA.

**Motivo:** reproducibilidad de imágenes; simplicidad de mantenimiento en CI.

**Consecuencia:** actualizar una imagen exige cambiar el digest. Como hardening futuro, fijar también las acciones por SHA.

### D28. Sin scheduler ni colas

**Decisión:** las alertas se generan al ingerir lecturas; el simulador produce tráfico demo. No hay cron, cola ni WebSocket.

**Motivo:** mantener la entrega autocontenida y comprensible.

**Consecuencia:** sin lecturas no se reevalúan alertas; la UI refresca por petición. Añadir trabajos programados requiere un scheduler y garantías de idempotencia.

### D29. Seed destructivo y explícito

**Decisión:** `seed` exige `DEMO_MODE=true`, `NODE_ENV!=production` y contraseña de 12+ caracteres; elimina y recrea la organización `agroshield-demo`.

**Motivo:** una demo reproducible sin pasos manuales.

**Consecuencia:** nunca debe ejecutarse sobre datos reales. En el stack local es un servicio one-shot; en producción no existe.

### D30. Sin datos de producción en el repositorio

**Decisión:** no hay dumps, claves privadas reales, correos de clientes ni métricas internas. Las claves de demo se generan en `.data/` y están ignoradas.

**Consecuencia:** cualquier dato real debe llegar por un proceso de importación que no forma parte de esta entrega.

### D31. Caddy recompilado para eliminar CVEs HIGH

**Contexto:** el binario de `caddy:2.11.7-alpine` usa Go `1.26.8` y arrastra CVEs HIGH de la stdlib, `x/net` y `go-jose`. Además, el binario upstream tiene una file capability que falla con `cap_drop: ALL`.

**Decisión:** compilar Caddy `2.11.7` como dependencia de módulo con Go `1.27.3`, parchear `go-jose` a `4.1.6` y `x/net` a `0.60.0`, y copiar el binario estático resultante a la imagen runtime. El entrypoint replica `cmd/caddy/main.go` para registrar los módulos estándar.

**Consecuencia:** Trivy no encuentra vulnerabilidades HIGH/CRITICAL corregibles en la imagen web y Caddy arranca como no-root con `cap_drop: ALL`. Actualizar Caddy exige revisar el `go.mod` generado y repetir el escaneo.

### D32. Gitleaks escanea una instantánea, no el árbol con datos locales

**Contexto:** `gitleaks detect --no-git` leía `backend/.data/demo-keys/sensors.json`, un archivo ignorado por git que contiene claves de demo generadas por el seed, y lo reportaba como falso positivo.

**Decisión:** copiar a un directorio temporal los archivos rastreados y los no ignorados (`git ls-files --cached --others --exclude-standard`) y escanear esa instantánea; además, escanear el historial completo por separado.

**Consecuencia:** el escaneo cubre lo que realmente se commitearía sin leer secretos locales ignorados. El volumen de caché de Trivy (`agroshield-trivy-cache`) evita descargar la base de vulnerabilidades en cada ejecución.
