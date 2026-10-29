# Landing — sitio público AgroShield

Sitio estático en Astro que presenta el producto, explica el flujo de alertas y recoge solicitudes de demo. Se despliega en la raíz del dominio; el panel vive en `/app` y la API en `/api`.

## Stack

- Astro 7 en `output: 'static'`.
- `@astrojs/sitemap` para `sitemap-index.xml`.
- Sharp para generar favicons, iconos y la imagen Open Graph.
- `@agroshield/design-tokens` compartido con el panel.
- TypeScript estricto y Vitest para las utilidades del navegador.

## Arranque

Desde la raíz:

```bash
cp landing/.env.example landing/.env
pnpm install --frozen-lockfile
pnpm dev:api
pnpm dev:landing
```

El sitio queda en `http://localhost:4321`. El proxy de Astro reescribe `/api/*` hacia `http://localhost:3000/*` para que el formulario y la analítica sean same-origin.

```bash
pnpm --filter @agroshield/landing typecheck
pnpm --filter @agroshield/landing test
pnpm --filter @agroshield/landing build
pnpm --filter @agroshield/landing preview
```

## Rutas

| Ruta | Contenido |
| --- | --- |
| `/` | Landing: hero, cómo funciona, capacidades, showcase, sobre el producto, FAQ y contacto |
| `/demo` | Formulario de solicitud con validación, honeypot y captcha |
| `/gracias` | Confirmación; solo muestra el recibo guardado tras un `201` real |
| `/privacidad` | Política de privacidad |
| `/terminos` | Términos de uso |
| `/cookies` | Cookies y consentimiento de analítica |
| `/creditos` | Autoría y licencias de fotos y tipografía |
| `/404` | Página de error; Caddy la sirve también para assets ausentes del panel |
| `/robots.txt` | Generado desde `robots.txt.ts` |
| `/sitemap-index.xml` | Generado por la integración de sitemap |

`/gracias` y `/404` quedan fuera del sitemap y llevan `noindex`.

## Composición y dirección visual

La dirección canónica está en [`../docs/design/direccion-taste.md`](../docs/design/direccion-taste.md): un único motivo, el **testigo de suelo estratificado**, que actúa como escenario del hero, máscara de fotografía, viñeta, medidor y marca del pie.

- Tipografía Switzer, servida localmente desde `packages/design-tokens` (sin peticiones a Fontshare en runtime).
- Paleta: hueso `#f6f3ea`, tinta `#1b2119`, campo `#24543a`, arcilla `#a64b32`, ocre `#c18b2f`, teal de datos `#2f6570`.
- Secciones: `how-it-works` (recorrido por etapas), `features` (fichas sobre color), `showcase` (un control a gran escala), `about` (panel con retrato recortado), `faq` (acordeón) y `contact` (cupón recortable).
- Movimiento: cortina de imagen al entrar en viewport; respeta `prefers-reduced-motion`.
- Seis fotografías reales de Wikimedia Commons, con licencia y crédito en `/creditos` y en `src/assets/credits.json`. No se presentan como clientes ni como capturas del producto.

## Formulario de demo

1. Validación en cliente con mensajes visibles y foco en el primer campo inválido.
2. Honeypot oculto; si llega relleno, el backend descarta la solicitud sin crear un lead.
3. Captcha propio de prueba de trabajo: `GET /v1/captcha` devuelve reto y dificultad; un Web Worker calcula `SHA-256(challenge + ":" + solution)` hasta obtener el prefijo de ceros exigido. El backend guarda el uso y lo invalida (single-use).
4. `POST /v1/leads` con consentimiento explícito. Solo un `201` guarda el recibo en `sessionStorage` y navega a `/gracias`.
5. `/gracias` valida el recibo (forma, caducidad y referencia segura); sin recibo muestra un estado vacío, nunca un éxito falso.
6. Errores de red, rate limit y validación se muestran en el formulario; no se simula el envío.

El backend aplica rate limit por IP y hora (`LEAD_RATE_LIMIT_PER_HOUR`) y guarda un hash de IP, nunca la IP en claro.

## Analítica y consentimiento

- Analítica propia, sin cookies de terceros ni píxeles externos.
- Antes de aceptar no se envía ningún evento; la elección se guarda en `localStorage`.
- Aceptar envía `POST /v1/analytics/events` con `consent: true`; rechazar no envía nada y no se vuelve a preguntar.
- La política y el mecanismo se explican en `/cookies`.
- El banner permite cambiar la decisión y está enlazado desde el pie.

## Enlaces y sesión

- CTA principal único: **Solicitar una demo** → `/demo`.
- El acceso al panel es un enlace discreto en cabecera y pie.
- `session-link.ts` consulta `GET /v1/auth/session-status` sin exponer tokens y cambia el texto a **Ir a mi panel** cuando hay sesión activa.
- WhatsApp y correo solo aparecen si `PUBLIC_WHATSAPP_NUMBER` / `PUBLIC_SUPPORT_EMAIL` son valores reales; los placeholders (`example.com`, `agroshield.example`, `600000000`) se ocultan.
- Todos los enlaces internos y anclas se comprueban con `pnpm verify:links` sobre el build servido.

## SEO y assets

- `BaseHead.astro` genera título, descripción, canonical, robots, Open Graph, Twitter Card y JSON-LD por página.
- JSON-LD de organización, sitio, producto, FAQ y migas cuando corresponde; sin valoraciones ni métricas inventadas.
- `robots.txt` y sitemap generados en build.
- Favicons (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`), manifest e iconos 192/512.
- `og-image.png` 1200×630 generada con `pnpm --filter @agroshield/landing assets`.
- Resultados Lighthouse móviles: home 97/100/100/100 y demo 99/100/100/100; escritorio 100/100/100/100. Ver `docs/qa/`.

## Configuración

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `PUBLIC_SITE_NAME` | `AgroShield` | Nombre visible y JSON-LD. |
| `PUBLIC_LANDING_URL` | `http://localhost:4321` | URL canónica, sitemap y Open Graph. |
| `PUBLIC_APP_URL` | `http://localhost:5173` | Enlace al panel. En Docker: `…/app`. |
| `PUBLIC_API_PROXY_TARGET` | `http://localhost:3000` | Destino del proxy `/api` en desarrollo. |
| `PUBLIC_DEMO_MODE` | `false` | Muestra el aviso de entorno de demostración. |
| `PUBLIC_SUPPORT_EMAIL` | vacío | Correo real; si falta, se oculta. |
| `PUBLIC_WHATSAPP_NUMBER` | vacío | Número real; si falta, se oculta. |
| `PUBLIC_LEGAL_ENTITY` | `AgroShield, proyecto en desarrollo` | Titular en páginas legales. |
| `PUBLIC_LEGAL_ADDRESS` | vacío | Dirección postal; obligatoria antes de publicar. |

Todas las variables `PUBLIC_*` son públicas por diseño. No pongas secretos aquí.

> **Antes de publicar:** configura identidad legal, dirección, correo y WhatsApp reales. Las páginas legales son plantillas honestas, no asesoramiento jurídico; deben revisarse con un profesional.

## Pruebas

- 23 pruebas de `consent`, `lead`, `receipt` y `sha256`.
- QA de navegador: consentimiento antes/después, rechazo persistente, formulario inválido, envío real, `/gracias` solo tras `201`, sesión detectada, sin overflow a 320 px y axe sin violaciones.
- `pnpm verify:links`: 73 comprobaciones de rutas, anclas, canonical, 404 y enlaces del build.

## Limitaciones

- No hay vídeo de producto: se decidió no fabricar material audiovisual sin recursos reales.
- No hay blog, buscador ni versionado inglés.
- La analítica es propia y mínima; no hay panel de métricas.
- El sitio no promete resultados agronómicos ni incluye testimonios, logos o cifras de clientes.
