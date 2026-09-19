// Exact prospective schedule realization. Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildSchemaAgreementSchedule} from './schema-agreement-schedule-r1.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash = value => createHash('sha256').update(stable(value)).digest('hex');
export function buildRecentEvidenceSchedule(sources) {
  const {schedule_sha256, ...previous} = buildSchemaAgreementSchedule(sources);
  const slots = previous.slots.map(slot => {
    const cell = {...slot.cell, cell_id: slot.task_id + '-recent-evidence-ledger-r1',
      comparison_arm: 'recent-evidence-ledger', context_projection: 'recent-evidence-ledger-r1'};
    return {...slot, slot_id: slot.task_id + '--recent-evidence-ledger', arm: 'recent-evidence-ledger',
      cell, cell_sha256: hash(cell)};
  });
  const body = {...previous, schema: 'are.recent-evidence-ledger-schedule/v1', slots,
    candidates: ['recent-evidence-ledger'], dispatch_admitted: false,
    open_questions_ref: 'RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md'};
  return {...body, schedule_sha256: hash(body)};
}
export function verifyRecentEvidenceSchedule({schedule, ...sources}) {
  assert.deepEqual(schedule, buildRecentEvidenceSchedule(sources), 'recent-evidence.exact-schedule');
  return true;
}
