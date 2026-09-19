#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const toolchainRoot = new URL('../', import.meta.url);
const inventory = JSON.parse(readFileSync(new URL('migration-inventory.json', toolchainRoot), 'utf8'));
const toolchain = JSON.parse(readFileSync(new URL('toolchain.json', toolchainRoot), 'utf8'));
const repository = resolve(process.env.DOMAIN_SPEC_REPOSITORY ?? '/workspace');
const enforce = process.argv.includes('--enforce');
const findings = [];

function readJson(relative) {
  return JSON.parse(readFileSync(resolve(repository, relative), 'utf8'));
}

function finding(code, path, detail) {
  findings.push({ code, path, detail });
}

for (const manifestPath of inventory.active_parent_manifests) {
  const absolute = resolve(repository, manifestPath);
  if (!existsSync(absolute)) {
    finding('MISSING_ACTIVE_MANIFEST', manifestPath, 'Declared active package manifest is absent.');
    continue;
  }
  const manifest = readJson(manifestPath);
  if (manifest.engines?.node !== toolchain.node.version) {
    finding('NODE_VERSION_DRIFT', manifestPath, `Expected engines.node=${toolchain.node.version}.`);
  }
  if (manifest.packageManager !== `pnpm@${toolchain.package_managers.pnpm}`) {
    finding('PACKAGE_MANAGER_DRIFT', manifestPath, `Expected packageManager=pnpm@${toolchain.package_managers.pnpm}.`);
  }
  const packageRoot = dirname(manifestPath);
  const npmLock = resolve(repository, packageRoot, 'package-lock.json');
  const pnpmLock = resolve(repository, packageRoot, 'pnpm-lock.yaml');
  if (existsSync(npmLock) && existsSync(pnpmLock)) {
    finding('DUAL_LOCK_AUTHORITY', packageRoot, 'Both npm and pnpm lockfiles are present.');
  }
  const scripts = Object.entries(manifest.scripts ?? {})
    .filter(([name]) => !name.startsWith('historical:') && !name.includes('legacy'))
    .map(([, command]) => command)
    .join('\n');
  if (/(^|[\s;&])(tsx|ts-node)([\s;&]|$)|node\s+--(?:import\s+tsx|experimental-strip-types)/m.test(scripts)) {
    finding('DIRECT_TYPESCRIPT_EXECUTION', manifestPath, 'Authoritative scripts still execute TypeScript directly.');
  }
}

for (const path of inventory.first_cleanup_paths) {
  if (existsSync(resolve(repository, path))) {
    finding('CHECKOUT_DEPENDENCY_INSTALL', path, 'Dependency installation remains in the checkout.');
  }
}

const result = {
  schema_version: 'domainspec.node-toolchain-doctor.v1',
  status: findings.length === 0 ? 'pass' : enforce ? 'fail' : 'report',
  enforce,
  repository,
  expected: {
    node: toolchain.node.version,
    pnpm: toolchain.package_managers.pnpm,
    typescript: toolchain.typescript
  },
  findings
};

console.log(JSON.stringify(result, null, 2));
if (enforce && findings.length > 0) process.exitCode = 1;
