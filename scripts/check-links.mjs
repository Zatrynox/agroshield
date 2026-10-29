#!/usr/bin/env node
/**
 * Link and route checker for the production landing build and the app.
 *
 * Prerequisites:
 *   - backend running on http://127.0.0.1:3000 with demo data
 *   - landing build served on http://localhost:4321
 *   - app served on http://localhost:5173 (dev) or 4173 (preview)
 *   - DEMO_PASSWORD in .env
 *
 * Usage: node scripts/check-links.mjs
 *
 * External links are listed but not treated as failures: third-party sites
 * (Wikimedia, WhatsApp) are outside our control and often block bots.
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const envPath = join(root, '.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);

const landingBase = (process.env.E2E_LANDING_URL ?? 'http://localhost:4321').replace(/\/+$/, '');
const appBase = (process.env.E2E_APP_URL ?? 'http://localhost:5173').replace(/\/+$/, '');
const password = process.env.DEMO_PASSWORD;
if (!password) throw new Error('DEMO_PASSWORD is required (set it in .env)');

const checks = [];
const failures = [];
const externalLinks = new Set();
const appLinksFromLanding = new Set();

function check(name, condition, detail = '') {
  checks.push(name);
  if (condition) {
    console.log(`ok ${String(checks.length).padStart(2, '0')} - ${name}`);
    return true;
  }
  failures.push(`${name}${detail ? `: ${detail}` : ''}`);
  console.log(`NOT OK ${String(checks.length).padStart(2, '0')} - ${name}${detail ? `: ${detail}` : ''}`);
  return false;
}

function fragmentOf(url) {
  return url.hash ? decodeURIComponent(url.hash.slice(1)) : '';
}

function normalizePath(url) {
  return `${url.pathname}${url.search}`;
}

async function getJson(response) {
  const text = await response.text();
  return { status: response.status(), text };
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ locale: 'es-ES', timezoneId: 'Europe/Madrid' });
const page = await context.newPage();
const landingPages = new Map();
const landingFragments = new Map();
const landingAssets = new Set();
const failedResponses = [];

page.on('response', (response) => {
  if (response.url().startsWith(landingBase) && response.status() >= 400) {
    if (!response.url().endsWith('/404')) {
      failedResponses.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  }
});

// ---------- Landing ----------
const landingRoutes = ['/', '/demo', '/gracias', '/privacidad', '/terminos', '/cookies', '/creditos'];
const queue = [...landingRoutes];

while (queue.length > 0) {
  const path = queue.shift();
  if (landingPages.has(path)) continue;
  const url = new URL(path, landingBase).href;
  const response = await page.goto(url, { waitUntil: 'networkidle' });
  const status = response?.status() ?? 0;
  landingPages.set(path, status);
  check(`landing ${path} responds 200`, status === 200, String(status));
  const title = await page.title();
  check(`landing ${path} has a title`, title.trim().length > 0);
  const h1 = await page.locator('h1').first().textContent().catch(() => '');
  check(`landing ${path} has a visible h1`, Boolean(h1?.trim()));
  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute('href')
    .catch(() => null);
  if (path !== '/404') {
    check(`landing ${path} has a canonical URL`, Boolean(canonical), canonical ?? 'missing');
  }

  const anchors = await page.$$eval('a[href]', (elements) =>
    elements.map((element) => element.getAttribute('href')).filter(Boolean),
  );
  for (const href of anchors) {
    let target;
    try {
      target = new URL(href, landingBase);
    } catch {
      continue;
    }
    if (target.origin === new URL(appBase).origin) {
      appLinksFromLanding.add(`${target.pathname}${target.search}${target.hash}`);
      continue;
    }
    if (target.origin !== new URL(landingBase).origin) {
      externalLinks.add(target.href);
      continue;
    }
    const pathname = normalizePath(target);
    if (pathname.startsWith('/api/')) continue;
    if (!landingPages.has(pathname) && !queue.includes(pathname)) queue.push(pathname);
    if (target.hash) {
      if (!landingFragments.has(pathname)) landingFragments.set(pathname, new Set());
      landingFragments.get(pathname).add(fragmentOf(target));
    }
  }

  const assetUrls = await page.$$eval(
    'link[href], script[src], img[src], source[srcset]',
    (elements) => {
      const values = [];
      for (const element of elements) {
        for (const attribute of ['href', 'src', 'srcset']) {
          const value = element.getAttribute(attribute);
          if (value) values.push(value);
        }
      }
      return values;
    },
  );
  for (const value of assetUrls) {
    for (const part of value.split(',')) {
      const candidate = part.trim().split(/\s+/)[0];
      if (!candidate) continue;
      try {
        const asset = new URL(candidate, landingBase);
        if (asset.origin === new URL(landingBase).origin && !asset.pathname.startsWith('/api/')) {
          landingAssets.add(asset.href);
        }
      } catch {
        // Ignore malformed srcset entries; Astro emits well-formed values.
      }
    }
  }

  const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content').catch(() => null);
  if (path === '/gracias') {
    check('/gracias is noindex', Boolean(robotsMeta?.includes('noindex')), robotsMeta ?? 'missing');
  }
}

// Fragments must exist on their target page.
for (const [pathname, fragments] of landingFragments) {
  await page.goto(new URL(pathname, landingBase).href, { waitUntil: 'networkidle' });
  for (const fragment of fragments) {
    const exists = await page.evaluate((id) => Boolean(document.getElementById(id)), fragment);
    check(`fragment ${pathname}#${fragment} exists`, exists);
  }
}

check('/404 is served with status 404', (await context.request.get(`${landingBase}/not-a-real-page`)).status() === 404);
check('all landing routes have no failed asset responses', failedResponses.length === 0, failedResponses.slice(0, 5).join(' | '));

// Assets: requested explicitly so missing images are caught even when lazy.
let missingAssets = 0;
for (const asset of landingAssets) {
  const response = await context.request.get(asset);
  if (!response.ok()) {
    missingAssets += 1;
    console.log(`  missing asset ${response.status()} ${asset}`);
  }
}
check(`all ${landingAssets.size} landing assets respond 200`, missingAssets === 0, `${missingAssets} missing`);

const robots = await getJson(await context.request.get(`${landingBase}/robots.txt`));
check('robots.txt exists', robots.status === 200);
check('robots.txt points to the sitemap', robots.text.includes(`${landingBase}/sitemap-index.xml`));
check('robots.txt disallows /gracias', robots.text.includes('Disallow: /gracias'));

const sitemapIndex = await getJson(await context.request.get(`${landingBase}/sitemap-index.xml`));
check('sitemap-index.xml exists', sitemapIndex.status === 200);
const sitemapUrls = [...sitemapIndex.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
check('sitemap index references a sitemap', sitemapUrls.length >= 1);
const allSitemapPages = [];
for (const sitemapUrl of sitemapUrls) {
  const sitemap = await getJson(await context.request.get(sitemapUrl));
  check(`sitemap ${sitemapUrl} exists`, sitemap.status === 200);
  allSitemapPages.push(...[...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
}
check('sitemap includes the home page', allSitemapPages.some((url) => new URL(url).pathname === '/'));
check('sitemap excludes /gracias', !allSitemapPages.some((url) => new URL(url).pathname === '/gracias'));
check('sitemap excludes /404', !allSitemapPages.some((url) => new URL(url).pathname === '/404'));
const missingSitemapPages = [];
for (const url of allSitemapPages) {
  const response = await context.request.get(url);
  if (!response.ok()) missingSitemapPages.push(`${response.status()} ${url}`);
}
check('every sitemap URL responds 200', missingSitemapPages.length === 0, missingSitemapPages.join(' | '));

// Open Graph and icon assets used by the landing.
const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content').catch(() => null);
check('home has an Open Graph image', Boolean(ogImage), ogImage ?? 'missing');
if (ogImage) {
  const response = await context.request.get(new URL(ogImage, landingBase).href);
  check('Open Graph image responds 200', response.ok(), String(response.status()));
}

// ---------- App: anonymous routes ----------
const anonymous = await browser.newContext({ locale: 'es-ES', timezoneId: 'Europe/Madrid' });
const anonPage = await anonymous.newPage();
let response = await anonPage.goto(`${appBase}/login`, { waitUntil: 'networkidle' });
check('app /login responds 200', response?.status() === 200, String(response?.status()));
check('app /login shows the login form', await anonPage.locator('#login-email').isVisible());
check(
  'app /login links to registration',
  (await anonPage.locator('a[href="/registro"]').count()) >= 1,
);

response = await anonPage.goto(`${appBase}/registro`, { waitUntil: 'networkidle' });
check('app /registro responds 200', response?.status() === 200, String(response?.status()));
check(
  'app /registro shows the registration form',
  await anonPage.locator('#register-name, input[name="name"]').first().isVisible().catch(() => false),
);

await anonPage.goto(`${appBase}/ruta-inexistente`, { waitUntil: 'networkidle' });
check(
  'app unknown route renders the 404 view',
  (await anonPage.getByRole('heading', { name: 'Esta página no existe' }).count()) === 1,
);

await anonPage.goto(`${appBase}/panel`, { waitUntil: 'networkidle' });
check(
  'anonymous /panel redirects to login',
  anonPage.url().includes('/login?redirect='),
  anonPage.url(),
);

// ---------- App: authenticated crawl ----------
await anonPage.locator('#login-email').fill('demo@agroshield.example');
await anonPage.locator('#login-password').fill(password);
await anonPage.getByRole('button', { name: 'Entrar' }).click();
await anonPage.waitForURL(/\/panel(\/|$)/, { timeout: 20_000 });
check('demo login reaches the panel', anonPage.url().endsWith('/panel'), anonPage.url());

const appRoutes = new Set(['/panel', '/panel/fincas', '/panel/alertas', '/panel/cuenta']);
const appQueue = [...appRoutes];
const visitedApp = new Set();
const appFailures = [];
while (appQueue.length > 0) {
  const pathname = appQueue.shift();
  if (visitedApp.has(pathname)) continue;
  visitedApp.add(pathname);
  const target = new URL(pathname, appBase);
  response = await anonPage.goto(target.href, { waitUntil: 'networkidle' });
  await anonPage.waitForTimeout(150);
  const bodyText = await anonPage.locator('body').innerText();
  const notFound = bodyText.includes('Esta página no existe') || bodyText.includes('No se pudo cargar');
  const heading = await anonPage.locator('h1').first().isVisible().catch(() => false);
  check(`app ${pathname} renders a heading`, heading, notFound ? 'not found/error text' : '');
  if (notFound) appFailures.push(pathname);
  const anchors = await anonPage.$$eval('a[href]', (elements) =>
    elements.map((element) => element.getAttribute('href')).filter(Boolean),
  );
  for (const href of anchors) {
    let link;
    try {
      link = new URL(href, appBase);
    } catch {
      continue;
    }
    if (link.origin !== new URL(appBase).origin) continue;
    if (!link.pathname.startsWith('/panel')) continue;
    const child = `${link.pathname}${link.search}`;
    if (!visitedApp.has(child) && !appQueue.includes(child)) appQueue.push(child);
  }
}
check('all linked app routes render without error state', appFailures.length === 0, appFailures.join(', '));

await anonPage.goto(
  `${appBase}/panel/fincas/00000000-0000-4000-8000-000000000000`,
  { waitUntil: 'networkidle' },
);
check(
  'invalid farm deep link fails honestly',
  (await anonPage.getByText('No se pudo cargar la finca.').count()) >= 1,
);

for (const link of appLinksFromLanding) {
  check(`landing app link ${link} resolves`, (await context.request.get(new URL(link, appBase).href)).ok());
}

await browser.close();

const report = {
  generatedAt: new Date().toISOString(),
  landingBase,
  appBase,
  checks,
  failures,
  counts: {
    checks: checks.length,
    failures: failures.length,
    landingPages: landingPages.size,
    landingAssets: landingAssets.size,
    landingFragments: [...landingFragments.values()].reduce((total, set) => total + set.size, 0),
    appRoutes: visitedApp.size,
    externalLinks: externalLinks.size,
    appLinksFromLanding: appLinksFromLanding.size,
  },
  landingPages: Object.fromEntries(landingPages),
  externalLinks: [...externalLinks].sort(),
  appLinksFromLanding: [...appLinksFromLanding].sort(),
};
await mkdir(join(root, 'docs', 'qa'), { recursive: true });
await writeFile(join(root, 'docs', 'qa', 'link-check.json'), JSON.stringify(report, null, 2));

console.log(`\n${checks.length - failures.length}/${checks.length} link checks passed.`);
console.log(`Landing pages: ${landingPages.size} · assets: ${landingAssets.size} · app routes: ${visitedApp.size}`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach((failure) => console.log(`  - ${failure}`));
  process.exitCode = 1;
}
