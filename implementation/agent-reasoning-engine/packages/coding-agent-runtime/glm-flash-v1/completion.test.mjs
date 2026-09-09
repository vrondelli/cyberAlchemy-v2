import test from 'node:test';
import assert from 'node:assert/strict';
import {hash} from './transport.mjs';
import {synthesisContract,validateCompletionPolicy,projectCompletionState,repeatReadObservation,finalizationDue,projectTaskStateForPrompt} from './completion.mjs';

function ledger(text='abcdefghij') {
 const state={history:[],receipts:[],maximum_requests:12,base:{files:{'a.mjs':hash(text)}},observation_allowlist:['a.mjs'],
  delivery_progress:{delivered_call_ids:[],delivery_unknown_call_ids:[]}};
 const add=(call,observation,delivered=false)=>{
  state.history.push({calls:[call],observations:[observation]});state.receipts.push({kind:'model'});
  if(delivered)state.delivery_progress.delivered_call_ids.push(call.id);
 };
 return {state,
  read:(id,delivered=false)=>add({id,name:'read-file',arguments:{path:'a.mjs'}},{ok:true,output:{path:'a.mjs',sha256:hash(text),utf8:text}},delivered),
  page:(id,sourceId,offset,max_chars=1024,delivered=true)=>{
   let end=Math.min(text.length,offset+max_chars);
   if(end>0&&end<text.length&&/[\uD800-\uDBFF]/.test(text[end-1])&&/[\uDC00-\uDFFF]/.test(text[end]))end--;
   add({id,name:'read-inspection-evidence',arguments:{call_id:sourceId,offset,max_chars}},
    {ok:true,output:{call_id:sourceId,path:'a.mjs',sha256:hash(text),offset_unit:'utf16-code-units',offset,next_offset:end,total_chars:text.length,
     eof:end===text.length,utf8:text.slice(offset,end)}},delivered);
  },project:()=>projectCompletionState(state)};
}

test('completion policy defaults off and rejects unknown values',()=>{
 assert.equal(validateCompletionPolicy(),'none');assert.equal(validateCompletionPolicy('budget-aware-v1'),'budget-aware-v1');
 for(const value of ['guess',null,{},true])assert.throws(()=>validateCompletionPolicy(value),/completion-policy-invalid/);
});

test('budget phases count actual model receipts including upcoming turn and every recorded tool ID',()=>{
 for(const [count,phase] of [[0,'inspect'],[8,'inspect'],[9,'synthesize'],[10,'synthesize'],[11,'finalize'],[12,'exhausted']]) {
  const {state}=ledger();state.receipts=Array.from({length:count},()=>({kind:'model',dispatched:false}));
  const result=projectCompletionState(state);assert.equal(result.remaining_model_turns,12-count);assert.equal(result.phase,phase);
 }
 const x=ledger();x.read('source');
 x.state.history[0].calls.push({id:'deferred',name:'read-file',arguments:{path:'a.mjs'}});
 x.state.history[0].observations.push({ok:false,deferred:true});assert.equal(x.project().remaining_tool_calls,22);
});

test('overlapping and adjacent delivered ranges merge while EOF does not erase an earlier gap',()=>{
 const x=ledger();x.read('source');x.page('p1','source',0,4);x.page('p2','source',3,3);x.page('p3','source',6,2);x.page('eof','source',9,1);
 const before=JSON.stringify(x.state),file=x.project().files[0];
 assert.deepEqual(file.delivered_ranges,[[0,8],[9,10]]);assert.equal(file.first_missing_offset,8);assert.equal(file.eof_received,true);
 assert.equal(file.full_file_delivered,false);assert.equal(JSON.stringify(x.state),before);
});

test('duplicate source-call aliases merge by path and source digest without double counting coverage',()=>{
 const x=ledger();x.read('source-a');x.read('source-b');x.page('p1','source-a',0,4);x.page('p2','source-b',0,4);x.page('p3','source-b',4,6);
 const result=x.project();assert.equal(result.files.length,1);assert.deepEqual(result.files[0].delivered_ranges,[[0,10]]);
 assert.equal(result.files[0].first_missing_offset,null);assert.equal(result.remaining_tool_calls,19);
});

test('full source delivery and complete archive delivery remain separate facts',()=>{
 const full=ledger();full.read('source',true);
 assert.equal(full.project().files[0].full_file_delivered,true);assert.deepEqual(full.project().files[0].delivered_ranges,[]);
 assert.equal(full.project().files[0].first_missing_offset,0);assert.equal(full.project().files[0].eof_received,false);
 const archive=ledger();archive.read('source');archive.page('all','source',0);
 assert.equal(archive.project().files[0].full_file_delivered,false);assert.deepEqual(archive.project().files[0].delivered_ranges,[[0,10]]);
 assert.equal(archive.project().files[0].first_missing_offset,null);assert.equal(archive.project().files[0].eof_received,true);
});

test('delivered EOF acknowledgement adds no bytes and undelivered EOF adds no acknowledgement',()=>{
 const x=ledger();x.read('source');x.page('end','source',10,1024,false);
 let file=x.project().files[0];assert.equal(file.eof_received,false);assert.equal(file.first_missing_offset,0);
 x.state.delivery_progress.delivered_call_ids.push('end');file=x.project().files[0];
 assert.equal(file.eof_received,true);assert.deepEqual(file.delivered_ranges,[]);assert.equal(file.first_missing_offset,0);
 const empty=ledger('');empty.read('empty-source');empty.page('empty-eof','empty-source',0);
 file=empty.project().files[0];assert.equal(file.total_chars,0);assert.deepEqual(file.delivered_ranges,[]);
 assert.equal(file.first_missing_offset,null);assert.equal(file.eof_received,true);assert.equal(file.full_file_delivered,false);
});

test('unknown, attempted, or discarded-projection page results cannot establish delivery',()=>{
 const x=ledger();x.read('source');x.page('page','source',0,10,false);
 x.state.delivery_progress.delivery_unknown_call_ids=['page'];x.state.delivery_progress.attempted_delivery_call_ids=['page'];
 x.state.history.at(-1).delivered_call_ids=['page']; // Never used as a substitute for the supplied confirmed projection.
 const file=x.project().files[0];assert.deepEqual(file.delivered_ranges,[]);assert.equal(file.eof_received,false);assert.equal(file.full_file_delivered,false);
 x.state.delivery_progress.delivered_call_ids=['page'];assert.throws(()=>x.project(),/completion-delivery-invalid/);
});

test('deferred or failed observations cannot become confirmed delivered source or archive coverage',()=>{
 for(const kind of ['source','page']) {
  const x=ledger();x.read('source',kind==='source');if(kind==='page')x.page('page','source',0);
  Object.assign(x.state.history.at(-1).observations[0],{ok:false,deferred:true});
  assert.throws(()=>x.project(),/completion-delivery-invalid/);
 }
});

test('archive source identity, exact text, scope and chronology are validated before projection',()=>{
 const mutations=[
  x=>{x.state.history[0].observations[0].output.utf8='changed';},
  x=>{x.state.history[0].observations[0].output.path='other.mjs';},
  x=>{x.state.history[1].calls[0].arguments.call_id='missing';},
  x=>{x.state.history[1].observations[0].output.call_id='other';},
  x=>{x.state.history[1].observations[0].output.sha256='a'.repeat(64);},
  x=>{x.state.observation_allowlist=[];},
  x=>{x.state.history.reverse();}
 ];
 for(const mutate of mutations) {
  const x=ledger();x.read('source');x.page('page','source',0);mutate(x);assert.throws(()=>x.project(),/completion-(?:source|archive-source)-invalid/);
 }
});

test('typed archive offsets, total, returned slice, UTF16 boundaries and EOF must match exactly',()=>{
 for(const field of ['offset','next_offset','total_chars','utf8','eof','offset_unit']) {
  const x=ledger();x.read('source');x.page('page','source',0,4);
  x.state.history[1].observations[0].output[field]=field==='utf8'?'forged':field==='eof'?true:field==='offset_unit'?'bytes':999;
  assert.throws(()=>x.project(),/completion-archive-(?:source|range)-invalid/);
 }
 const unicode=ledger('A😀Z');unicode.read('source');unicode.page('page','source',1,2);
 assert.deepEqual(unicode.project().files[0].delivered_ranges,[[1,3]]);assert.equal(unicode.project().files[0].first_missing_offset,0);
 unicode.state.history[1].calls[0].arguments.offset=2;assert.throws(()=>unicode.project(),/completion-archive-range-invalid/);
});

test('invalid or over-budget ledgers fail closed rather than produce optimistic remaining budgets',()=>{
 for(const mutate of [
  s=>{s.maximum_requests=13;},s=>{s.maximum_requests=0;},s=>{s.receipts=Array.from({length:13},()=>({kind:'model'}));},
  s=>{s.receipts=Array.from({length:25},()=>({kind:'tokenizer'}));},s=>{s.receipts=[];},
  s=>{s.receipts=[{kind:'unknown'}];},s=>{s.history[0].calls.push(s.history[0].calls[0]);s.history[0].observations.push(s.history[0].observations[0]);},
  s=>{s.history[0].observations=[];},s=>{s.delivery_progress.delivered_call_ids=['missing'];},
  s=>{s.history=Array.from({length:13},()=>({}));}
 ]) {
  const x=ledger();x.read('source');mutate(x.state);assert.throws(()=>x.project(),/completion-(?:budget|ledger|delivery)-invalid/);
 }
 const x=ledger();x.state.history=Array.from({length:4},(_,turn)=>({calls:Array.from({length:7},(_,i)=>({id:`${turn}-${i}`,name:'read-file',arguments:{path:'a.mjs'}})),observations:Array.from({length:7},()=>({ok:false,deferred:true}))}));
 x.state.receipts=Array.from({length:4},()=>({kind:'model'}));assert.throws(()=>x.project(),/completion-budget-invalid/);
});


test('inspection guidance reserves three synthesis turns and never suggests reads after budget exhaustion',()=>{
 const x=ledger();x.read('source');x.state.recycled=true;
 for(const remaining of [4,3,2,1,0]) {
  x.state.receipts=Array.from({length:12-remaining},()=>({kind:'model'}));
  const g=x.project().inspection_guidance;
  assert.equal(g.reading_turns_remaining,Math.max(0,remaining-3));
  assert.equal(g.reserved_synthesis_turns,Math.min(3,remaining));
  assert.equal(g.suggested_archive_read!==null,remaining>3);
 }
});

test('recovery suggestion uses an executed nonempty source and disappears when seen in the request',()=>{
 const x=ledger();x.read('source');
 assert.equal(x.project().inspection_guidance.suggested_archive_read,null);
 x.state.recycled=true;
 assert.deepEqual(x.project().inspection_guidance.suggested_archive_read,
  {name:'read-inspection-evidence',arguments:{call_id:'source',offset:0,max_chars:1024}});
 x.state.archive_recovery_seen_or_present=true;
 assert.equal(x.project().inspection_guidance.suggested_archive_read,null);
 x.state.archive_recovery_seen_or_present=false;
 assert.notEqual(x.project().inspection_guidance.suggested_archive_read,null);
 const empty=ledger('');empty.read('empty');empty.state.recycled=true;
 assert.equal(empty.project().inspection_guidance.suggested_archive_read,null);
});

test('recovery guidance rejects malformed projection flags',()=>{
 const x=ledger();x.state.recycled=1;assert.throws(x.project,/completion-recovery-invalid/);
});


test('execution policy is explicit and repeat suppression requires confirmed delivery',()=>{
 assert.equal(validateCompletionPolicy('bounded-execution-v2'),'bounded-execution-v2');
 const x=ledger();x.read('source');const call={id:'repeat',name:'read-file',arguments:{path:'a.mjs'}};
 assert.equal(repeatReadObservation(call,x.state.history,[]),null);
 assert.equal(repeatReadObservation({...call,arguments:{path:'outside'}},x.state.history,['source']),null);
 const result=repeatReadObservation(call,x.state.history,['source']);
 assert.equal(result.ok,false);assert.equal(result.deferred,true);
 assert.equal(result.output.suggested_archive_read.arguments.call_id,'source');
 const empty=ledger('');empty.read('empty');
 assert.equal(repeatReadObservation(call,empty.state.history,['empty']).output.suggested_archive_read,undefined);
});


test('explicit finalization begins with three calls remaining and preserves older thresholds',()=>{
 for(let count=0;count<=12;count++) {
  assert.equal(finalizationDue('explicit-finalization-v3',12,count),count>=9);
  assert.equal(finalizationDue('bounded-execution-v2',12,count),count>=11);
  assert.equal(finalizationDue('budget-aware-v1',12,count),false);
  assert.equal(finalizationDue('none',12,count),false);
 }
 assert.equal(finalizationDue('explicit-finalization-v3',2,0),true);
 for(const args of [[0,0],[12,13],[13,0],[12,-1]])assert.throws(()=>finalizationDue('explicit-finalization-v3',...args),/completion-budget-invalid/);
});


test('task prompt references only exact duplicate requests without mutating saved state',()=>{
 const request='Repair original task';const state={objective:request,pending:[request,'Distinct requirement'],facts:['Preserve this'],constraints:['Scope']};
 const before=JSON.stringify(state),result=projectTaskStateForPrompt(state,request);
 assert.equal(JSON.stringify(state),before);assert.equal(result.objective,'See original user request.');
 assert.deepEqual(result.pending,['Original user request remains pending.','Distinct requirement']);
 assert.deepEqual(result.facts,state.facts);assert.deepEqual(result.constraints,state.constraints);
 assert.deepEqual(projectTaskStateForPrompt(state,'Different task'),state);
});

test('completion requirements distinguish confirmed whole files, distinct turns and conditional recovery',async()=>{
 const {assessCompletionRequirements,validateCompletionRequirements,completionTokenMargin}=await import('./completion.mjs');
 const req={required_reads:['a','b'],distinct_turns:true,archive_after_recycle:true};
 assert.deepEqual(validateCompletionRequirements(req,['a','b'],'verified-completion-v8'),req);
 for(const bad of [{...req,required_reads:['a','a']},{...req,required_reads:['outside']},{...req,distinct_turns:'yes'},{...req,unknown:true}])assert.throws(()=>validateCompletionRequirements(bad,['a','b'],'verified-completion-v8'));
 assert.throws(()=>validateCompletionRequirements(req,['a','b'],'reserved-headroom-v7'));
 assert.equal(completionTokenMargin('verified-completion-v8'),512);assert.equal(completionTokenMargin('reserved-headroom-v7'),256);
 const entry=p=>({calls:[{name:'read-file',arguments:{path:p}}],observations:[{ok:true}]});
 const input={state:{files:[{path:'a',full_file_delivered:true},{path:'b',full_file_delivered:false}]},history:[entry('a'),entry('b')],recycled:false,archive_confirmed:false};
 assert.equal(assessCompletionRequirements(req,input).passed,false);
 input.state.files[1].full_file_delivered=true;assert.equal(assessCompletionRequirements(req,input).passed,true);
 input.recycled=true;assert.equal(assessCompletionRequirements(req,input).passed,false);
 input.archive_confirmed=true;assert.equal(assessCompletionRequirements(req,input).passed,true);
 input.history=[{calls:[...entry('a').calls,...entry('b').calls],observations:[{ok:true},{ok:true}]}];assert.equal(assessCompletionRequirements(req,input).passed,false);
});

test('synthesis template preserves exact scope and escapes paths without importing source instructions',()=>{
 const path='a"quoted.mjs',base={tree_sha256:hash('tree'),files:{[path]:hash('file'),'outside.mjs':hash('outside')}};
 const original=JSON.stringify(base),text=synthesisContract(base,[path]),value=JSON.parse(text.split('\n').at(-1));
 assert.deepEqual(value.changes,[{operation:'replace-file',path,expected_file_sha256:base.files[path],utf8:'COMPLETE_REPLACEMENT_SOURCE'}]);
 assert.equal(value.expected_base_tree_sha256,base.tree_sha256);assert.equal(value.authority_effect,'none');assert.equal(JSON.stringify(base),original);
 assert.throws(()=>synthesisContract(base,['missing.mjs']),/synthesis-base-invalid/);
});
