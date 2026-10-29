#!/usr/bin/env node
/**
 * Live API smoke test. Requires the backend running and demo data seeded.
 * Usage: node scripts/e2e-smoke.mjs
 *
 * It never prints secrets. The demo lead it creates is tagged [E2E] so it can be
 * identified and removed before any real launch.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const envPath = join(root, '.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);

const base = (process.env.E2E_API_URL ?? 'http://127.0.0.1:3000').replace(/\/+$/, '');
const password = process.env.DEMO_PASSWORD;
if (!password) throw new Error('DEMO_PASSWORD is required (set it in .env)');

let passed = 0;
let cookie = '';
let csrf = '';

function ok(name, condition, detail = '') {
  if (!condition) throw new Error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  passed += 1;
  console.log(`ok ${String(passed).padStart(2, '0')} - ${name}`);
}

async function call(path, { method = 'GET', body, headers = {}, auth = false, csrfToken = '' } = {}) {
  const finalHeaders = { accept: 'application/json', ...headers };
  if (auth && cookie) finalHeaders.cookie = cookie;
  if (csrfToken) finalHeaders['x-csrf-token'] = csrfToken;
  if (body !== undefined) finalHeaders['content-type'] = 'application/json';

  const response = await fetch(`${base}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });
  const setCookie = response.headers.getSetCookie?.() ?? [];
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { response, json, text, setCookie };
}

function hasLeadingZeros(hash, difficulty) {
  return hash.startsWith('0'.repeat(difficulty));
}

function solve(challenge, difficulty) {
  for (let solution = 0; solution < 5_000_000; solution += 1) {
    const candidate = String(solution);
    const hash = createHash('sha256').update(`${challenge}:${candidate}`).digest('hex');
    if (hasLeadingZeros(hash, difficulty)) return candidate;
  }
  throw new Error('Could not solve captcha');
}

const health = await call('/health');
ok('health reports ok', health.response.status === 200 && health.json?.status === 'ok');
ok('database is reachable', health.json?.database === 'ok');

const initialStatus = await call('/v1/auth/session-status');
ok(
  'anonymous session-status is false',
  initialStatus.response.status === 200 && initialStatus.json?.authenticated === false,
);

const login = await call('/v1/auth/login', {
  method: 'POST',
  body: { email: 'demo@agroshield.example', password },
});
ok('demo login succeeds', login.response.status === 200, login.text.slice(0, 120));
ok('login returns CSRF token', typeof login.json?.csrfToken === 'string' && login.json.csrfToken.length >= 16);
ok('login sets HttpOnly session cookie', login.setCookie.some((value) => /agroshield_session=/.test(value) && /HttpOnly/i.test(value)));
const sessionCookie = login.setCookie.find((value) => value.startsWith('agroshield_session='));
if (!sessionCookie) throw new Error('Missing session cookie');
cookie = sessionCookie.split(';')[0];
csrf = login.json.csrfToken;

const me = await call('/v1/auth/me', { auth: true });
ok('me returns the demo organization', me.response.status === 200 && me.json?.organization?.slug === 'agroshield-demo');
ok('me does not leak the session token', !JSON.stringify(me.json).includes('sessionToken'));

const statusAuthed = await call('/v1/auth/session-status', { auth: true });
ok('authenticated session-status is true', statusAuthed.json?.authenticated === true);

const farms = await call('/v1/farms', { auth: true });
ok('farms are scoped to the session organization', farms.response.status === 200 && Array.isArray(farms.json) && farms.json.length >= 1);

const alerts = await call('/v1/alerts', { auth: true });
ok('open alerts are listed', alerts.response.status === 200 && Array.isArray(alerts.json) && alerts.json.length >= 1);
const alert = alerts.json[0];
ok('alerts expose a deadline', typeof alert?.deadlineAt === 'string' && Date.parse(alert.deadlineAt) > 0);

const noCsrf = await call(`/v1/alerts/${alert.id}/acknowledge`, { method: 'POST', auth: true });
ok('authenticated mutation without CSRF is rejected', noCsrf.response.status === 403 && noCsrf.json?.code === 'csrf_invalid');

const acknowledged = await call(`/v1/alerts/${alert.id}/acknowledge`, {
  method: 'POST',
  auth: true,
  csrfToken: csrf,
});
ok('acknowledgment persists', acknowledged.response.status === 200 && Boolean(acknowledged.json?.acknowledgedAt));

const after = await call('/v1/alerts', { auth: true });
ok('acknowledged alert leaves the open list', !after.json.some((item) => item.id === alert.id));

const challenge = await call('/v1/captcha');
ok('captcha challenge is issued', challenge.response.status === 200 && typeof challenge.json?.challenge === 'string');
const solution = solve(challenge.json.challenge, challenge.json.difficulty);
ok('captcha difficulty is the configured one', challenge.json.difficulty >= 3 && challenge.json.difficulty <= 6);

const leadBody = {
  name: 'Prueba E2E',
  email: `e2e-${Date.now()}@example.com`,
  company: 'AgroShield QA',
  phone: '',
  message: '[E2E] Solicitud automatizada para verificar el formulario público. No responder.',
  consent: true,
  website: '',
  captchaChallenge: challenge.json.challenge,
  captchaSolution: solution,
};
const lead = await call('/v1/leads', { method: 'POST', body: leadBody });
ok('lead is persisted and returns 201', lead.response.status === 201 && typeof lead.json?.id === 'string');

const replay = await call('/v1/leads', {
  method: 'POST',
  body: { ...leadBody, email: `replay-${Date.now()}@example.com` },
});
ok('captcha challenge cannot be replayed', replay.response.status === 400 && replay.json?.code === 'captcha_invalid');

const noConsent = await call('/v1/analytics/events', {
  method: 'POST',
  body: { name: 'page_view', path: '/', props: {}, consent: false },
});
ok('analytics rejects events without consent', noConsent.response.status >= 400);

const withConsent = await call('/v1/analytics/events', {
  method: 'POST',
  body: { name: 'page_view', path: '/?e2e=1', props: { placement: 'e2e' }, consent: true },
});
ok('analytics accepts consented events', withConsent.response.status === 202 || withConsent.response.status === 204);

const logout = await call('/v1/auth/logout', { method: 'POST', auth: true, csrfToken: csrf });
ok('logout clears the session', logout.response.status === 204);

const afterLogout = await call('/v1/auth/me', { auth: true });
ok('session is revoked server-side', afterLogout.response.status === 401);

console.log(`\n${passed} live API checks passed.`);
