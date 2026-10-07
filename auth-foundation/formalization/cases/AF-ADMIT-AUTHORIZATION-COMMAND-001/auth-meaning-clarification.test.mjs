import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { currentCandidate, validateCandidate } from './auth-meaning-clarification.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
const read = name => JSON.parse(readFileSync(`${here}${name}`, 'utf8'));
const pair = () => [read('AUTH-MEANING-CLARIFICATION.v1-candidate.json'), read('BUSINESS-MEANING.v1-clarified-candidate.json')];
const rejects = (mutate, error) => {
  const [clarification, meaning] = pair();
  mutate(clarification, meaning);
  assert.throws(() => validateCandidate(clarification, meaning), error);
};

test('digest-bound candidate is current, draft, and unaccepted', () => {
  const result = currentCandidate();
  assert.equal(result.status, 'candidate-valid');
  assert.equal(result.acceptance, 'not-requested');
  assert.equal(result.all_context_preservation_proven, false);
});
test('rejects admitted source-ref drift', () => rejects(c => { c.source_refs.definitions.sha256 = '0'.repeat(64); }, /source-ref:definitions/));
test('rejects typed rule-ref drift', () => rejects(c => { c.source_refs.v2_provenance_rule.sha256 = '0'.repeat(64); }, /source-ref:v2_provenance_rule/));
test('rejects dropped auth qualifier', () => rejects(c => { c.proposed_ready_predicate.authentication_qualifier.pop(); }, /predicate/));
test('rejects dropped route qualifier', () => rejects(c => { c.proposed_ready_predicate.route_qualifier.pop(); }, /predicate/));
test('rejects missing blank-ID condition in meaning', () => rejects((c, m) => { m.rule = m.rule.replace('the inbound request_id is nonempty; ', ''); }, /meaning-identity-or-rule/));
test('rejects implicit acceptance', () => rejects((c, m) => { m.acceptance.status = 'accepted'; }, /meaning-identity-or-rule/));
test('rejects predecessor identity drift', () => rejects((c, m) => { m.supersedes = null; }, /meaning-identity-or-rule/));
test('rejects an altered READY example instead of borrowing the disk receipt', () =>
  rejects((c, m) => { m.examples[0].then = 'DENY is returned.'; }, /candidate-subject-drift/));
test('receipt digests bind the exact validated candidate files', () => {
  const result = currentCandidate();
  const sha = name => createHash('sha256').update(readFileSync(`${here}${name}`)).digest('hex');
  assert.equal(result.clarification_sha256, sha('AUTH-MEANING-CLARIFICATION.v1-candidate.json'));
  assert.equal(result.meaning_sha256, sha('BUSINESS-MEANING.v1-clarified-candidate.json'));
});
