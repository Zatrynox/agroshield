# Informe de QA — AgroShield 0.1.0

Resultados de las pruebas ejecutadas en la máquina de desarrollo. Este informe distingue lo verificado de lo que depende de CI o de un entorno real.

## Entorno

| Elemento | Valor |
| --- | --- |
| Sistema | Windows, host de desarrollo |
| Node | `24.15.0` |
| pnpm | `11.1.2` |
| Chrome | Instalado; Playwright con `channel: 'chrome'` |
| Backend local | Fastify en `127.0.0.1:3000`, PGlite persistente |
| Frontend local | Vite en `localhost:5173` |
| Landing local | Astro en `localhost:4321` |
| Datos | Seed demo (`agroshield-demo`), 5 alertas abiertas |
| Docker | `29.9.2`, Compose `v5.6.1`; stack local en `http://localhost:8088` |

## Resumen

| Área | Resultado |
| --- | --- |
| Typecheck | Pasa en todos los paquetes |
| Pruebas automatizadas | **77/77** (41 backend, 13 frontend, 23 landing) |
| Build | Pasa en backend, frontend y landing |
| Enlaces y rutas | **73/73** |
| Smoke de API en vivo | **23/23** |
| UI QA (Playwright) | **39/39** |
| axe | **0 violaciones** en 6 pantallas |
| Lighthouse móvil home | 97 / 100 / 100 / 100 |
| Lighthouse móvil demo | 99 / 100 / 100 / 100 |
| Lighthouse escritorio home | 100 / 100 / 100 / 100 |
| Docker / Trivy / Gitleaks | **Ejecutado**; Trivy 0 HIGH/CRITICAL, Gitleaks limpio, smoke 23/23 |

## Pruebas automatizadas

### Backend — 41

| Archivo | Cobertura |
| --- | --- |
| `alerts/domain/services/alert-rules.test.ts` | Temperatura por cultivo, crecimiento exponencial de plaga, nutrientes, severidad, cuenta atrás y deduplicación |
| `soil-health/domain/services/soil-health-service.test.ts` | Puntuación ponderada, estados, factor limitante y recomendación |
| `forecast/domain/services/forecast-service.test.ts` | Tendencia demo a 7 días |
| `predictions/domain/services/prediction-service.test.ts` | Riesgo y predicción demo |
| `sensors/domain/services/reading-payload.test.ts` | Payload canónico y firma |
| `config/env.test.ts` | Validación de entorno y fallo cerrado en producción |
| `test/integration.test.ts` | Registro, login, sesión, CSRF, fincas, zonas, sensores, lecturas, alertas, leads y analítica sobre PGlite |
| `test/docs.test.ts` | Serialización OpenAPI, rutas y parámetros |

```bash
pnpm --filter @agroshield/backend test
```

### Frontend — 13

| Archivo | Cobertura |
| --- | --- |
| `api/client.test.ts` | Problem Details, 401, CSRF, cabeceras y errores de red |
| `lib/format.test.ts` | Fechas, cuentas atrás, hectáreas y números |
| `lib/redirect.test.ts` | Redirecciones internas seguras |

```bash
pnpm --filter @agroshield/frontend test
```

### Landing — 23

| Archivo | Cobertura |
| --- | --- |
| `lib/consent.test.ts` | Estados de consentimiento y persistencia |
| `lib/lead.test.ts` | Validación del formulario y payload |
| `lib/receipt.test.ts` | Recibo de `/gracias`, caducidad y referencias |
| `lib/sha256.test.ts` | Hash del captcha de prueba de trabajo |

```bash
pnpm --filter @agroshield/landing test
```

## Smoke de API en vivo — 23/23

Ejecutado con el backend arrancado y el seed aplicado:

```bash
node scripts/e2e-smoke.mjs
```

Comprueba:

1. `/health` responde `ok`.
2. La base de datos es alcanzable.
3. Login demo devuelve `200`.
4. Login devuelve un token CSRF.
5. La cookie de sesión es `HttpOnly`.
6. `/auth/me` devuelve la organización demo.
7. `/auth/me` no filtra el token de sesión.
8. `session-status` autenticado es `true`.
9. Las fincas están filtradas por organización.
10. Hay alertas abiertas.
11. Las alertas exponen `deadlineAt`.
12. Una mutación sin CSRF devuelve `403 csrf_invalid`.
13. El reconocimiento persiste (`acknowledgedAt`).
14. La alerta reconocida sale de la lista abierta.
15. Se emite un reto de captcha.
16. La dificultad está entre 3 y 6.
17. El lead se persiste y devuelve `201`.
18. El captcha no se puede reutilizar (`400 captcha_invalid`).
19. La analítica rechaza eventos sin consentimiento.
20. La analítica acepta eventos con consentimiento (`202`/`204`).
21. Logout devuelve `204`.
22. La sesión queda revocada en servidor (`401`).
23. El flujo completo no imprime secretos.

> El smoke crea un lead `[E2E]` y el QA de UI un lead `Finca QA`. Son datos de prueba locales; deben limpiarse antes de compartir la base.

## UI QA — 39/39

Ejecutado con backend, frontend y landing arrancados:

```bash
node scripts/ui-qa.mjs
```

### Landing

1. El hero renderiza.
2. Hay un único CTA principal de demo.
3. El enlace de login es discreto.
4. Sin overflow horizontal en escritorio.
5. No hay petición de analítica antes del consentimiento.
6. El banner aparece inicialmente.
7. Rechazar oculta el banner.
8. El rechazo persiste tras recargar.
9. El rechazo no envía analítica.
10. El botón del hero reconoce la alerta en el sitio.
11. “Cómo funciona” cambia la etapa de la alerta.
12. La FAQ abre.
13. El showcase cambia de estado.
14. Aceptar envía un page view.
15. El evento aceptado lleva `consent: true`.
16. El rechazo no se reporta al servidor.

### Formulario y sesión

17. Sin overflow en `/demo` escritorio.
18. El formulario vacío muestra errores.
19. El envío inválido enfoca el primer campo.
20. El formulario envía a la API.
21. `/gracias` aparece solo tras `201`.
22. La confirmación muestra una referencia segura.
23. El login demo abre el panel protegido.
24. Sin overflow en dashboard escritorio.
25. El dashboard expone deep links de finca.
26. El detalle de finca carga.
27. El detalle de finca expone enlaces de zona.
28. El detalle de zona carga.
29. La cola de alertas carga.
30. El reconocimiento persiste en la UI.
31. El reconocimiento sobrevive a la recarga.
32. La landing detecta la sesión activa sin exponer tokens.
33. La sesión caducada redirige con motivo.
34. El estado offline es explícito, sin éxito simulado.

### Responsive 320 px

35. Landing sin overflow.
36. Demo sin overflow.
37. Dashboard sin overflow.
38. Alertas sin overflow.
39. Zona sin overflow.

### Incidencia corregida

La vista de zona a 320 px desbordaba a **587 px**. La causa era `.as-visually-hidden` (`position: absolute !important`) usado en el encabezado de la tabla de acciones: al no tener un ancestro posicionado, se referenciaba al documento y ensanchaba el layout. La corrección fue añadir `position: relative` a `.table-scroll`, de modo que el helper absoluto quede contenido por el contenedor con scroll. Verificación: `document.documentElement.scrollWidth` pasó de `587` a `320`.

### Consola

`ui-qa.json` registra 5 mensajes de consola, todos de rutas negativas intencionadas:

- `401` al comprobar la sesión anónima en la landing.
- `403` en comprobaciones de analítica/CSRF sin consentimiento o sin token.

No hay peticiones fallidas (`failedRequests: []`). No se ocultan errores: se comprueba que los estados negativos se comporten correctamente.

## axe

| Pantalla | Violaciones |
| --- | --- |
| `landing-home` | 0 |
| `landing-demo` | 0 |
| `app-login` | 0 |
| `app-dashboard` | 0 |
| `app-zone` | 0 |
| `app-alerts` | 0 |

Los informes completos están en `docs/qa/axe/`.

## Lighthouse

| Perfil | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
| --- | --- | --- | --- | --- |
| Móvil, home | 97 | 100 | 100 | 100 |
| Móvil, demo | 99 | 100 | 100 | 100 |
| Escritorio, home | 100 | 100 | 100 | 100 |

JSON en `docs/qa/lighthouse-*.json`. Medido sobre el build de la landing con Chrome local; no sustituye una medición de campo.

## Enlaces y rutas — 73/73

`node scripts/check-links.mjs` sobre landing y app servidas:

- Todas las rutas públicas responden `200` y tienen título, `h1` y canonical.
- `/gracias` es `noindex`.
- Las anclas `#contenido`, `#como-funciona`, `#capacidades`, `#preguntas` y `#contacto` existen.
- `/404` responde `404`.
- El panel sirve login, registro, 404, panel, fincas, zonas, alertas y cuenta.
- Un deep link inválido de finca falla de forma honesta.
- El enlace de la landing a la app resuelve.

El total incluye un deep link por cada alerta abierta del seed: 73 con las 5 alertas del estado final y 72 si una está reconocida. El resto de comprobaciones es fijo.

Resultado en `docs/qa/link-check.json`.

## Infraestructura y contenedores

Validación estática:

- Los tres Compose renderizan con `node scripts/validate-infra.mjs`.
- Imágenes fijadas por digest; sin `latest`.
- Dockerfiles multi-stage, no-root, healthcheck y limpieza.
- Caddy local y producción validan con Caddy `2.11.7`.
- El contrato OpenAPI expone las rutas esperadas.

Validación con Docker (2026-10-30):

| Comprobación | Resultado |
| --- | --- |
| `docker run --rm hello-world` | Correcto |
| `compose.yaml config -q` | Correcto |
| `compose.dev.yaml config -q` | Correcto |
| `compose.prod.yaml config -q` con env de prueba | Correcto |
| Build `agroshield-backend:local` | Correcto |
| Build `agroshield-web:local` | Correcto |
| Trivy HIGH/CRITICAL corregibles, backend | **0** |
| Trivy HIGH/CRITICAL corregibles, web | **0** |
| Gitleaks working tree | Limpio |
| Gitleaks historial completo | Limpio |
| Stack local: db, seed, backend y web | Sanos; seed exit 0 |
| Smoke de API contra `http://localhost:8088/api` | **23/23** |

La imagen web recompila Caddy `2.11.7` con Go `1.27.3` y parchea `go-jose` `4.1.6` y `x/net` `0.60.0`; el binario resultante no tiene file capabilities y arranca con `cap_drop: ALL`. La imagen del backend aplica `apk upgrade` y elimina npm/corepack.

El puerto `8080` del host estaba ocupado por `httpd.exe` (PID 5288), así que el stack se publicó en `8088` con un override temporal no versionado. El stack de producción no se ejecutó: requiere dominio, TLS/ACME, secretos e identidad legal. CI tampoco se ha ejecutado aún.

## Regresiones y riesgos abiertos

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| PGlite monoproceso | Datos obsoletos tras `seed` | Reiniciar la API; usar PostgreSQL en Docker |
| Producción no verificada | TLS/ACME, HSTS y cookies reales podrían fallar | Probar en el host de despliegue antes de abrir |
| CI no ejecutada | El workflow podría fallar en GitHub | Subir a un remoto y ejecutar los cuatro jobs |
| Acciones CI por tag | Supply chain | Fijar por SHA como hardening |
| `script-src 'unsafe-inline'` | CSP menos estricta | Nonces/hashes |
| Sin E2E en CI | Regresiones de UI | Añadir Playwright al pipeline |
| Datos `[E2E]`/`Finca QA` | Ruido en la base local | Limpiar antes de compartir |
| Sin retención/purga | Cumplimiento | Definir política antes de producción |

## Reproducir

```bash
# 1. Dependencias y entorno
cp .env.example .env
cp landing/.env.example landing/.env
pnpm install --frozen-lockfile

# 2. Calidad
pnpm typecheck
pnpm test
pnpm build
pnpm verify:infra

# 3. Servidores (tres terminales)
pnpm dev:api
pnpm dev:app
pnpm dev:landing

# 4. Seed (detener la API antes por PGlite; reiniciarla después)
pnpm seed

# 5. QA
node scripts/e2e-smoke.mjs
node scripts/check-links.mjs
node scripts/ui-qa.mjs
```

## Conclusión

La entrega es funcional y verificable en el host: los flujos críticos persisten, los estados negativos son honestos, la accesibilidad automatizada está limpia, el rendimiento móvil supera el objetivo de 90 y el stack Docker local arranca con imágenes sin hallazgos HIGH/CRITICAL. Los bloqueos restantes son de lanzamiento (legal, secretos reales, producción con TLS, CI y operación), no fallos conocidos del núcleo.
