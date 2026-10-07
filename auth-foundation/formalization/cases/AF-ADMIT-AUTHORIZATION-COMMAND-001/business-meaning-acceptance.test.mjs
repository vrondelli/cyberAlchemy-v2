import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const here = fileURLToPath(new URL('./', import.meta.url));
const draftPath = new URL('./BUSINESS-MEANING.v1-clarified-candidate.json', import.meta.url);
const acceptedPath = new URL('./BUSINESS-MEANING.v1-clarified-accepted.json', import.meta.url);
const decisionPath = new URL('../../decisions/AF-ADMIT-AUTHORIZATION-COMMAND-001/business-meaning-v1-clarified-acceptance.json', import.meta.url);
const schemaRoot = fileURLToPath(new URL('../../../../craft/projects/domainspec-v2/formalization/schemas/', import.meta.url));
const expectedDraftSha = '81c7e1620bea64bf75f3da8bedc79ac795e896c7050c58ab098f54f737194019';
const expectedDraftSize = 5717;
const selectedDecisionRef = 'auth-foundation/formalization/decisions/AF-ADMIT-AUTHORIZATION-COMMAND-001/business-meaning-v1-clarified-acceptance.json';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` :
  value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` :
  JSON.stringify(value);
const copy = value => JSON.parse(JSON.stringify(value));
const read = path => JSON.parse(readFileSync(path, 'utf8'));

const semanticFields = ['schema_version', 'meaning_id', 'owner', 'supersedes', 'domain_context',
  'rule', 'applies_when', 'actors', 'inputs', 'outcomes', 'examples', 'counterexamples',
  'boundaries', 'authority_effect'];

function verify(draft, accepted, decision, decisionBytes) {
  for (const key of semanticFields) assert.deepEqual(accepted[key], draft[key], `semantic field changed: ${key}`);
  assert.equal(draft.status, 'draft');
  assert.equal(accepted.status, 'accepted');
  assert.equal(accepted.version, '1-clarified-accepted');
  assert.equal(accepted.acceptance.status, 'accepted');
  assert.equal(accepted.acceptance.owner_ref, accepted.owner);
  assert.equal(accepted.acceptance.acceptance_ref, selectedDecisionRef);
  assert.equal(accepted.acceptance.acceptance_digest, sha(decisionBytes));
  assert.equal(decision.schema_version, 'domainspec-v2.business-acceptance-decision/v1-candidate');
  assert.equal(decision.owner, accepted.owner);
  assert.equal(decision.outcome, 'accepted');
  assert.equal(decision.authority_effect, 'none');
  assert.equal(decision.subject.meaning_id, accepted.meaning_id);
  assert.equal(decision.subject.version, accepted.version);
  assert.equal(decision.subject.canonicalization, 'domainspec-json-keysort-excluding-acceptance-v1');
  assert.equal(decision.subject.digest_algorithm, 'sha256');
  const subject = copy(accepted); delete subject.acceptance;
  assert.equal(decision.subject.digest, sha(canonical(subject)));
  assert.match(accepted.claim_ceiling, /does not admit a FormalClaim/);
}

test('owner-accepted Auth meaning exactly preserves the selected draft semantics and binds a schema-valid decision', () => {
  const draftBytes = readFileSync(draftPath);
  assert.equal(draftBytes.length, expectedDraftSize);
  assert.equal(sha(draftBytes), expectedDraftSha);
  const draft = read(draftPath), accepted = read(acceptedPath);
  const decisionBytes = readFileSync(decisionPath), decision = read(decisionPath);
  verify(draft, accepted, decision, decisionBytes);
  const result = spawnSync('python3', ['-c', `import json,sys,pathlib,jsonschema
root=pathlib.Path(sys.argv[1]); value=json.load(sys.stdin)
for key,name in [('accepted','business-meaning.schema.json'),('decision','business-acceptance-decision.v1-candidate.schema.json')]:
    schema=json.loads((root/name).read_text())
    jsonschema.Draft202012Validator(schema).validate(value[key])`, schemaRoot], {
    input: JSON.stringify({ accepted, decision }), encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 0, `${result.error?.message ?? ''}\n${result.stderr}`);
});

test('wrong meaning, owner, outcome, subject or selected decision bytes cannot satisfy the binding', () => {
  const draft = read(draftPath), accepted = read(acceptedPath);
  const decisionBytes = readFileSync(decisionPath), decision = read(decisionPath);
  const changes = [
    [a => { a.rule += ' OR otherwise READY'; }, d => d],
    [a => a, d => { d.owner = 'different-owner'; }],
    [a => a, d => { d.outcome = 'rejected'; }],
    [a => a, d => { d.subject.digest = '0'.repeat(64); }],
    [a => { a.acceptance.acceptance_digest = '0'.repeat(64); }, d => d],
  ];
  for (const [changeMeaning, changeDecision] of changes) {
    const a = copy(accepted), d = copy(decision);
    changeMeaning(a); changeDecision(d);
    assert.throws(() => verify(draft, a, d, decisionBytes));
  }
});
