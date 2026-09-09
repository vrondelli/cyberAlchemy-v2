import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,appendFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {handle} from '../continuity-v1/adapter.mjs';
import {openTransport} from './transport.mjs';
import {createBridge} from './bridge.mjs';
import {recoverReasoningStateLedger,acquireReasoningStateWriterLock} from '../../../../../implementation/agent-reasoning-engine/packages/reasoning-state-runtime/index.mjs';
import {digestValue} from '../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/canonical.mjs';
function fixture(t){
 const dir=mkdtempSync(join(tmpdir(),'are-transport-test-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const config={mode:'isolated-prototype',session_id:'thread',cwd:dir,transcript_path:join(dir,'transcript'),participant_ref:'user',product_ref:'product',log_path:join(dir,'are')};
 const call=(kind,turn,extra)=>handle(config,{session_id:'thread',cwd:dir,transcript_path:config.transcript_path,hook_event_name:kind,turn_id:turn,...extra});
 call('UserPromptSubmit','one',{prompt:'/are mode apply-scoped'});call('Stop','one',{stop_hook_active:false,last_assistant_message:'Ready.'});call('UserPromptSubmit','active',{prompt:'Explain.'});
 const binding={config,journalPath:join(dir,'transport')};
 const request={id:1,method:'turn/steer',params:{threadId:'thread',expectedTurnId:'active',input:[{type:'text',text:'Keep it brief.',text_elements:[]}]}};
 const worker=(action,extra={})=>{const r=spawnSync(process.execPath,[fileURLToPath(new URL('./restart-worker.mjs',import.meta.url))],{input:JSON.stringify({binding,action,...extra}),encoding:'utf8',timeout:10000});assert.equal(r.status,0,r.stderr);return r.stdout?JSON.parse(r.stdout):null;};
 return {binding,request,worker,open:()=>openTransport(binding)};
}
test('unsent request and bridge pending state survive fresh process',t=>{const h=fixture(t);h.open().queue(h.request);const state=h.worker('inspect');assert.equal(state.phase,'prepared');assert.deepEqual(state.request,h.request);assert.equal(state.bridge.pending.id,1);});
test('process exit after send marker never permits blind resend',async t=>{const h=fixture(t);h.open().queue(h.request);h.worker('send-exit');const restored=h.open();assert.equal(restored.inspect().recovery,'await-correlated-response');await assert.rejects(()=>restored.send(()=>{}),/phase-sent/);});
test('response recorded in a fresh process resumes without resending',t=>{const h=fixture(t);h.open().queue(h.request);h.worker('send-exit');h.worker('receive',{response:{id:1,result:{turnId:'active'}}});assert.equal(h.open().inspect().phase,'received');const after=h.worker('apply');assert.equal(after.phase,'prepared');assert.equal(after.request.method,'thread/inject_items');assert.equal(after.bridge.pending.kind,'inject');});
test('settled injection acceptance survives restart and preserves used ids',async t=>{const h=fixture(t);let x=h.open();x.queue(h.request);await x.send(()=>{});x.receive({id:1,result:{turnId:'active'}});x.applyResponse();const id=x.inspect().request.id;await x.send(()=>{});x.receive({id,result:{}});assert.equal(x.applyResponse().status,'host-accepted');const restored=h.open();assert.equal(restored.inspect().phase,'idle');assert.equal(restored.inspect().bridge.receipts.at(-1).status,'host-accepted');assert.throws(()=>restored.queue(h.request),/reused-rpc/);});
test('write failure remains uncertain rather than retryable',async t=>{const h=fixture(t);const x=h.open();x.queue(h.request);await assert.rejects(()=>x.send(()=>{throw Error('broken pipe');}),/broken pipe/);assert.equal(h.open().inspect().phase,'sent');});
test('uncorrelated response cannot overwrite durable pending request',async t=>{const h=fixture(t);const x=h.open();x.queue(h.request);await x.send(()=>{});assert.throws(()=>x.receive({id:2,result:{}}),/uncorrelated/);assert.equal(h.open().inspect().phase,'sent');});
test('stale transport writer cannot overwrite another operation',t=>{const h=fixture(t);const a=h.open(),b=h.open();a.queue(h.request);assert.throws(()=>b.queue({...h.request,id:2}),/stale-transport-writer/);assert.equal(h.open().inspect().request.id,1);});
test('corrupt journal fails closed',t=>{const h=fixture(t);h.open().queue(h.request);appendFileSync(h.binding.journalPath,'broken\n');assert.throws(()=>h.open());});
test('bridge snapshot cannot transfer to a different binding',t=>{const h=fixture(t);const snapshot=createBridge(h.binding.config).exportState();assert.throws(()=>createBridge({...h.binding.config,session_id:'other'},snapshot),/binding-mismatch/);});
test('rejected host response restores idle without creating successor',async t=>{const h=fixture(t);const x=h.open();x.queue(h.request);await x.send(()=>{});x.receive({id:1,error:{code:-1,message:'Rejected'}});assert.equal(x.applyResponse().status,'host-rejected');assert.equal(h.open().inspect().phase,'idle');assert.doesNotMatch(readFileSync(h.binding.config.log_path,'utf8'),/superseded/);});
test('ambiguous Applying checkpoint never replays a local mutation',async t=>{
 const h=fixture(t);const x=h.open();x.queue(h.request);await x.send(()=>{});x.receive({id:1,result:{turnId:'active'}});
 // Represents the durable boundary after Applying was fsynced, before settlement.
 const state=x.inspect();delete state.recovery;delete state.model_observed;state.phase='applying';state.sequence++;
 const lock=acquireReasoningStateWriterLock({path:h.binding.journalPath}).lock;
 const ledger=recoverReasoningStateLedger({path:h.binding.journalPath,ledger_id:'transport:'+digestValue(h.binding.config)}).ledger;
 try{const entry=ledger.append({event_kind:'are-transport',idempotency_key:'transport:'+state.sequence,content:state,provenance_refs:['crash-fixture']});assert.ok(entry.ok);const epoch=ledger.seal({event_digests:[entry.event.event_digest],consumer_ref:'user',request_ref:'crash-fixture'});assert.ok(ledger.checkpoint({checkpoint_kind:'manual',epoch:epoch.value,subject_digest:digestValue(state)}).ok);}finally{ledger.close();lock.release();}
 const restored=h.open();assert.equal(restored.inspect().recovery,'reconciliation-required');assert.throws(()=>restored.applyResponse(),/phase-applying/);assert.doesNotMatch(readFileSync(h.binding.config.log_path,'utf8'),/superseded/);
});
