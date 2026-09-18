import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../../../../../..');
const {createReasoningStateLedger,deriveReasoningReplayFixture,verifyReasoningReplayFixture}=await import(resolve(root,'implementation/agent-reasoning-engine/packages/reasoning-state-runtime/index.mjs'));
const canonical=x=>JSON.stringify(x===null||typeof x!=='object'?x:Array.isArray(x)?x.map(v=>JSON.parse(canonical(v))):Object.fromEntries(Object.keys(x).sort().map(k=>[k,JSON.parse(canonical(x[k]))])));
const hash=x=>createHash('sha256').update(canonical(x)).digest('hex');
const fail=reason=>{throw Error('history-ledger:'+reason);};
const closed=(x,keys)=>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!keys.includes(k)))fail('unknown-source-field');};
const text=x=>typeof x==='string'&&x.length>0;
function timestamp(x){
 if(!text(x))fail('date-required');
 const m=x.match(/^(\d{4})\/(\d{2})\/(\d{2}) \([A-Za-z]{3}\) (\d{2}):(\d{2})$/);
 if(!m)fail('date-format');
 const [y,mo,d,h,mi]=m.slice(1).map(Number), n=Date.UTC(y,mo-1,d,h,mi),date=new Date(n);
 if(date.getUTCFullYear()!==y||date.getUTCMonth()!==mo-1||date.getUTCDate()!==d||h>23||mi>59)fail('date-invalid');
 return n;
}
function sourceUnits(row){
 closed(row,['task_id','split','source_record_sha256','history','question','question_date']);
 if(!text(row.task_id)||!['development','reserved'].includes(row.split)||!/^[a-f0-9]{64}$/.test(row.source_record_sha256)||!Array.isArray(row.history)||!row.history.length||!text(row.question))fail('source-invalid');
 const questionTime=timestamp(row.question_date);let previous=-Infinity;const units=[];
 row.history.forEach((session,s)=>{
  closed(session,['date','session_id','messages']);
  const time=timestamp(session.date);if(time<previous||time>questionTime)fail('chronology-invalid');previous=time;
  if(!text(session.session_id)||!Array.isArray(session.messages)||!session.messages.length)fail('session-invalid');
  session.messages.forEach((m,t)=>{
   closed(m,['role','content']);if(!['user','assistant'].includes(m.role)||!text(m.content))fail('turn-invalid');
   const unit={source_id:`s${s}-m${t}`,date:session.date,role:m.role,content:m.content};
   units.push({...unit,source_digest:hash(unit)});
  });
 });return units;
}
export function prepareHistory(row){
 const units=sourceUnits(row),source_manifest_sha256=hash(units);
 const ledger=createReasoningStateLedger({ledger_id:'visible-history:'+source_manifest_sha256});
 try{
  const bound=units.map(unit=>{
   const result=ledger.append({event_kind:'benchmark-visible-history-turn',idempotency_key:unit.source_id,content:unit,provenance_refs:['source-sha256:'+unit.source_digest]});
   if(!result.ok)fail('append-failed');return {...unit,event_digest:result.event.event_digest};
  });
  const sealed=ledger.seal({consumer_ref:'are:external-memory-pilot',selected_dependencies:[],frontier:{kind:'visible-history',source_manifest_sha256,turn_count:units.length}});
  if(!sealed.ok)fail('seal-failed');const replay=ledger.replay(sealed.value);if(!replay.ok)fail('replay-failed');
  const fixture=deriveReasoningReplayFixture(ledger,sealed.value);if(!fixture.ok)fail('fixture-failed');
  const result={units:bound,evidence:{epoch:sealed.value,replay_fixture:fixture.value,source_manifest_sha256,events:replay.value.events,coverage:{source_turn_count:units.length,replayed_turn_count:replay.value.events.length,complete:true},mechanism:'existing-reasoning-state-ledger',external_calls:0,authority_effect:'none'}};
  verifyPreparedHistory(result,row);return result;
 }finally{ledger.close();}
}
export function verifyPreparedHistory(prepared,row){
 const expected=sourceUnits(row),e=prepared?.evidence;
 if(!e||!verifyReasoningReplayFixture(e.replay_fixture).ok)fail('replay-integrity');
 if(canonical(e.epoch)!==canonical(e.replay_fixture.source_epoch)||canonical(e.events)!==canonical(e.replay_fixture.events))fail('replay-binding');
 if(e.source_manifest_sha256!==hash(expected)||canonical(e.events.map(x=>x.content))!==canonical(expected))fail('source-coverage');
 const bound=expected.map((x,i)=>({...x,event_digest:e.events[i].event_digest}));
 if(canonical(bound)!==canonical(prepared.units))fail('unit-binding');
 if(canonical(e.coverage)!==canonical({source_turn_count:expected.length,replayed_turn_count:expected.length,complete:true}))fail('coverage-binding');
 return {ok:true,source_turn_count:expected.length,source_manifest_sha256:e.source_manifest_sha256,authority_effect:'none'};
}

// Model-authored notes are claims. A valid source identifier establishes provenance,
// never semantic entailment. Preserve notes unchanged, including invalid references.
export function recordNotes({prepared,notes,step,prior_claims=[]}={}){
 const source=prepared?.evidence;
 if(!source||!verifyReasoningReplayFixture(source.replay_fixture).ok||canonical(source.epoch)!==canonical(source.replay_fixture.source_epoch)||canonical(source.events)!==canonical(source.replay_fixture.events))fail('notes-source-integrity');
 if(!Array.isArray(prepared.units)||canonical(prepared.units)!==canonical(source.events.map(e=>({...e.content,event_digest:e.event_digest}))))fail('notes-source-binding');
 if(typeof notes!=='string'||!notes.trim()||Buffer.byteLength(notes,'utf8')>65536)fail('notes-invalid');
 if(!Array.isArray(prior_claims)||prior_claims.length>255||!Number.isSafeInteger(step)||step!==prior_claims.length+1)fail('claim-sequence');
 const sourceEpoch=source.epoch.epoch_digest,sourceMap=new Map(prepared.units.map(u=>[u.source_id,u.event_digest]));
 const ledger=createReasoningStateLedger({ledger_id:'model-notes:'+sourceEpoch});
 try{
  for(const [index,prior] of prior_claims.entries()){
   if(!prior||!verifyReasoningReplayFixture(prior.replay_fixture).ok||canonical(prior.epoch)!==canonical(prior.replay_fixture.source_epoch)||canonical(prior.event)!==canonical(prior.replay_fixture.events.at(-1))||prior.event.content.step!==index+1||prior.event.content.source_epoch_digest!==sourceEpoch)fail('prior-claim-integrity');
   const c=prior.event.content;
   const refs=[...new Set(c.notes.match(/\bs\d+-m\d+\b/g)??[])].sort(),used=refs.filter(x=>sourceMap.has(x)),unknown=refs.filter(x=>!sourceMap.has(x));
   if(c.posture!=='unverified-model-claim'||canonical(c.used_source_refs)!==canonical(used)||canonical(c.unknown_refs)!==canonical(unknown))fail('prior-claim-posture');
   const appended=ledger.append({event_kind:'benchmark-model-note-claim',idempotency_key:'notes:'+c.step,content:c,provenance_refs:prior.event.provenance_refs});
   if(!appended.ok||canonical(appended.event)!==canonical(prior.event)||canonical(ledger.snapshot())!==canonical(prior.replay_fixture.events))fail('prior-claim-chain');
  }
  const found=[...new Set(notes.match(/\bs\d+-m\d+\b/g)??[])].sort();
  const used_source_refs=found.filter(x=>sourceMap.has(x)),unknown_refs=found.filter(x=>!sourceMap.has(x));
  const inherited_source_refs=[...new Set(prior_claims.flatMap(x=>x.event.content.used_source_refs))].sort();
  const previous=prior_claims.at(-1)?.event.event_digest??null;
  const content={step,notes,posture:'unverified-model-claim',semantic_verification:'not-performed',source_epoch_digest:sourceEpoch,used_source_refs,unknown_refs,inherited_source_refs,previous_claim_digest:previous};
  const provenance_refs=['reasoning-epoch:'+sourceEpoch,...used_source_refs.map(id=>'reasoning-event:'+sourceMap.get(id)),...(previous?['reasoning-event:'+previous]:[])];
  const appended=ledger.append({event_kind:'benchmark-model-note-claim',idempotency_key:'notes:'+step,content,provenance_refs});if(!appended.ok)fail('claim-append');
  const sealed=ledger.seal({consumer_ref:'are:external-memory-pilot',frontier:{kind:'unverified-model-notes',source_epoch_digest:sourceEpoch,step}});if(!sealed.ok)fail('claim-seal');
  const replay=ledger.replay(sealed.value);if(!replay.ok)fail('claim-replay');
  const fixture=deriveReasoningReplayFixture(ledger,sealed.value);if(!fixture.ok)fail('claim-fixture');
  return {event:appended.event,epoch:sealed.value,replay_fixture:fixture.value,used_source_refs,unknown_refs,inherited_source_refs,source_epoch_digest:sourceEpoch,semantic_verification:'not-performed',external_calls:0,authority_effect:'none'};
 }finally{ledger.close();}
}
