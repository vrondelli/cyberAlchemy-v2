import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {verifyRecentEvidenceProspectiveDag} from './recent-evidence-prospective-dag-r1.mjs';

const root = import.meta.dirname;
const read = path => JSON.parse(readFileSync(path));
const overlay = read(join(root, 'RECENT-EVIDENCE-LEDGER-PROSPECTIVE-OVERLAY-R1.json'));
const candidate = read(overlay.candidate_ref);
const parent = read(overlay.parent_ref);

test('reconstructs the exact registered H-L prospective graph', () => {
  assert.equal(verifyRecentEvidenceProspectiveDag({graph: overlay.graph, candidate, parent}), true);
});

test('rejects a predecessor protocol ref or invented completed gate', () => {
  for (const mutate of [
    graph => { graph.open_questions_ref = 'RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md'; },
    graph => { graph.nodes.find(node => node.kind === 'task-gate').state = 'completed'; },
  ]) {
    const graph = structuredClone(overlay.graph);
    mutate(graph);
    assert.throws(() => verifyRecentEvidenceProspectiveDag({graph, candidate, parent}));
  }
});
