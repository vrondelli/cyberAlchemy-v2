import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const implementation = fileURLToPath(new URL('../../', import.meta.url));
const node = (source, name) => JSON.parse(readFileSync(resolve(implementation,
  source, 'specs/auth-command-boundary/nodes', `${name}.json`), 'utf8'));
const terms = value => value.body.typed_contract.expression.where.terms;
const key = value => JSON.stringify(value);
const provenanceWitness = (source, binding) => {
  const clauses = node(source, 'candidate-command-provenance').body.typed_contract.expression.terms;
  return clauses.find(clause => clause.op === 'exists' && clause.binding === binding).where.terms;
};

test('v2 provenance witnesses include every exact unique-row qualifier', () => {
  for (const [leaf, binding] of [
    ['unique-trusted-authentication-evidence', 'evidence'],
    ['unique-complete-route-binding', 'binding'],
  ]) {
    const qualifying = terms(node('command-boundary-source-v2', leaf)).map(key);
    const provenance = provenanceWitness('command-boundary-source-v2', binding).map(key);
    assert.ok(qualifying.every(term => provenance.includes(term)), `${leaf} qualifier must be preserved`);
    assert.equal(new Set(provenance).size, provenance.length, `${binding} witness cannot duplicate a qualifier`);
    assert.ok(provenance.length > qualifying.length, `${binding} witness also matches candidate values`);
    const historical = provenanceWitness('command-boundary-source', binding).map(key);
    assert.ok(qualifying.some(term => !historical.includes(term)), 'v1 must remain the separating negative control');
  }
});
