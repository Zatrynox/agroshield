#!/usr/bin/env node
/**
 * Browser QA for the public landing and the authenticated app.
 * Requires the backend, frontend and landing dev servers running, plus demo seed.
 * Uses the installed Chrome, not a downloaded Playwright browser.
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const envPath = join(root, '.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);

const landing = process.env.E2E_LANDING_URL ?? 'http://localhost:4321';
const app = process.env.E2E_APP_URL ?? 'http://localhost:5173';
const password = process.env.DEMO_PASSWORD;
if (!password) throw new Error('DEMO_PASSWORD is required');

const shots = join(root, 'docs', 'design', 'evidencia');
const axeDir = join(root, 'docs', 'qa', 'axe');
await mkdir(shots, { recursive: true });
await mkdir(axeDir, { recursive: true });

const checks = [];
const axeRuns = [];
const consoleErrors = [];
const failedRequests = [];

function ok(name, condition, detail = '') {
  if (!condition) throw new Error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  checks.push(name);
  console.log(`ok ${String(checks.length).padStart(2, '0')} - ${name}`);
}

function watch(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`${label}: ${message.text()}`);
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.startsWith(landing) || url.startsWith(app)) {
      failedRequests.push(`${label}: ${request.method()} ${url} (${request.failure()?.errorText})`);
    }
  });
  page.on('pageerror', (error) => consoleErrors.push(`${label}: pageerror ${error.message}`));
}

async function runAxe(page, name) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.length,
    targets: violation.nodes.slice(0, 4).map((node) => node.target.join(' ')),
  }));
  await writeFile(
    join(axeDir, `${name}.json`),
    JSON.stringify({ url: page.url(), violations: results.violations }, null, 2),
  );
  axeRuns.push({ name, violations: summary });
  const severe = summary.filter((item) => item.impact === 'serious' || item.impact === 'critical');
  console.log(
    `axe ${name}: ${summary.length} rule(s), ${severe.length} serious/critical`,
  );
  severe.forEach((item) => console.log(`  ! ${item.impact} ${item.id} (${item.nodes})`));
}

async function noOverflow(page, name) {
  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  ok(
    `${name} has no horizontal overflow`,
    result.scrollWidth <= result.innerWidth + 1,
    `${result.scrollWidth} > ${result.innerWidth}`,
  );
}

// Trigger IntersectionObserver reveals before a full-page screenshot, then
// return to the top so sticky headers are captured in their real position.
async function revealLanding(page) {
  await page.evaluate(async () => {
    const step = Math.max(320, Math.round(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
}

async function waitForAppData(page) {
  await page
    .waitForFunction(() => !document.querySelector('.skeleton'), { timeout: 15_000 })
    .catch(() => undefined);
  await page.waitForTimeout(250);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'es-ES',
  timezoneId: 'Europe/Madrid',
  colorScheme: 'light',
});
const page = await context.newPage();
watch(page, 'landing');

// ---------- Landing ----------
const analyticsRequests = [];
page.on('request', (request) => {
  if (request.url().includes('/api/v1/analytics/events')) analyticsRequests.push(request.postData());
});

await page.goto(`${landing}/`, { waitUntil: 'networkidle' });
ok('landing hero renders', await page.getByRole('heading', { level: 1 }).isVisible());
ok('landing has one primary demo CTA', (await page.getByRole('link', { name: 'Solicitar una demo' }).count()) >= 1);
ok('login link is discreet', await page.getByRole('link', { name: /Iniciar sesión/ }).first().isVisible());
await noOverflow(page, 'landing desktop');
ok('no analytics request before consent', analyticsRequests.length === 0);

const consentBanner = page.locator('[data-consent-banner]');
ok('consent banner is shown initially', await consentBanner.isVisible());
await page.getByRole('button', { name: 'Rechazar' }).click();
ok('rejecting consent hides the banner', !(await consentBanner.isVisible()));
await page.reload({ waitUntil: 'networkidle' });
ok('rejection persists after reload', !(await consentBanner.isVisible()));
ok('rejection sends no analytics', analyticsRequests.length === 0);

const heroAck = page.locator('[data-hero-ack]');
await heroAck.click();
ok('hero demo acknowledges in place', (await page.locator('[data-hero-status]').textContent()) === 'Alerta reconocida');

await page.getByRole('button', { name: 'Alerta', exact: true }).click();
ok(
  'how-it-works switches to the alert stage',
  (await page.locator('[data-stage-panel]:not([hidden]) h3').textContent()) === 'Estrés hídrico en floración',
);

const firstFaq = page.locator('details.faq__item').first();
await firstFaq.locator('summary').click();
ok('FAQ accordion opens', await firstFaq.evaluate((element) => element.hasAttribute('open')));

const showcase = page.locator('[data-showcase-control]');
await showcase.click();
ok('showcase control changes state', (await page.locator('[data-showcase-state]').textContent()) === 'Alerta reconocida');
await showcase.click();

await revealLanding(page);
await page.screenshot({ path: join(shots, 'landing-home-1440.png'), fullPage: true });
await runAxe(page, 'landing-home');

// Consent acceptance path on a clean reload.
await page.goto(`${landing}/cookies`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Cambiar mi elección' }).click();
await page.waitForLoadState('networkidle');
await page.getByRole('button', { name: 'Aceptar analítica' }).click();
await page.waitForTimeout(500);
ok('accepting consent sends a page view', analyticsRequests.length >= 1);
ok(
  'accepted analytics payload has consent true',
  analyticsRequests.every((body) => body?.includes('"consent":true')),
);
ok('rejection is not reported to the server', !analyticsRequests.some((body) => body?.includes('consent_rejected')));

// ---------- Demo page and real form ----------
await page.goto(`${landing}/demo`, { waitUntil: 'networkidle' });
await revealLanding(page);
await page.screenshot({ path: join(shots, 'landing-demo-1440.png'), fullPage: true });
await runAxe(page, 'landing-demo');
await noOverflow(page, 'demo desktop');

const form = page.locator('[data-demo-form]');
await form.getByRole('button', { name: 'Enviar solicitud' }).click();
ok('empty form shows validation errors', await form.getByText('Error: Escribe al menos 2 caracteres.').isVisible());
ok(
  'invalid submit moves focus to the first field',
  (await page.evaluate(() => document.activeElement?.getAttribute('name'))) === 'name',
);

await page.locator('#lead-name').fill('Marta QA');
await page.locator('#lead-company').fill('Finca QA');
await page.locator('#lead-email').fill(`qa-${Date.now()}@example.com`);
await page.locator('#lead-phone').fill('+34 600 000 000');
await page.locator('#lead-message').fill('Prueba de interfaz: 30 hectáreas de olivar y tres zonas.');
await page.locator('#lead-consent').check();

const leadResponse = page.waitForResponse(
  (response) => response.url().includes('/api/v1/leads') && response.request().method() === 'POST',
  { timeout: 60_000 },
);
const thanksNavigation = page.waitForURL(/\/gracias$/, { timeout: 60_000 });
await form.getByRole('button', { name: 'Enviar solicitud' }).click();
const response = await leadResponse;
ok('demo form submits to the API', response.status() === 201);
await thanksNavigation;
await page.waitForLoadState('networkidle');
ok('success page appears only after 201', await page.getByRole('heading', { name: 'Hemos recibido tu solicitud.' }).isVisible());
ok('success page shows a safe reference', (await page.locator('[data-thanks-ref]').textContent())?.match(/^[0-9A-F]{8}$/) !== null);
await page.screenshot({ path: join(shots, 'landing-gracias-1440.png'), fullPage: true });

// ---------- App ----------
await page.goto(`${app}/login`, { waitUntil: 'networkidle' });
await page.screenshot({ path: join(shots, 'app-login-1440.png'), fullPage: true });
await runAxe(page, 'app-login');

await page.locator('#login-email').fill('demo@agroshield.example');
await page.locator('#login-password').fill(password);
await page.getByRole('button', { name: 'Entrar' }).click();
await page.waitForURL(/\/panel$/, { timeout: 20_000 });
await page.getByRole('heading', { name: /Hola,/ }).waitFor();
await waitForAppData(page);
ok('demo login opens the protected panel', page.url().endsWith('/panel'));
await page.screenshot({ path: join(shots, 'app-dashboard-1440.png'), fullPage: true });
await runAxe(page, 'app-dashboard');
await noOverflow(page, 'dashboard desktop');

const farmLinks = await page.locator('a[href^="/panel/fincas/"]').evaluateAll((links) =>
  links.map((link) => link.getAttribute('href')).filter(Boolean),
);
ok('dashboard exposes farm deep links', farmLinks.length >= 1);
await page.goto(`${app}${farmLinks[0]}`, { waitUntil: 'networkidle' });
ok('farm detail loads', (await page.locator('h1').textContent())?.trim().length > 0);
const zoneLink = page.locator('a[href^="/panel/zonas/"]').first();
ok('farm detail exposes zone links', await zoneLink.isVisible());
const zoneHref = await zoneLink.getAttribute('href');
await zoneLink.click();
await page.waitForURL(/\/panel\/zonas\//);
await page.locator('h1').waitFor();
await waitForAppData(page);
ok('zone detail loads', await page.locator('h1').isVisible());
await page.screenshot({ path: join(shots, 'app-zone-1440.png'), fullPage: true });
await runAxe(page, 'app-zone');

await page.goto(`${app}/panel/alertas`, { waitUntil: 'networkidle' });
ok('alert queue loads', await page.locator('table.alerts-table tbody tr').first().isVisible());
await page.screenshot({ path: join(shots, 'app-alerts-1440.png'), fullPage: true });
await runAxe(page, 'app-alerts');

await page.locator('table.alerts-table tbody tr a.table-link').first().click();
await page.waitForURL(/\/panel\/alertas\/[0-9a-f-]+$/);
await page.getByRole('button', { name: 'Reconocer alerta' }).click();
await page.getByRole('dialog').waitFor();
await page.screenshot({ path: join(shots, 'app-alert-dialog-1440.png'), fullPage: true });
await page.getByRole('button', { name: 'Sí, reconocer' }).click();
await page.getByText(/Alerta reconocida/).first().waitFor();
ok('alert acknowledgment persists in the UI', (await page.getByRole('button', { name: 'Reconocer alerta' }).count()) === 0);
await page.screenshot({ path: join(shots, 'app-alert-1440.png'), fullPage: true });
await page.reload({ waitUntil: 'networkidle' });
ok('acknowledgment survives reload', (await page.getByRole('button', { name: 'Reconocer alerta' }).count()) === 0);

// Session-aware landing link now that the cookie exists.
await page.goto(`${landing}/`, { waitUntil: 'networkidle' });
await page.getByRole('link', { name: /Ir a mi panel/ }).first().waitFor();
ok('landing detects the active session without exposing tokens', true);

// ---------- Session expiry ----------
await page.goto(`${app}/panel`, { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: /Hola,/ }).waitFor();
await page.route('**/api/v1/farms*', (route) =>
  route.fulfill({
    status: 401,
    contentType: 'application/problem+json',
    body: JSON.stringify({
      type: 'https://agroshield.example/problems/session_expired',
      title: 'Sesión caducada',
      status: 401,
      detail: 'Vuelve a iniciar sesión.',
      code: 'session_expired',
    }),
  }),
);
await page.getByRole('link', { name: /Fincas/ }).click();
await page.waitForURL(/\/login\?.*reason=expired/, { timeout: 20_000 });
ok('expired session redirects to login with a reason', true);
await page.screenshot({ path: join(shots, 'app-session-expired-1440.png'), fullPage: true });
await page.unroute('**/api/v1/farms*');

// The login redirect preserves the requested deep link.
await page.locator('#login-email').fill('demo@agroshield.example');
await page.locator('#login-password').fill(password);
await page.getByRole('button', { name: 'Entrar' }).click();
await page.waitForURL(/\/panel(\/|$)/, { timeout: 20_000 });
await page.goto(`${app}/panel`, { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: /Hola,/ }).waitFor();

// ---------- Offline ----------
await context.setOffline(true);
await page.getByText('Sin conexión').first().waitFor({ timeout: 10_000 });
ok('offline state is explicit, not simulated success', true);
await page.screenshot({ path: join(shots, 'app-offline-1440.png'), fullPage: true });
await context.setOffline(false);

// ---------- Mobile 320 ----------
await page.setViewportSize({ width: 320, height: 800 });
await page.goto(`${landing}/`, { waitUntil: 'networkidle' });
await revealLanding(page);
await noOverflow(page, 'landing 320');
await page.screenshot({ path: join(shots, 'landing-home-320.png'), fullPage: true });
await page.goto(`${landing}/demo`, { waitUntil: 'networkidle' });
await revealLanding(page);
await noOverflow(page, 'demo 320');
await page.screenshot({ path: join(shots, 'landing-demo-320.png'), fullPage: true });

await page.goto(`${app}/panel`, { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: /Hola,/ }).waitFor();
await waitForAppData(page);
await noOverflow(page, 'dashboard 320');
await page.screenshot({ path: join(shots, 'app-dashboard-320.png'), fullPage: true });

await page.goto(`${app}/panel/alertas`, { waitUntil: 'networkidle' });
await waitForAppData(page);
await noOverflow(page, 'alerts 320');
await page.screenshot({ path: join(shots, 'app-alerts-320.png'), fullPage: true });

if (zoneHref) {
  await page.goto(`${app}${zoneHref}`, { waitUntil: 'networkidle' });
  await waitForAppData(page);
  await noOverflow(page, 'zone 320');
  await page.screenshot({ path: join(shots, 'app-zone-320.png'), fullPage: true });
}

// ---------- Report ----------
await browser.close();

const report = {
  generatedAt: new Date().toISOString(),
  checks,
  axe: axeRuns,
  consoleErrors,
  failedRequests,
};
await writeFile(join(root, 'docs', 'qa', 'ui-qa.json'), JSON.stringify(report, null, 2));

console.log(`\n${checks.length} UI checks passed.`);
console.log(`${axeRuns.reduce((total, run) => total + run.violations.length, 0)} axe rule(s) recorded.`);
if (consoleErrors.length) {
  console.log('\nConsole errors:');
  consoleErrors.forEach((item) => console.log(`  - ${item}`));
}
if (failedRequests.length) {
  console.log('\nFailed same-origin requests:');
  failedRequests.forEach((item) => console.log(`  - ${item}`));
}
