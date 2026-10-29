# Sistema de diseño — AgroShield

Documento de referencia visual y de interacción. La dirección creativa canónica es [`direccion-taste.md`](direccion-taste.md); este archivo explica cómo se materializa en tokens, componentes y pantallas.

## 1. Idea

> **En esta página, el testigo estratificado de una sonda de suelo se convierte en escenario, máscara, viñeta y marca.**

El producto mide lo que ocurre bajo tierra. En lugar de ilustrar plantas o sensores, se toma la geometría del testigo de suelo —capas horizontales dentro de una cápsula— y se usa a cuatro escalas:

1. **Escenario del hero:** bloque verde de campo con la esquina recortada y el testigo como ventana.
2. **Máscara fotográfica:** las seis fotos se recortan con la misma silueta.
3. **Viñeta y medidor:** barras estratificadas junto a listas y en el indicador de salud del suelo.
4. **Marca:** el símbolo del pie y del favicon.

No hay un segundo motivo decorativo. El resto es tipografía, color plano y fotografía.

## 2. Principios

- **Específico, no genérico.** El motivo sale del suelo, no de una plantilla SaaS.
- **Una acción por página.** La landing tiene un CTA principal; el panel prioriza la siguiente acción operativa.
- **La evidencia manda.** Sin testimonios, logos, métricas ni capturas falsas. Los datos demo se etiquetan.
- **Densidad legible.** El panel es una herramienta: tablas, jerarquía clara y estados explícitos.
- **Movimiento informativo.** Solo transiciones que explican un cambio; nada ornamental.
- **Accesible por defecto.** Foco visible, contraste, teclado, `prefers-reduced-motion` y texto alternativo.

## 3. Color

Tokens en `packages/design-tokens/src/tokens.css`. El panel redefine una versión operativa en `frontend/src/styles/app.css` para mantener la misma familia con más contraste en tablas.

| Token | Valor | Uso |
| --- | --- | --- |
| `--as-bg` | `#f6f3ea` | Fondo hueso de la landing y del panel |
| `--as-surface` | `#ece7da` | Superficie secundaria |
| `--as-surface-strong` | `#ded7c5` | Bordes y estados |
| `--as-ink` | `#1b2119` | Texto principal |
| `--as-muted` | `#596054` | Texto secundario |
| `--as-line` | `#cfc7b4` | Líneas |
| `--as-accent` | `#24543a` | Campo: CTA, rail, escenario |
| `--as-accent-soft` | `#d8e2d2` | Fondos suaves |
| `--as-clay` | `#a64b32` | Acento cálido, alertas |
| `--as-ochre` | `#c18b2f` | Aviso |
| `--as-data` | `#2f6570` | Datos, enlaces, foco |
| `--as-danger` | `#9c3423` | Crítico |
| `--as-warning` | `#7a5100` | Advertencia con contraste AA |
| `--as-success` | `#24543a` | Correcto |

Reglas:

- El verde de campo es el color de acción y del escenario; no se usa como texto pequeño sobre hueso sin comprobar contraste.
- El teal de datos es el color de enlaces y foco.
- Arcilla y ocre solo codifican severidad o acentos; nunca decoran bloques grandes.
- El panel usa `--ui-paper: #fffdf7` para tablas y formularios, y `--ui-field-deep: #17301f` para el rail.

## 4. Tipografía

**Switzer** (400/500/600), servida localmente en `packages/design-tokens/src/fonts/` para evitar dependencias externas y mejorar LCP.

| Paso | Token | Tamaño | Uso |
| --- | --- | --- | --- |
| Small | `--as-step-small` | 13–14 px | Metadatos, créditos, notas |
| Body | `--as-step-body` | 17–19 px | Texto de landing |
| Lead | `--as-step-lead` | 20–26 px | Entradillas |
| Head | `--as-step-head` | 32–64 px | Secciones |
| Display | `--as-step-display` | 44–104 px | Hero |

- Display: peso 600, tracking `-0.045em`, leading `0.95`, sentence case.
- Texto: 400, leading 1.5, tracking `-0.005em`.
- El panel usa una escala rem fija (`0.75`–`1.875rem`) para que la densidad no dependa del viewport.
- No hay segunda familia ni versalitas.

## 5. Geometría y motivo

- Un radio principal (`14px` landing, `10px` panel) y uno pequeño (`6px`).
- Una cápsula (`999px`) solo para estados y el testigo.
- Márgenes laterales `clamp(20px, 4vw, 40px)` en landing; el panel usa un rail fijo y contenido centrado.
- El recorte del escenario es una esquina biselada de dos columnas, no un `border-radius` genérico.
- Las fotos se enmascaran con la silueta del testigo; no se usan marcos de dispositivo.
- El testigo se dibuja con CSS/SVG, no con una ilustración.

## 6. Landing

### Composición

1. **Hero:** titular a la izquierda (“El suelo avisa. Con fecha límite.”), una frase de apoyo, CTA único y escenario verde con una alerta de ejemplo navegable. La alerta es una vista de ejemplo etiquetada, no una captura de cliente.
2. **Cómo funciona:** recorrido por etapas; el control cambia el estado de la alerta.
3. **Capacidades:** fichas sobre campos de color, con el testigo como viñeta.
4. **Showcase:** un control a gran escala que alterna estados.
5. **Sobre el producto:** panel interior con retrato recortado y explicación de la firma en el origen.
6. **FAQ:** acordeón de fichas rellenas.
7. **Contacto:** cupón recortable con el formulario de demo.
8. **Pie:** marca, navegación, legal, contacto y créditos.

### Fotografía

Seis fotografías reales de Wikimedia Commons, optimizadas en build, con `width`, `height`, `alt`, `loading="lazy"` (salvo el hero) y crédito en `/creditos`:

- `aerial-farmland.jpg`
- `farmer-wheat.jpg`
- `olive-grove.jpg`
- `pivot-irrigation.jpg`
- `soil-profile.jpg`
- `wheat-close.jpg`

No se presentan como clientes, empleados ni capturas del producto.

### Movimiento

- Cortina de imagen al entrar en viewport (`--as-shutter: 1100ms`), una sola vez.
- Transiciones de 120–240 ms para estados y acordeón.
- `prefers-reduced-motion: reduce` pone todos los tokens de duración a `0ms`.
- El hero no tiene animación de entrada que retrase el LCP.

## 7. Panel

### Shell

- Rail verde profundo a la izquierda en escritorio; barra superior y menú en móvil.
- Contenido sobre hueso, tarjetas blancas, tablas con líneas finas.
- Encabezado de página con título, contexto y acciones.
- Aviso de entorno demo visible y persistente.
- Enlace de salto al contenido y foco visible.

### Patrones

| Patrón | Uso |
| --- | --- |
| `MetricChart` | Serie temporal de lecturas; sin ejes decorativos |
| `SoilStrata` | Puntuación 0–100, estado y días restantes; `role="meter"` |
| `StatusBadge` | Severidad y estado con texto, no solo color |
| `StateMessage` | Carga, error, vacío y reintento |
| `OfflineBanner` | Falta de red; no simula éxito |
| `ToastHost` | Confirmaciones efímeras con `aria-live` |
| Diálogos | Foco atrapado, cierre con Escape, retorno de foco |

### Tablas y 320 px

- Las tablas viven en `.table-scroll` con `overflow-x: auto` y `position: relative`.
- El `position: relative` contiene helpers absolutamente posicionados (`.as-visually-hidden`) y evita que ensanchen el documento.
- En 320 px las columnas secundarias se ocultan o se apilan; las acciones siguen accesibles.
- Se verificó `document.documentElement.scrollWidth === 320` en dashboard, alertas y zona.

## 8. Responsive

| Rango | Comportamiento |
| --- | --- |
| 320–479 px | Una columna, rail como menú, tablas con scroll, tipografía mínima 13 px |
| 480–767 px | Una columna, acciones a ancho completo, formularios apilados |
| 768–1023 px | Dos columnas en landing; panel con rail colapsable |
| 1024–1439 px | Composición completa; rail fijo |
| 1440 px+ | Contenido centrado con máximo `1240px`; márgenes amplios |

Comprobaciones: sin overflow horizontal en landing, demo, dashboard, alertas y zona a 320 px; capturas en `docs/design/evidencia/`.

## 9. Accesibilidad

- Contraste AA en texto y controles; axe sin violaciones en seis pantallas.
- Landmarks (`header`, `nav`, `main`, `footer`), un `h1` por página y jerarquía de encabezados.
- Enlace de salto, foco visible de 3 px y `:focus-visible`.
- Formularios con `label` visible, `aria-describedby` para errores y foco en el primer campo inválido.
- Diálogos con `role="dialog"`, `aria-modal`, foco atrapado y Escape.
- Estado nunca solo por color: siempre hay texto o icono.
- `aria-live` para avisos, cuenta atrás y confirmaciones.
- Imágenes con `alt` significativo o `alt=""` si son decorativas.
- Respeto de `prefers-reduced-motion`.
- Pruebas con axe en landing home, demo, login, dashboard, zona y alertas.

## 10. Evidencia

Capturas generadas por `scripts/ui-qa.mjs`:

- `docs/design/evidencia/landing-home-1440.png`, `landing-home-320.png`
- `landing-demo-1440.png`, `landing-demo-320.png`, `landing-gracias-1440.png`
- `app-login-1440.png`, `app-dashboard-1440.png`, `app-dashboard-320.png`
- `app-zone-1440.png`, `app-zone-320.png`
- `app-alerts-1440.png`, `app-alerts-320.png`
- `app-alert-1440.png`, `app-alert-dialog-1440.png`
- `app-offline-1440.png`, `app-session-expired-1440.png`
- `docs/design/evidencia/mobile-review/` — revisión por secciones a 320 px

Resultados:

- UI QA: 39/39 comprobaciones.
- axe: 0 violaciones en 6 pantallas.
- Lighthouse móvil: home 97/100/100/100; demo 99/100/100/100.
- Lighthouse escritorio: home 100/100/100/100.
- Enlaces: 73/73.

## 11. Deuda y límites

- `script-src 'unsafe-inline'` en la CSP por los scripts inline de Astro; sustituir por nonces/hashes.
- No hay modo oscuro; la paleta está pensada para luz de campo y se declara `color-scheme: light`.
- No hay biblioteca de componentes publicada; los patrones viven en el código de cada superficie.
- El panel no tiene selector de idioma; el catálogo está preparado.
- El movimiento de cortina no tiene vídeo; es una transición de imagen, no un clip.
- Las capturas de la landing usan datos de ejemplo; cualquier cambio de copy debe regenerarlas.
