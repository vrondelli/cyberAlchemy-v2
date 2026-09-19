import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const digest = '82a77884f3af238beab1e7afd63b5f530e1b5c0590bd7aa60b40a40463e29b2c';
const image = `quay.io/keycloak/keycloak:26.7.4@sha256:${digest}`;
const product = `pkg:oci/keycloak@sha256:${digest}?arch=amd64&repository_url=quay.io%2Fkeycloak%2Fkeycloak`;
const expected = new Map([
  ['CVE-2026-75595', 'pkg:maven/io.netty/netty-handler@4.1.136.Final'],
  ['CVE-2025-59250', 'pkg:maven/com.microsoft.sqlserver/mssql-jdbc@13.2.1'],
]);
const composeEnvironment = {
  ...process.env,
  KELD_DOMAIN: 'shop.example.test',
  AUTH_DOMAIN: 'auth.example.test',
  ARE_EDGE_IMAGE: `registry.example/are-edge@sha256:${'1'.repeat(64)}`,
  ARE_PUBLIC_CHAT_IMAGE: `registry.example/are-chat@sha256:${'2'.repeat(64)}`,
  ARE_INFERENCE_BROKER_IMAGE: `registry.example/are-broker@sha256:${'3'.repeat(64)}`,
  ARE_PROVIDER_GATEWAY_IMAGE: `registry.example/are-gateway@sha256:${'4'.repeat(64)}`,
  ARE_CHAT_IDLE_RETENTION_SECONDS: '300',
  ARE_BROKER_HOURLY_MICROUSD_LIMIT: '500000',
  ARE_BROKER_MONTHLY_MICROUSD_LIMIT: '5000000',
  ARE_PROVIDER_INPUT_MICROUSD_PER_MILLION_TOKENS: '200000',
  ARE_PROVIDER_OUTPUT_MICROUSD_PER_MILLION_TOKENS: '1000000',
};

export function verifyKeycloakVex({
  composePath = join(here, 'compose.yaml'),
  caddyPath = join(here, 'Caddyfile'),
  vexPath = join(here, 'keycloak-26.7.4.openvex.json'),
} = {}) {
  const rendered = JSON.parse(execFileSync('docker', [
    'compose', '-f', composePath, 'config', '--format', 'json',
  ], {encoding: 'utf8', env: composeEnvironment}));
  const service = rendered.services?.keycloak;
  assert.ok(service, 'keycloak-service-required');
  assert.equal(service.image, image, 'keycloak-image-digest-changed');
  assert.equal(service.environment?.KC_DB, 'postgres', 'postgres-backend-required');
  assert.match(service.environment?.KC_DB_URL ?? '', /^jdbc:postgresql:\/\//, 'postgres-url-required');
  assert.equal(service.environment?.KC_HTTP_ENABLED, 'true', 'keycloak-http-only-required');
  assert.equal(service.ports ?? null, null, 'keycloak-host-port-forbidden');
  assert.notEqual(service.network_mode, 'host', 'keycloak-host-network-forbidden');
  assert.ok(!Object.keys(service.environment ?? {}).some(key => key.startsWith('KC_HTTPS_')), 'keycloak-https-configuration-forbidden');

  const caddy = readFileSync(caddyPath, 'utf8');
  assert.match(caddy, /reverse_proxy\s+keycloak:8080(?:\s|$)/, 'caddy-http-keycloak-upstream-required');
  assert.doesNotMatch(caddy, /reverse_proxy\s+https:\/\/keycloak(?::8080)?(?:\s|$)/, 'caddy-tls-keycloak-upstream-forbidden');

  const vex = JSON.parse(readFileSync(vexPath, 'utf8'));
  assert.equal(vex['@context'], 'https://openvex.dev/ns/v0.2.0', 'openvex-context-required');
  assert.equal(vex.version, 1, 'openvex-version-required');
  assert.equal(vex.statements?.length, expected.size, 'unexpected-vex-statement-count');
  for (const statement of vex.statements) {
    const id = statement.vulnerability?.name;
    assert.ok(expected.has(id), `unexpected-vulnerability:${id}`);
    assert.equal(statement.status, 'not_affected', `not-affected-required:${id}`);
    assert.equal(statement.justification, 'vulnerable_code_not_in_execute_path', `execute-path-justification-required:${id}`);
    assert.ok(statement.impact_statement?.length > 80, `impact-statement-required:${id}`);
    assert.deepEqual(statement.products?.map(item => item['@id']), [product], `exact-image-product-required:${id}`);
    assert.deepEqual(statement.products?.[0]?.subcomponents?.map(item => item['@id']), [expected.get(id)], `exact-subcomponent-required:${id}`);
  }
  return {ok: true, image, product, statements: [...expected.keys()]};
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    process.stdout.write(`${JSON.stringify(verifyKeycloakVex())}\n`);
  } catch (error) {
    process.stderr.write(`${error?.message ?? 'keycloak-vex-verification-failed'}\n`);
    process.exitCode = 1;
  }
}
