import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runExchange} from './demo.ts';
import {KepBridge,verifySignedReceipt} from './kep-transport.ts';
import {CompilationReceiver,envelope,canonical,verifyCompilation} from './exchange.ts';
const source=readFileSync(new URL('./sample.alch',import.meta.url),'utf8');
async function usingBridge(fn:(bridge:KepBridge)=>Promise<void>){const bridge=new KepBridge();try{await fn(bridge);}finally{await bridge.close();}}
test('two ARE turns exchange through KEP, compile, authenticate receipt and replay',async()=>{
 const result=await runExchange(source);
 assert.equal(result.status,'PASS');assert.equal(result.kep.owner_count,2);assert.equal(result.kep.acknowledgements,1);
 assert.equal(result.kep.state_revision,2);assert.equal(result.signature_verified,true);
 assert.equal(result.agents.length,2);
 assert.ok(verifyCompilation(result.bundle,result.receipt,envelope(source,'local-exchange-1')));
 assert.ok(Object.values(result.bundle.files).every(content=>typeof content==='string'));
 assert.equal(verifyCompilation({...result.bundle,files:{'fake.ts':'tampered'}},result.receipt,envelope(source,'local-exchange-1')),false);
 for(const agent of result.agents){assert.equal(agent.status,'PATCH_CANDIDATE');assert.equal(agent.verification,'PASS_BOUNDED');assert.ok(agent.event_kinds.includes('ModelOutputBound'));assert.deepEqual(agent.changed_paths,['artifact.json']);}
});
for(const fault of ['ciphertext','wrong-recipient','grant-signature'])test(`KEP rejects ${fault}`,async()=>{
 await usingBridge(async bridge=>{await assert.rejects(bridge.request({op:'deliver',envelope:canonical(envelope(source,'fault')),fault}));});
});
for(const [name,change,expected] of [
 ['unsupported version',{language:'future'},'unsupported_version'],
 ['payload digest',{payloadSha256:'0'.repeat(64)},'digest_mismatch'],
 ['malformed language',{payload:'garbage',payloadSha256:(await import('./exchange.ts')).sha('garbage')},'compilation_rejected']
] as const)test(`decrypted ${name} produces no compilation receipt`,async()=>{
 await usingBridge(async bridge=>{
  const sent={...envelope(source,'invalid'),...change};
  const delivery=await bridge.request({op:'deliver',envelope:canonical(sent)});
  assert.equal(delivery.status,'delivered');assert.throws(()=>new CompilationReceiver().receive(JSON.parse(delivery.envelope),delivery.authenticated_sender),new RegExp(expected));
 });
});
test('recipient signature authenticates exact receipt bytes',async()=>{
 await usingBridge(async bridge=>{
  const sent=envelope(source,'signed');const delivery=await bridge.request({op:'deliver',envelope:canonical(sent)});
  const {receipt}=new CompilationReceiver().receive(JSON.parse(delivery.envelope),delivery.authenticated_sender);
  const ack=await bridge.request({op:'acknowledge',receipt:canonical(receipt)});
  assert.ok(verifySignedReceipt(receipt,ack,delivery.recipient_public_key_der));
  assert.equal(verifySignedReceipt({...receipt,planSha256:'tampered'},ack,delivery.recipient_public_key_der),false);
  assert.equal(verifySignedReceipt(receipt,{...ack,signature_der:'00'},delivery.recipient_public_key_der),false);
  assert.equal(verifySignedReceipt(receipt,ack,'00'),false);
  await assert.rejects(bridge.request({op:'acknowledge',receipt:canonical({...receipt,planSha256:'changed'})}),/acknowledgement_conflict/);
 });
});
test('acknowledgement requires delivery and binds its payload and correlation',async()=>{
 await usingBridge(async bridge=>{
  await assert.rejects(bridge.request({op:'acknowledge',receipt:'{}'}),/delivery_required/);
  const sent=envelope(source,'binding');const delivery=await bridge.request({op:'deliver',envelope:canonical(sent)});
  const {receipt}=new CompilationReceiver().receive(JSON.parse(delivery.envelope),delivery.authenticated_sender);
  await assert.rejects(bridge.request({op:'acknowledge',receipt:canonical({...receipt,correlationId:'other'})}),/receipt_binding_mismatch/);
  const ack=await bridge.request({op:'acknowledge',receipt:canonical(receipt)});assert.equal(ack.acknowledgements,1);
 });
});
test('local session forbids replacing an in-flight delivery',async()=>{
 await usingBridge(async bridge=>{
  await bridge.request({op:'deliver',envelope:canonical(envelope(source,'once'))});
  await assert.rejects(bridge.request({op:'deliver',envelope:canonical(envelope(source,'twice'))}),/delivery_already_started/);
 });
});
test('transport rejects another claimed sender before grant',async()=>{
 await usingBridge(async bridge=>{await assert.rejects(bridge.request({op:'deliver',envelope:canonical(envelope(source,'identity','outsider'))}),/identity_mismatch/);});
});
