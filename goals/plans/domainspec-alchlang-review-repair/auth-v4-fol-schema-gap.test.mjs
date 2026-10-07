import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const schemaPath = fileURLToPath(new URL('../../../craft/projects/domainspec-v2/formalization/schemas/formal-claim-source-v4-candidate.schema.json', import.meta.url));
const exact = { path: 'candidate.json', sha256: 'a'.repeat(64), size_bytes: 1, current: true };
const candidate = {
  schema_version: 'domainspec-v2.formal-claim-source/v4-candidate',
  claim: { claim_id: 'FormalClaim:gap', claim_version: '1', owner: 'gap-probe', currentness: 'current', supersedes: null,
    identity_algorithm_ref: exact, identity_inputs_digest: 'a'.repeat(64) },
  business_meaning_ref: exact, business_acceptance_ref: exact,
  definition_binding_ref: exact, formal_language_profile_ref: exact,
  formal_signature: { sorts: [{ name: 'Context' }], functions: [], predicates: [], constants: [] },
  canonical_proposition: { representation_media_type: 'text/vnd.domainspec.fol-core', representation: '',
    representation_digest: 'a'.repeat(64), semantic_identity: 'gap-probe',
    semantic_identity_digest: 'a'.repeat(64), identity_algorithm_ref: exact },
  interpretation_boundary: { interpretation_model_is_part_of_claim: false, join_stage: 'external-evaluation-context' },
  source_authority_count: 1,
  tde_compatibility: { current_intake_contract: 'FormalClaimSourcePayload/v2', status: 'adapter-required', v2_projection_ref: null },
  claim_ceiling: 'schema-level gap probe only', authority_effect: 'none',
};

test('current v4 schema alone accepts undeclared symbols and non-formula text', () => {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  for (const representation of ['forall c:Context. Undeclared(c)', 'not a formula at all']) {
    candidate.canonical_proposition.representation = representation;
    const result = spawnSync('python3', ['-c',
      'import json,sys,jsonschema; data=json.load(sys.stdin); jsonschema.Draft202012Validator(data["schema"]).validate(data["candidate"])'],
    { input: JSON.stringify({ schema, candidate }), encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 0, `${representation}: ${result.stderr}`);
  }
});
