# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

pnpm workspace monorepo. API: Node.js + TypeScript estricto, Fastify, PostgreSQL, Zod, buses CQRS propios. Aplicación: Vue 3 + Vite + Pinia + Vue Router. Sitio público: Astro estático. Tokens compartidos en `packages/design-tokens`. La decisión de stack fue delegada en el encargo original; se eligió por separación de superficies, tipado extremo a extremo y despliegue estático del sitio público.

## Users

Productores agrícolas pequeños y medianos, responsables de finca y agrónomos que supervisan varias parcelas y no pueden estar todo el día en el campo. [Inferido del encargo: el rol operativo de campo usa el móvil con guantes, a pleno sol y con conectividad intermitente; el rol de gestión usa escritorio para revisar riesgo, priorizar intervenciones y justificar decisiones.]

Trabajo principal: saber qué zona está en riesgo, cuánto tiempo queda antes de una pérdida y qué hacer ahora, sin interpretar una tabla de sensores en bruto.

## Product Purpose

AgroShield convierte lecturas de suelo firmadas por sensores en alertas con cuenta atrás y recomendaciones operativas. Su propósito es que una explotación detecte una pérdida de viabilidad (calor, plaga en crecimiento exponencial, agotamiento de nutrientes) antes de que sea irreversible, y que cada decisión quede registrada.

El éxito significa: menos alarmas sin contexto, una intervención a tiempo y un historial que permita aprender de la temporada.

## Positioning

La señal no se compra: se firma en el dispositivo. AgroShield combina lecturas verificables con reglas agronómicas explicables, una fecha límite visible y el estado del suelo en una sola unidad de trabajo. Un panel genérico de IoT puede mostrar series; no puede demostrar que la lectura es auténtica ni convertirla en una cuenta atrás accionable con aislamiento por organización.

## Operating Context

- Trabajo en campo con móvil, luz directa, guantes y red irregular; las acciones críticas deben caber en una mano y sobrevivir a un reintento.
- Trabajo de gestión en escritorio: varias fincas, zonas, sensores y alertas abiertas.
- Vocabulario del sector en español: finca, zona, cultivo, lote, plaga, nutrientes, vida útil del suelo, cuenta atrás.
- Los sensores se instalan físicamente; la clave privada se entrega una sola vez y el dispositivo firma cada lectura con Ed25519.
- El sitio público explica el producto y capta solicitudes de demo. La aplicación real es la única fuente de datos; no hay pruebas sociales ni métricas inventadas.
- Modo demo local explícito, separado de producción y sin datos de clientes.

## Capabilities and Constraints

Confirmado en el encargo y en la API existente:

- Registro e inicio de sesión con contraseña Argon2id, cookie HttpOnly, CSRF y sesión por organización.
- Fincas y zonas con cultivo y superficie; aislamiento por organización y roles `owner`, `admin`, `agronomist`, `operator`, `viewer`.
- Alta de sensores con clave privada mostrada una vez, rotación y revocación.
- Ingesta de lecturas firmadas, idempotente, con ventana temporal y deduplicación.
- Alertas de temperatura, plaga y nutrientes con severidad, contexto y fecha límite; reconocimiento persistente.
- Salud del suelo con puntuación, factor limitante, días restantes y recomendación.
- Pronóstico de tendencia marcado como demo y predicción de riesgo por zona, también demo.
- Solicitudes de demo con honeypot, captcha de prueba de trabajo de un solo uso y consentimiento.
- Analítica propia condicionada al consentimiento, sin cookies de terceros.
- Contextos previstos pero no completados en esta entrega: comunidad anonimizada, aprendizaje y facturación. No se presentan como funcionales en la interfaz.

Restricciones técnicas:

- TypeScript estricto, PostgreSQL con migraciones versionadas, Problem Details, `/v1` y OpenAPI.
- Sin secretos en el repositorio; configuración solo por entorno. CORS y cabeceras estrictas.
- Cualquier cifra, testimonio o cliente del sitio público debe existir; hoy no existe ninguno.
- Localización española preparada para i18n; no se afirma soporte multiidioma.
- El despliegue local documentado usa HTTP en `.localhost`; producción exige HTTPS y HSTS.

Decisiones abiertas:

- Precio, planes comerciales y pasarela de pago.
- Fuentes de imágenes definitivas y sus créditos (en curso).
- Cobertura y modelo de comunidad/benchmarking anonimizado.

## Brand Commitments

Nombre AgroShield. Voz sobria, técnica y directa; español de España. Sin promesas de rendimiento no medidas, sin urgencia artificial, sin lenguaje publicitario vacío. El producto se presenta como instrumento de trabajo, no como juguete.

[Inferido] La marca debe transmitir tierra, datos y confianza; no lujo corporativo ni estética de startup genérica.

## Evidence on Hand

- Backend funcional con 41 pruebas de integración y dominio; contrato OpenAPI en `/documentation/json` en desarrollo.
- Seed local reproducible (`DEMO_MODE=true`) y simulador de sensores firmados.
- Seis fotografías locales en `landing/src/assets/photos/` con licencia y crédito verificables en `/creditos` y `credits.json`; no se presentan como clientes ni como capturas del producto.
- No hay clientes, testimonios, casos de éxito, certificaciones, premios ni métricas de resultado. Está prohibido fabricarlos.
- El correo y el teléfono de `.env.example` son marcadores de posición; no son canales reales de producción.

## Product Principles

1. La señal debe ser verificable antes de ser convincente.
2. Toda alerta debe responder a tres preguntas: qué pasa, cuánto queda y qué hago.
3. La interfaz desaparece en la tarea; la familiaridad operativa vale más que la sorpresa visual.
4. Ninguna acción crítica puede fingir éxito: optimistic UI solo cuando el fallo es recuperable y visible.
5. La demo y la producción se declaran; nunca se mezclan datos ni se ocultan límites.

## Accessibility & Inclusion

Objetivo WCAG 2.2 AA en aplicación y sitio público: contraste 4.5:1 en texto, foco visible, navegación por teclado, objetivos táctiles de al menos 44 px, estado nunca comunicado solo por color, movimiento reducido respetado y textos legibles a 320 px. El uso en campo exige tipografía grande y controles tolerantes a errores de toque.
