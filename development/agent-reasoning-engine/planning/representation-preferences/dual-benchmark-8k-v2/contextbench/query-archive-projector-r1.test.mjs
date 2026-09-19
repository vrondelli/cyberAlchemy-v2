import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {projectQueryArchive} from './query-archive-projector-r1.mjs';
import {buildQueryArchiveSchedule,verifyQueryArchiveSchedule} from './query-archive-schedule-r1.mjs';
const exchange=(id,query,content)=>[
 {role:'assistant',content:null,reasoning_content:'Original reasoning preserved: '+id,tool_calls:[{id,type:'function',function:{name:'search',arguments:JSON.stringify({query})}}]},
 {role:'tool',tool_call_id:id,content}
];
const measure_request=async h=>1000+h.length*100;
test('recalls relevant older exchange, drops irrelevant history and preserves exact strings',async()=>{
 const older=exchange('old','offset','{"utf8":"offset = 1;\\n  é\\t","read_id":"native-original"}');
 const latest=exchange('new','offset','{"ok":false,"error":"read too large"}');
 const history=[...older,...exchange('irrelevant','banana','unrelated fruit'),...latest],before=structuredClone(history);
 const result=await projectQueryArchive({history,task:'Fix offset initialization',measure_request});
 assert.deepEqual(result.history,[...older,...latest]);assert.deepEqual(history,before);
 assert.deepEqual(result.projection.selected_indices,[0,2]);assert.equal(result.projection.delivery_confirmed,false);
 assert.equal(result.projection.dispatch_admitted,false);assert.deepEqual(result,await projectQueryArchive({history,task:'Fix offset initialization',measure_request}));
 result.history[1].content='mutated';assert.deepEqual(history,before);
});
test('full-request measurement rejects large recall and still considers smaller candidate',async()=>{
 const history=[...exchange('small','offset','small'),...exchange('large','offset','x'.repeat(6000)),...exchange('latest','offset','latest')];
 const measure=async h=>4000+h.filter(m=>m.role==='tool').reduce((n,m)=>n+m.content.length,0);
 const result=await projectQueryArchive({history,task:'offset',measure_request:measure});
 assert.deepEqual(result.projection.selected_indices,[0,2]);assert.deepEqual(result.projection.skipped,[{index:1,reason:'request-budget'}]);
 assert.equal(result.projection.request_tokens,4011);assert.equal(result.projection.measurement_probes.length,3);
});
test('latest exchange never truncates or silently disappears when oversize',async()=>{
 const history=exchange('latest','offset','x'.repeat(9000)),before=structuredClone(history);
 await assert.rejects(projectQueryArchive({history,task:'offset',measure_request:async()=>8001}),/latest-exchange-over-budget/);
 assert.deepEqual(history,before);
});
test('duplicate IDs across archive entries cannot become duplicate prompt IDs',async()=>{
 const history=[...exchange('same','offset','old'),...exchange('other','offset','middle'),...exchange('same','offset','new')];
 const r=await projectQueryArchive({history,task:'offset',measure_request});
 assert.deepEqual(r.projection.selected_indices,[1,2]);assert.deepEqual(r.projection.skipped,[{index:0,reason:'call-id-collision'}]);
});
test('multi-call exchange is atomic, including failures and original result order',async()=>{
 const a=exchange('a','offset','A'),b=exchange('b','offset','{"error":"missing"}');
 const group=[{...a[0],tool_calls:[...a[0].tool_calls,...b[0].tool_calls]},b[1],a[1]];
 const r=await projectQueryArchive({history:[...group,...exchange('c','offset','C')],task:'offset',measure_request});
 assert.deepEqual(r.history.slice(0,3),group);
 for(const broken of [group.slice(0,2),[group[1]], [{...a[0],tool_calls:[...a[0].tool_calls,...a[0].tool_calls]},a[1],a[1]], [...a,{role:'user',content:'injected'}]]){
  await assert.rejects(projectQueryArchive({history:broken,task:'offset',measure_request}),/query-archive\./);
 }
});
test('empty archive measures protected request; invalid measurements fail closed',async()=>{
 const r=await projectQueryArchive({history:[],task:'offset',measure_request});assert.deepEqual(r.history,[]);assert.equal(r.projection.request_tokens,1000);
 for(const n of [NaN,Infinity,-1,1.5,'1000'])await assert.rejects(projectQueryArchive({history:[],task:'offset',measure_request:async()=>n}),/invalid-measurement/);
});
test('bounded probes and recall count; measurement callback cannot mutate archive',async()=>{
 const history=Array.from({length:8},(_,i)=>exchange(String(i),'offset','value')).flat(),before=structuredClone(history);
 let calls=0;
 const r=await projectQueryArchive({history,task:'offset',max_candidates:2,max_recalled_exchanges:1,measure_request:async h=>{calls++;h.length=0;return 1000;}});
 assert.equal(calls,2);assert.deepEqual(r.projection.selected_indices,[6,7]);assert.deepEqual(history,before);
});
test('distinct candidate schedule preserves cohort and rejects tampering or control relabeling',()=>{
 const config_path=new URL('./discovery-v1/live-config.json',import.meta.url).pathname;
 const cohort_path=new URL('./RECOVERY-TRAJECTORY-COHORT-R1.json',import.meta.url).pathname;
 const sources={config_path,cohort_path,cohort_sha256:createHash('sha256').update(readFileSync(cohort_path)).digest('hex')};
 const schedule=buildQueryArchiveSchedule(sources);
 assert.equal(verifyQueryArchiveSchedule({schedule,...sources}),true);assert.equal(schedule.slots.length,4);
 assert.ok(schedule.slots.every(s=>s.arm==='query-archive'&&s.cell.comparison_arm==='query-archive'&&s.cell.context_projection==='query-archive-r1'));
 assert.equal(schedule.maximum_total_model_tokens,384000);assert.equal(schedule.fresh_control_runs,false);
 for(const alter of [s=>s.slots[0].arm='minimal-history',s=>s.workers=4,s=>s.slots[0].cell.phase_contract.exploration_tokens++,s=>s.dispatch_admitted=true]){
  const copy=structuredClone(schedule);alter(copy);assert.throws(()=>verifyQueryArchiveSchedule({schedule:copy,...sources}));
 }
});
