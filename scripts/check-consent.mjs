import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on('response', async (response) => {
  if (response.status() >= 400) {
    console.log('HTTP', response.status(), response.request().method(), response.url());
  }
});
page.on('console', (message) => {
  if (message.type() === 'error') {
    console.log('CONSOLE', message.text(), message.location());
  }
});

for (const path of ['/', '/demo', '/gracias', '/cookies', '/privacidad']) {
  console.log('---', path);
  await page.goto(`http://localhost:4321${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const banner = page.getByRole('button', { name: 'Rechazar' });
  if (await banner.count()) await banner.click().catch(() => undefined);
  await page.waitForTimeout(300);
}
await browser.close();
