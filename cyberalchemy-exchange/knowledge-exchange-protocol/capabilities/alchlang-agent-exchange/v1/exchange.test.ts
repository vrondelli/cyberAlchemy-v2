import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CompilationReceiver,envelope,verifyReceipt,sha,MAX_BYTES} from './exchange.ts';
const source=readFileSync(new URL('./sample.alch',import.meta.url),'utf8');
test('received source compiles and receipt binds exact envelope',()=>{
 const sent=envelope(source,'exchange-1'); const {receipt,replayed}=new CompilationReceiver().receive(sent,'agent-a');
 assert.equal(replayed,false); assert.ok(Object.keys(receipt.artifacts).length); assert.ok(verifyReceipt(receipt,sent));
 assert.equal(verifyReceipt({...receipt,planSha256:'tampered'},sent),false);
});
test('identical delivery replays immutable receipt',()=>{
 const receiver=new CompilationReceiver();const sent=envelope(source,'exchange-1'); const first=receiver.receive(sent,'agent-a');
 first.receipt.planSha256='caller mutation'; const second=receiver.receive(sent,'agent-a');
 assert.equal(second.replayed,true);assert.ok(verifyReceipt(second.receipt,sent));
});
test('correlation reuse with different source is rejected',()=>{
 const receiver=new CompilationReceiver();receiver.receive(envelope(source,'same'),'agent-a');
 assert.throws(()=>receiver.receive(envelope(source+'\n','same'),'agent-a'),/correlation_conflict/);
});
test('bad digest and unsupported versions rejected',()=>{
 for (const [update,error] of [[{payloadSha256:'0'.repeat(64)},'digest_mismatch'],[{language:'future'},'unsupported_version']] as const)
 assert.throws(()=>new CompilationReceiver().receive({...envelope(source,'x'),...update},'agent-a'),new RegExp(error));
});
test('malformed syntax has no success receipt and can be corrected',()=>{
 const receiver=new CompilationReceiver();assert.throws(()=>receiver.receive(envelope('not a domain','x'),'agent-a'),/compilation_rejected/);
 assert.equal(receiver.receive(envelope(source,'x'),'agent-a').replayed,false);
});
test('sender and recipient must match transport principals',()=>{
 assert.throws(()=>new CompilationReceiver().receive(envelope(source,'x'),'intruder'),/identity_mismatch/);
 assert.throws(()=>new CompilationReceiver('agent-c').receive(envelope(source,'x'),'agent-a'),/identity_mismatch/);
});
test('shape, payload and receiver storage are bounded',()=>{
 assert.throws(()=>envelope('x'.repeat(MAX_BYTES+1),'x'),/payload_bounds/);
 assert.throws(()=>envelope('\ud800','x'),/invalid_utf8/);
 assert.throws(()=>new CompilationReceiver().receive({...envelope(source,'x'),execute:true},'agent-a'),/malformed_envelope/);
 const receiver=new CompilationReceiver('agent-b',1);receiver.receive(envelope(source,'x'),'agent-a');
 assert.throws(()=>receiver.receive(envelope(source,'y'),'agent-a'),/receiver_full/);
});

test('bundle returns exact compiler output and immutable replay contents',async()=>{
 const {compileCarrier,parseDomainSource}=await import('../../../../../language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/index.ts');
 const {verifyCompilation}=await import('./exchange.ts');
 const sent=envelope(source,'bundle'); const receiver=new CompilationReceiver();
 const first=receiver.receive(sent,'agent-a');
 assert.deepEqual(first.bundle.files,compileCarrier(parseDomainSource(source).carrier).files);
 assert.ok(verifyCompilation(first.bundle,first.receipt,sent));
 first.bundle.files[Object.keys(first.bundle.files)[0]]='changed';
 assert.equal(verifyCompilation(first.bundle,first.receipt,sent),false);
 const replay=receiver.receive(sent,'agent-a');
 assert.ok(replay.replayed);assert.ok(verifyCompilation(replay.bundle,replay.receipt,sent));
});
test('bundle rejects missing, extra, malformed and oversized returned contents',async()=>{
 const {verifyCompilation,MAX_BUNDLE_BYTES}=await import('./exchange.ts');
 const sent=envelope(source,'bounds');const {bundle,receipt}=new CompilationReceiver().receive(sent,'agent-a');
 const missing=structuredClone(bundle);delete missing.files[Object.keys(missing.files)[0]];
 for(const candidate of [missing,{...bundle,files:{...bundle.files,'extra.ts':'x'}},null,
   {...bundle,schema:'future'},{...bundle,files:{'../escape':'x'}},
   {...bundle,files:{'/absolute':'x'}},{...bundle,files:{'a\\b':'x'}},
   {...bundle,files:{'large.ts':'x'.repeat(MAX_BUNDLE_BYTES+1)}}]){
   assert.equal(verifyCompilation(candidate,receipt,sent),false);
 }
});
test('bundle digest cannot substitute for the exact artifact manifest',async()=>{
 const {verifyCompilation,canonical}=await import('./exchange.ts');
 const sent=envelope(source,'manifest');const {bundle,receipt}=new CompilationReceiver().receive(sent,'agent-a');
 const {receiptSha256,...body}=receipt;body.artifacts={};
 assert.equal(verifyCompilation(bundle,{...body,receiptSha256:sha(canonical(body))},sent),false);
});
