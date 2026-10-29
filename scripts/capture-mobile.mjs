import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const out = 'docs/design/evidencia/mobile-review';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 320, height: 800 } });
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
const reject = page.getByRole('button', { name: 'Rechazar' });
await reject.click({ timeout: 5_000 }).catch(() => undefined);
await page.waitForTimeout(300);

const sections = ['top', 'como-funciona', 'capacidades', '.showcase', 'acerca', 'preguntas', 'contacto'];
for (const id of sections) {
  if (id === 'top') {
    await page.evaluate(() => window.scrollTo(0, 0));
  } else {
    await page.locator(id.startsWith('.') ? id : `#${id}`).scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(200);
  const name = id.replace(/^[.#]/, '');
  await page.screenshot({ path: `${out}/${name}.png` });
}
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/footer.png` });
await browser.close();
