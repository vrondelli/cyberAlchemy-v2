import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {verifyProductionInputs} from './verify-production-inputs.mjs';

const verifier = fileURLToPath(new URL('./verify-production-inputs.mjs', import.meta.url));
const compose = fileURLToPath(new URL('./compose.yaml', import.meta.url));
const digest = digit => digit.repeat(64);
const valid = () => ({
  ARE_EDGE_IMAGE: `registry.example/are-edge@sha256:${digest('1')}`,
  ARE_PUBLIC_CHAT_IMAGE: `registry.example/are-chat:v1@sha256:${digest('2')}`,
  ARE_INFERENCE_BROKER_IMAGE: `registry.example:5443/team/are-broker@sha256:${digest('3')}`,
  ARE_PROVIDER_GATEWAY_IMAGE: `registry.example/are-gateway@sha256:${digest('4')}`,
  ARE_CHAT_IDLE_RETENTION_SECONDS: '9007199254740',
  ARE_BROKER_HOURLY_MICROUSD_LIMIT: '1000000000000',
  ARE_BROKER_MONTHLY_MICROUSD_LIMIT: '1000000000000',
  ARE_PROVIDER_INPUT_MICROUSD_PER_MILLION_TOKENS: '1000000000',
  ARE_PROVIDER_OUTPUT_MICROUSD_PER_MILLION_TOKENS: '1000000000',
});

test('accepts digest-pinned role images and numeric boundary values without returning values', () => {
  assert.deepEqual(verifyProductionInputs(valid()), {
    ok: true,
    image_references: 'digest-pinned',
    distinct_image_digests: 4,
    numeric_inputs: 'valid-positive-integers',
    values_printed: false,
  });
});

test('rejects mutable, ambiguous, malformed, or non-lowercase image digests', () => {
  const invalid = [
    'registry.example/are-edge:latest',
    `https://registry.example/are-edge@sha256:${digest('1')}`,
    `registry.example/are edge@sha256:${digest('1')}`,
    `registry.example/are-edge@@sha256:${digest('1')}`,
    `registry.example/are-edge@sha256:${digest('A')}`,
    `registry.example/are-edge@sha256:${'1'.repeat(63)}`,
    `sha256:${digest('1')}`,
  ];
  for (const value of invalid) {
    const environment = valid();
    environment.ARE_EDGE_IMAGE = value;
    assert.throws(() => verifyProductionInputs(environment), /are_edge_image-digest-reference-required/);
  }
});

test('requires four content-distinct role images', () => {
  const environment = valid();
  environment.ARE_PUBLIC_CHAT_IMAGE = `another.example/chat@sha256:${digest('1')}`;
  assert.throws(() => verifyProductionInputs(environment), /distinct-role-image-digests-required/);
});

test('rejects missing and non-canonical positive integers', () => {
  for (const value of [undefined, '', '0', '-1', '01', '1.0', '1e3', ' 1', '1 ']) {
    const environment = valid();
    if (value === undefined) delete environment.ARE_BROKER_HOURLY_MICROUSD_LIMIT;
    else environment.ARE_BROKER_HOURLY_MICROUSD_LIMIT = value;
    assert.throws(() => verifyProductionInputs(environment), /positive-integer-required/);
  }
});

test('rejects values above the implementation bounds', () => {
  const cases = [
    ['ARE_CHAT_IDLE_RETENTION_SECONDS', '9007199254741'],
    ['ARE_BROKER_HOURLY_MICROUSD_LIMIT', '1000000000001'],
    ['ARE_BROKER_MONTHLY_MICROUSD_LIMIT', '1000000000001'],
    ['ARE_PROVIDER_INPUT_MICROUSD_PER_MILLION_TOKENS', '1000000001'],
    ['ARE_PROVIDER_OUTPUT_MICROUSD_PER_MILLION_TOKENS', '1000000001'],
  ];
  for (const [name, value] of cases) {
    const environment = valid();
    environment[name] = value;
    assert.throws(() => verifyProductionInputs(environment), new RegExp(`${name.toLowerCase()}-out-of-range`));
  }
});

test('CLI emits only sanitized success metadata and field-scoped failures', () => {
  const environment = {...process.env, ...valid(), SENTINEL_SECRET: 'never-print-this-sentinel'};
  const success = spawnSync(process.execPath, [verifier], {env: environment, encoding: 'utf8'});
  assert.equal(success.status, 0, success.stderr);
  assert.doesNotMatch(success.stdout + success.stderr, /never-print-this-sentinel|registry\.example|9007199254740/);
  assert.equal(JSON.parse(success.stdout).values_printed, false);

  environment.ARE_EDGE_IMAGE = 'private-value:latest';
  const failure = spawnSync(process.execPath, [verifier], {env: environment, encoding: 'utf8'});
  assert.equal(failure.status, 1);
  assert.match(failure.stderr, /production-input-are_edge_image-digest-reference-required/);
  assert.doesNotMatch(failure.stdout + failure.stderr, /private-value/);
});

test('ordinary Compose startup makes the hardened preflight a direct ARE dependency', () => {
  const environment = {
    ...process.env,
    ...valid(),
    KELD_DOMAIN: 'shop.example.test',
    AUTH_DOMAIN: 'auth.example.test',
    ARE_DOMAIN: 'are.example.test',
    ACME_EMAIL: 'test@example.test',
    KELD_VERSION: 'candidate',
  };
  const rendered = JSON.parse(execFileSync('docker', [
    'compose', '-f', compose, 'config', '--format', 'json',
  ], {env: environment, encoding: 'utf8'}));
  const preflight = rendered.services?.['are-production-inputs'];
  assert.ok(preflight, 'production-input-preflight-service-required');
  assert.deepEqual(preflight.command, ['node', '/opt/keld/verify-production-inputs.mjs']);
  assert.equal(preflight.user, '10001:10001');
  assert.equal(preflight.read_only, true);
  assert.deepEqual(preflight.cap_drop, ['ALL']);
  assert.ok(preflight.security_opt.includes('no-new-privileges:true'));
  assert.equal(preflight.network_mode, 'none');
  assert.equal(preflight.restart, 'no');
  assert.equal(preflight.ports ?? null, null);
  assert.equal(preflight.secrets ?? null, null);
  assert.equal(preflight.volumes.length, 1);
  assert.equal(preflight.volumes[0].target, '/opt/keld/verify-production-inputs.mjs');
  assert.equal(preflight.volumes[0].read_only, true);
  for (const name of ['are-edge', 'are-public-chat', 'are-inference-broker', 'are-provider-gateway']) {
    assert.equal(rendered.services[name].depends_on['are-production-inputs'].condition, 'service_completed_successfully');
    assert.equal(rendered.services[name].depends_on['are-production-inputs'].required, true);
  }
});
