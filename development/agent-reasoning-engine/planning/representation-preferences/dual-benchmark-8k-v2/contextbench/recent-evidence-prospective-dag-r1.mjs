// H-L prospective DAG validation with the registered H-L question owner.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import assert from 'node:assert/strict';
import {digest} from '../../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {buildProspectiveDag} from './schema-agreement-prospective-dag-r1.mjs';

export function buildRecentEvidenceProspectiveDag({candidate, parent}) {
  const {dag_digest: inheritedDigest, ...base} = buildProspectiveDag({candidate, parent});
  assert.match(inheritedDigest, /^[a-f0-9]{64}$/);
  const body = {...base, open_questions_ref: 'RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md'};
  return {...body, dag_digest: digest(body)};
}

export function verifyRecentEvidenceProspectiveDag({graph, candidate, parent}) {
  assert.deepEqual(graph, buildRecentEvidenceProspectiveDag({candidate, parent}));
  return true;
}
