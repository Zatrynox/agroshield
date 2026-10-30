#!/usr/bin/env node
/**
 * Container vulnerability and secret scans, using pinned images.
 *
 *   node scripts/scan.mjs secrets
 *   node scripts/scan.mjs images
 *   node scripts/scan.mjs all
 *
 * Requires Docker. Exits non-zero on findings so it is safe to use in CI.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const gitleaksImage =
  'zricethezav/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f';
const trivyImage =
  'aquasec/trivy:0.76.1@sha256:790fd66d1697395d8693d1acaa1ea702406a20f109b6fc7bac8db623eca6c06c';

function run(args) {
  console.log(`\n> docker ${args.join(' ')}`);
  const result = spawnSync('docker', args, { stdio: 'inherit', shell: false });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function requireDocker() {
  const result = spawnSync('docker', ['--version'], { stdio: 'ignore', shell: false });
  if (result.status !== 0) {
    console.error('Docker is required for scans. Start Docker Desktop and retry.');
    process.exit(1);
  }
}

function trackedSnapshot() {
  const listed = spawnSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: root, encoding: 'buffer' },
  );
  if (listed.error) throw listed.error;
  if (listed.status !== 0) throw new Error('git ls-files failed while preparing the secret scan.');

  const snapshot = mkdtempSync(join(tmpdir(), 'agroshield-gitleaks-'));
  process.on('exit', () => rmSync(snapshot, { recursive: true, force: true }));

  for (const relative of listed.stdout.toString('utf8').split('\0').filter(Boolean)) {
    const source = resolve(root, relative);
    if (!existsSync(source) || !statSync(source).isFile()) continue;
    const target = resolve(snapshot, relative);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }
  return snapshot;
}

function scanSecrets() {
  // Scan a snapshot of tracked plus untracked-but-not-ignored files. A plain
  // `--no-git` scan also reads local runtime data such as backend/.data keys,
  // which are gitignored and must never be mistaken for committed secrets.
  const snapshot = trackedSnapshot();
  run([
    'run',
    '--rm',
    '-v',
    `${snapshot}:/repo`,
    '-w',
    '/repo',
    gitleaksImage,
    'detect',
    '--source',
    '/repo',
    '--no-git',
    '--config',
    '/repo/.gitleaks.toml',
    '--redact',
    '--verbose',
  ]);
}

function scanSecretsHistory() {
  run([
    'run',
    '--rm',
    '-v',
    `${root}:/repo`,
    '-w',
    '/repo',
    gitleaksImage,
    'detect',
    '--source',
    '/repo',
    '--config',
    '/repo/.gitleaks.toml',
    '--redact',
    '--verbose',
  ]);
}

function scanImage(name) {
  run([
    'run',
    '--rm',
    '-v',
    '/var/run/docker.sock:/var/run/docker.sock',
    '-v',
    'agroshield-trivy-cache:/root/.cache/trivy',
    trivyImage,
    'image',
    '--quiet',
    '--scanners',
    'vuln',
    '--severity',
    'HIGH,CRITICAL',
    '--ignore-unfixed',
    '--exit-code',
    '1',
    name,
  ]);
}

function scanImages() {
  for (const image of ['agroshield-backend:local', 'agroshield-web:local']) {
    scanImage(image);
  }
}

const command = process.argv[2];
if (!['secrets', 'images', 'all'].includes(command)) {
  console.error('Usage: node scripts/scan.mjs <secrets|images|all>');
  process.exit(1);
}

requireDocker();
if (command === 'secrets' || command === 'all') {
  scanSecrets();
  scanSecretsHistory();
}
if (command === 'images' || command === 'all') scanImages();
