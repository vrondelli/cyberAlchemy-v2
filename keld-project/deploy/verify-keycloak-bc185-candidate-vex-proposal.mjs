import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {basename, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const candidateTag = 'keld-keycloak:26.7.4-bc185-candidate-r2';
const digest = '603f818e915dfe80145608dfc22468fcc10b4751744b2bb79f63f42c427a927f';
const product = `pkg:oci/keld-keycloak@sha256:${digest}?arch=amd64&repository_url=index.docker.io%2Flibrary%2Fkeld-keycloak`;
const proposalName = 'keycloak-bc185-candidate-r2.openvex.proposed.json';
const expected = new Map([
  ['CVE-2026-75595', {
    status: 'not_affected',
    subcomponent: 'pkg:maven/io.netty/netty-handler@4.1.136.Final',
  }],
  ['CVE-2025-59250', {
    status: 'not_affected',
    subcomponent: 'pkg:maven/com.microsoft.sqlserver/mssql-jdbc@13.2.1',
  }],
  ['CVE-2026-22020', {
    status: 'under_investigation',
    subcomponent: 'pkg:rpm/redhat/java-21-openjdk-headless@21.0.12.1.1-1.2.el9?arch=x86_64&distro=redhat-9.8&epoch=1',
  }],
]);

export function verifyKeycloakCandidateVexProposal({
  proposalPath = join(here, proposalName),
  composePaths = [
    join(here, 'compose.yaml'),
    join(here, 'compose.staging-candidate.yaml'),
    join(here, 'compose.infrastructure.yaml'),
  ],
} = {}) {
  const vex = JSON.parse(readFileSync(proposalPath, 'utf8'));
  assert.equal(vex['@context'], 'https://openvex.dev/ns/v0.2.0', 'openvex-context-required');
  assert.match(vex['@id'] ?? '', /^urn:uuid:[0-9a-f-]{36}$/, 'document-uuid-required');
  assert.match(vex.role ?? '', /unapproved/i, 'unapproved-proposal-role-required');
  assert.equal(vex.version, 1, 'proposal-version-required');
  assert.equal(vex.statements?.length, expected.size, 'unexpected-proposal-statement-count');

  for (const statement of vex.statements) {
    const id = statement.vulnerability?.name;
    const wanted = expected.get(id);
    assert.ok(wanted, `unexpected-vulnerability:${id}`);
    assert.equal(statement.status, wanted.status, `unexpected-status:${id}`);
    assert.deepEqual(statement.products?.map(item => item['@id']), [product], `exact-candidate-product-required:${id}`);
    assert.deepEqual(
      statement.products?.[0]?.subcomponents?.map(item => item['@id']),
      [wanted.subcomponent],
      `exact-subcomponent-required:${id}`,
    );
    if (wanted.status === 'not_affected') {
      assert.equal(statement.justification, 'vulnerable_code_not_in_execute_path', `execute-path-justification-required:${id}`);
      assert.ok(statement.impact_statement?.length > 160, `impact-statement-required:${id}`);
      assert.match(statement.impact_statement, /Security-owner acceptance is still required\.$/, `owner-acceptance-boundary-required:${id}`);
    } else {
      assert.equal(statement.justification, undefined, `under-investigation-justification-forbidden:${id}`);
      assert.match(statement.status_notes ?? '', /raw High finding/, `raw-finding-preservation-required:${id}`);
      assert.match(statement.status_notes ?? '', /do not treat this proposal as a waiver/i, `waiver-boundary-required:${id}`);
    }
  }

  for (const composePath of composePaths) {
    const source = readFileSync(composePath, 'utf8');
    assert.ok(!source.includes(candidateTag), `candidate-must-remain-absent:${basename(composePath)}`);
    assert.ok(!source.includes(digest), `candidate-digest-must-remain-absent:${basename(composePath)}`);
    assert.ok(!source.includes(proposalName), `proposal-must-not-be-compose-input:${basename(composePath)}`);
  }

  const operationalFiles = readdirSync(here, {withFileTypes: true})
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .filter(name => /\.(?:sh|py|ya?ml|service|timer)$/.test(name))
    .filter(name => !name.startsWith('test_'));
  for (const name of operationalFiles) {
    const source = readFileSync(join(here, name), 'utf8');
    assert.ok(!source.includes(proposalName), `proposal-must-not-be-operational-input:${name}`);
  }

  return {
    ok: true,
    status: 'unapproved-proposal',
    product,
    statements: Object.fromEntries([...expected].map(([id, value]) => [id, value.status])),
    composePromotion: false,
    operationalConsumption: false,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    process.stdout.write(`${JSON.stringify(verifyKeycloakCandidateVexProposal())}\n`);
  } catch (error) {
    process.stderr.write(`${error?.message ?? 'keycloak-candidate-vex-proposal-verification-failed'}\n`);
    process.exitCode = 1;
  }
}
