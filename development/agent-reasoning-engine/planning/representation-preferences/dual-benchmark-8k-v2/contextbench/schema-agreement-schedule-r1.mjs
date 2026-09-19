// Distinct candidate, unchanged cohort/budget. Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {buildRankedReadAcquisitionSchedule} from './ranked-read-acquisition-schedule-r1.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
export function buildSchemaAgreementSchedule(sources){
 const {schedule_sha256,...previous}=buildRankedReadAcquisitionSchedule(sources);
 const slots=previous.slots.map(s=>{
  const cell={...s.cell,cell_id:s.task_id+'-schema-agreement-r1',comparison_arm:'schema-agreement',context_projection:'schema-agreement-r1'};
  return {...s,slot_id:s.task_id+'--schema-agreement',arm:'schema-agreement',cell,cell_sha256:hash(cell)};
 });
 const body={...previous,schema:'are.schema-agreement-schedule/v1',slots,candidates:['schema-agreement'],dispatch_admitted:false,open_questions_ref:'RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md'};
 return {...body,schedule_sha256:hash(body)};
}
export function verifySchemaAgreementSchedule({schedule,...sources}){
 assert.deepEqual(schedule,buildSchemaAgreementSchedule(sources),'schema-agreement.exact-schedule');return true;
}
