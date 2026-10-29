#!/usr/bin/env node
/**
 * Cross-platform Docker Compose entry points.
 *
 * The Makefile and package.json scripts call this file so Windows, macOS and
 * Linux use the same commands. Docker is required; this script never pretends a
 * stack is running when it is not.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const localFile = 'compose.yaml';
const devFile = 'compose.dev.yaml';
const prodFile = 'compose.prod.yaml';
const prodEnv = 'infra/env/prod.env';

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

function dockerAvailable() {
  const result = spawnSync('docker', ['--version'], { stdio: 'ignore', shell: false });
  return result.status === 0;
}

function composeAvailable() {
  const result = spawnSync('docker', ['compose', 'version'], { stdio: 'ignore', shell: false });
  return result.status === 0;
}

function run(args, options = {}) {
  console.log(`\n> docker ${args.join(' ')}`);
  const result = spawnSync('docker', args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...options.env },
    shell: false,
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function compose(file, args, extra = []) {
  run(['compose', ...extra, '-f', file, ...args]);
}

function requireDocker() {
  if (!dockerAvailable()) {
    fail(
      'Docker is not installed or the daemon is not running. Start Docker Desktop and retry.\n' +
        'This repository cannot verify containers without Docker.',
    );
  }
  if (!composeAvailable()) {
    fail('The Docker Compose v2 plugin is missing (`docker compose version` failed).');
  }
}

function requireProdEnv() {
  if (!existsSync(resolve(root, prodEnv))) {
    fail(
      `Missing ${prodEnv}.\n` +
        'Copy infra/env/prod.env.example, fill every required value, then retry.\n' +
        'Never commit the filled file.',
    );
  }
}

const commands = {
  'local:up': () => compose(localFile, ['up', '-d', '--build']),
  'local:down': () => compose(localFile, ['down', '--remove-orphans']),
  'local:reset': () => compose(localFile, ['down', '--remove-orphans', '--volumes']),
  'local:logs': () => compose(localFile, ['logs', '-f', '--tail=200']),
  'local:ps': () => compose(localFile, ['ps']),
  'local:seed': () => compose(localFile, ['run', '--rm', 'seed']),
  'local:simulate': () => compose(localFile, ['--profile', 'tools', 'run', '--rm', 'simulator']),

  'dev:up': () => compose(devFile, ['up', '--build']),
  'dev:start': () => compose(devFile, ['up', '-d', '--build']),
  'dev:down': () => compose(devFile, ['down', '--remove-orphans']),
  'dev:reset': () => compose(devFile, ['down', '--remove-orphans', '--volumes']),
  'dev:logs': () => compose(devFile, ['logs', '-f', '--tail=200']),
  'dev:seed': () =>
    compose(devFile, [
      'exec',
      'backend',
      'pnpm',
      '--filter',
      '@agroshield/backend',
      'exec',
      'tsx',
      'src/tools/seed.ts',
    ]),

  'prod:up': () => {
    requireProdEnv();
    compose(prodFile, ['up', '-d', '--build'], ['--env-file', prodEnv]);
  },
  'prod:down': () => {
    requireProdEnv();
    compose(prodFile, ['down', '--remove-orphans'], ['--env-file', prodEnv]);
  },
  'prod:logs': () => {
    requireProdEnv();
    compose(prodFile, ['logs', '-f', '--tail=200'], ['--env-file', prodEnv]);
  },
  'prod:ps': () => {
    requireProdEnv();
    compose(prodFile, ['ps'], ['--env-file', prodEnv]);
  },
  'prod:config': () => {
    requireProdEnv();
    compose(prodFile, ['config', '-q'], ['--env-file', prodEnv]);
  },

  'config:local': () => compose(localFile, ['config', '-q']),
  'config:dev': () => compose(devFile, ['config', '-q']),

  verify: () => {
    run(['run', '--rm', 'hello-world']);
    compose(localFile, ['config', '-q']);
    compose(devFile, ['config', '-q']);
    requireProdEnv();
    compose(prodFile, ['config', '-q'], ['--env-file', prodEnv]);
    console.log('\nDocker is working and every Compose file parses.');
  },
};

const command = process.argv[2];
if (!command || !commands[command]) {
  console.error(
    'Usage: node scripts/stack.mjs <command>\n\n' +
      Object.keys(commands)
        .map((name) => `  ${name}`)
        .join('\n'),
  );
  process.exit(command ? 1 : 0);
}

if (command === 'verify' || command.startsWith('local:') || command.startsWith('prod:')) {
  requireDocker();
}
if (command.startsWith('dev:')) {
  requireDocker();
}

commands[command]();
