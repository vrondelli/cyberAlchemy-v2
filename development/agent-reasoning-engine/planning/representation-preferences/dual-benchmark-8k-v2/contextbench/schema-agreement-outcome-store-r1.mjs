// Schema-agreement candidate. Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
// Additive ranked-source-hints production candidate. Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
// Candidate-only descendant of comparison-outcome-store.mjs. Open questions: CANDIDATE-ONLY-PLAN.md.
// Guarded outcome persistence and reusable reference seal. Open questions: COMPARISON-OUTCOME-STORE.md.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,realpathSync,lstatSync,existsSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {verifySchemaAgreementSchedule as verifyComparisonSchedule} from './schema-agreement-schedule-r1.mjs';
import {accountComparisonOutcome,accountComparisonQueue} from './schema-agreement-accounting-r1.mjs';
import {createReferencedSeal,hydrateReferencedSeal} from './referenced-generation-seal.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(v,m)=>{if(!v)throw Error('comparison-store.'+m);};
const outcomePath=i=>'outcomes/'+String(i).padStart(2,'0')+'.json';
const startPath=i=>'starts/'+String(i).padStart(2,'0')+'.json';
const metadata=({result,...rest})=>rest;
function readBound(root,path){
 need(realpathSync(root)===root,'canonical-root');let cursor=root;
 for(const part of path.split('/')){need(part&&part!=='.'&&part!=='..'&&!part.includes(sep),'path');cursor=join(cursor,part);need(!lstatSync(cursor).isSymbolicLink(),'symlink');}
 need(lstatSync(cursor).isFile(),'file');const bytes=readFileSync(cursor);return {value:JSON.parse(bytes),sha256:hash(bytes)};
}
function contract({root,schedule,sources}){
 verifyComparisonSchedule({schedule,...sources});
 const plan=readBound(root,'PLAN.json');assert.deepEqual(plan.value,schedule,'comparison-store.persisted-plan');
 const terminal=readBound(root,'QUEUE-TERMINAL.json'),t=terminal.value;
 need(t.schema==='are.candidate-only-queue-terminal/v1'&&t.workers_settled===true&&t.assigned_outcomes===schedule.assigned_outcomes&&t.schedule_sha256===schedule.schedule_sha256,'terminal-identity');
 need(Array.isArray(t.persistence_failures)&&t.persistence_failures.length===0&&Array.isArray(t.outcomes)&&t.outcomes.length===schedule.assigned_outcomes,'terminal-persistence');
 const starts=[];
 for(const [i,slot]of schedule.slots.entries()){
  const path=startPath(i);if(existsSync(join(root,path))){const start=readBound(root,path);assert.deepEqual(start.value,{slot_id:slot.slot_id,sequence:i});starts.push({slot_id:slot.slot_id,path,sha256:start.sha256});}
  if(t.outcomes[i].attempted)need(starts.some(s=>s.slot_id===slot.slot_id),'missing-start');
 }
 return {
  validate:({slot_id,result})=>{const i=schedule.slots.findIndex(s=>s.slot_id===slot_id);need(i>=0,'unknown-slot');const slot=schedule.slots[i];assert.deepEqual(['sequence','slot_id','task_id','arm'].map(k=>result[k]),['sequence','slot_id','task_id','arm'].map(k=>slot[k]));assert.deepEqual(metadata(result),t.outcomes[i],'comparison-store.terminal-outcome');need(!result.persistence_failure,'outcome-persistence');accountComparisonOutcome(result);return true;},
  summarize:rows=>{assert.deepEqual(rows.map(r=>r.slot_id),schedule.slots.map(s=>s.slot_id),'comparison-store.denominator');return {schema:'are.candidate-only-outcome-summary/v1',schedule_sha256:schedule.schedule_sha256,plan_sha256:plan.sha256,terminal_sha256:terminal.sha256,starts,queue_status:t.status,stop_reason:t.stop_reason,accounting:accountComparisonQueue({terminal:{...t,outcomes:rows.map(r=>r.result)},schedule,sources}),evidence_sealed:true,durable_reconciliation_pending:true,benchmark_cleared:false};}
 };
}
export function createComparisonOutcomeStore({root,schedule,sources,persistence}){
 root=resolve(root);need(realpathSync(root)===root&&readdirSync(root).length===0,'fresh-canonical-root');need(typeof persistence?.writeJson==='function','guarded-writer');verifyComparisonSchedule({schedule,...sources});const plan=structuredClone(schedule),refs=new Map(),started=new Set();let planned=false,terminalSaved=false,failed=false,sealed=false;
 const save=(path,value,final=false)=>{assert.deepEqual(JSON.parse(stable(value)),value,'comparison-store.json-roundtrip');persistence.writeJson(join(root,path),value,{final});return readBound(root,path);};
 const slotFor=event=>{const i=event.sequence;need(Number.isSafeInteger(i)&&i>=0&&i<plan.assigned_outcomes&&event.slot_id===plan.slots[i].slot_id,'slot-identity');return i;};
 const persist=event=>{try{
  need(!sealed,'already-sealed');
  if(event.kind==='queue-plan'){need(!planned,'duplicate-plan');assert.deepEqual(event.schedule,plan);save('PLAN.json',plan);planned=true;return;}
  need(planned&&!terminalSaved,'event-order');
  if(event.kind==='queue-start'){const i=slotFor(event);need(!started.has(i),'duplicate-start');save(startPath(i),{slot_id:event.slot_id,sequence:i});started.add(i);return;}
  if(event.kind==='queue-outcome'){const i=slotFor(event.outcome);need(started.has(i)&&!refs.has(i),'outcome-order');const bound=save(outcomePath(i),event.outcome);refs.set(i,{slot_id:event.outcome.slot_id,path:outcomePath(i),sha256:bound.sha256});return;}
  need(event.kind==='queue-terminal','event-kind');save('QUEUE-TERMINAL.json',event.terminal);terminalSaved=true;
 }catch(error){failed=true;throw error;}};
 function seal(terminal){try{
  need(planned&&terminalSaved&&!failed&&!sealed,'seal-state');const saved=readBound(root,'QUEUE-TERMINAL.json');assert.deepEqual(saved.value,{...terminal,outcomes:terminal.outcomes.map(metadata)},'comparison-store.terminal-identity');
  need(terminal.outcomes.length===schedule.assigned_outcomes&&terminal.persistence_failures.length===0,'complete-persistence');
  for(const [i,outcome]of terminal.outcomes.entries()){
   if(!refs.has(i)){need(!outcome.attempted&&outcome.status==='not-started'&&outcome.result===null,'attempted-outcome-missing');accountComparisonOutcome(outcome);const bound=save(outcomePath(i),outcome);refs.set(i,{slot_id:outcome.slot_id,path:outcomePath(i),sha256:bound.sha256});}
   assert.deepEqual(readBound(root,outcomePath(i)).value,outcome,'comparison-store.saved-outcome');
  }
  const seal=createReferencedSeal({root,slots:plan.slots.map((_,i)=>refs.get(i)),...contract({root,schedule:plan,sources})});
  const savedSeal=save('GENERATION-SEAL.json',seal,true);sealed=true;return {seal,seal_sha256:savedSeal.sha256};
 }catch(error){failed=true;throw error;}}
 return Object.freeze({persist,seal});
}
export function verifyComparisonOutcomeSeal({root,schedule,sources,expected_seal_sha256}){
 root=resolve(root);const saved=readBound(root,'GENERATION-SEAL.json');need(saved.sha256===expected_seal_sha256,'seal-file-digest');
 need(Array.isArray(saved.value.slots)&&saved.value.slots.length===schedule.assigned_outcomes,'seal-slots');
 const expected_slots=schedule.slots.map((s,i)=>({slot_id:s.slot_id,path:outcomePath(i),sha256:saved.value.slots[i].sha256}));
 return hydrateReferencedSeal({root,seal:saved.value,expected_slots,...contract({root,schedule,sources})});
}
