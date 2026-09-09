import test from 'node:test';
import assert from 'node:assert/strict';
import {createConsoleSession,availability,parseHandoff} from './console-session.js';
const file=new File([new Uint8Array([0,255,192,128,13,10])],'original.bin');
function harness(){
 let wallet='wallet-a',failUpload=true,failAck=true,registrationCount=0,accessCount=0;const uploads=[],acks=[];let artifact;
 const provider={publicKey:{toString:()=>wallet},connect:async()=>{},signMessage:async()=>({signature:new Uint8Array(64)})};
 const api=async(path,opts)=>{
  if(path==='/v1/identities'){registrationCount++;return {};}
  if(path==='/v1/files'){uploads.push(opts.body);artifact=JSON.parse(opts.body).artifact;if(failUpload)throw Error('upload interrupted');return {expires_at:null,original_bytes:6,expired:false};}
  if(path.endsWith('/access')){accessCount++;return {...artifact,recipient_envelope_base64:artifact.originator_envelope_base64,recipient_envelope_sha256:artifact.originator_envelope_sha256,revision:0};}
  if(path.endsWith('/acknowledge')){acks.push(opts.body);if(failAck)throw Error('receipt interrupted');return {expires_at:1000};}
  if(path.startsWith('/v1/artifacts/'))return {revision:0};
  return {expires_at:1000,original_bytes:6,expired:false};
 };
 return {session:createConsoleSession({api,getProvider:()=>provider,apiBase:'http://localhost'}),uploads,acks,setWallet:v=>wallet=v,allowUpload:()=>failUpload=false,allowAck:()=>failAck=false,counts:()=>({registrationCount,accessCount})};
}
test('upload retries exact signed payload and identity remains stable across reconnect',async()=>{
 const h=harness(),e={file,policyAccepted:true};await h.session.connect();const before=h.session.publicCard();await h.session.connect();assert.deepEqual(h.session.publicCard(),before);assert.equal(h.counts().registrationCount,1);
 await assert.rejects(()=>h.session.upload(e),/interrupted/);h.allowUpload();await h.session.upload(e);assert.equal(h.uploads[0],h.uploads[1]);assert.equal(e.status.expires_at,null);
 h.setWallet('other');await assert.rejects(()=>h.session.upload(e),/wallet/);assert.equal(h.uploads.length,2);
});
test('receipt retry retains verified bytes without another access or new acknowledgement',async()=>{
 const h=harness(),e={file,policyAccepted:true};await h.session.connect();h.allowUpload();await h.session.upload(e);
 await assert.rejects(()=>h.session.receive(e),/receipt interrupted/);assert.equal(e.ackPending,true);assert.deepEqual(e.received.file.bytes,new Uint8Array(await file.arrayBuffer()));h.allowAck();await h.session.acknowledge(e);assert.equal(e.ackPending,false);assert.equal(h.acks[0],h.acks[1]);assert.equal(h.counts().accessCount,1);
});
test('policy and transaction consent fail before side effects',async()=>{
 const h=harness();await h.session.connect();await assert.rejects(()=>h.session.upload({file,policyAccepted:false}),/Accept/);assert.equal(h.uploads.length,0);
 const e={file,policyAccepted:true};h.allowUpload();await h.session.upload(e);await assert.rejects(()=>h.session.share(e,{},false),/Confirm/);
});
test('timer uses server expiry without inventing renewal or deletion',()=>{
 assert.match(availability({expires_at:null}),/Awaiting/);assert.equal(availability({expires_at:86401},1000),'1d 0h 0m remaining');assert.match(availability({expires_at:1},2000),/refresh/);assert.match(availability({expired:true}),/provenance/);assert.throws(()=>parseHandoff('{"artifactId":"x"}'),/complete/);
});

test('grant finalization retry preserves both submitted signatures and prepared envelope',async()=>{
 let submissions=0,finalizations=0;const grants=[];
 const provider={publicKey:{toString:()=> '11111111111111111111111111111111'},connect:async()=>{},signMessage:async()=>({signature:new Uint8Array(64)})};
 const chain={buildInitializeInstruction:async()=>({instruction:{}}),buildGrantInstruction:async()=>({instruction:{},artifactAccount:'account'}),submitAndFinalize:async(_p,_i,_r,options)=>{const signature='sig-'+(++submissions);await options.onSubmitted({signature});return signature;},verifyFinalizedSignature:async()=>{}};
 const api=async(path,opts)=>{
  if(path==='/v1/grants'){grants.push(opts.body);return {};}
  if(path.endsWith('/finalize')){if(++finalizations===1)throw Error('finalization interrupted');return {};}
  if(path.startsWith('/v1/artifacts/'))return {revision:0};
  return {expires_at:null};
 };
 const s=createConsoleSession({api,getProvider:()=>provider,apiBase:'http://localhost',chain});await s.connect();const e={file,policyAccepted:true};await s.upload(e);
 const recipient={...s.publicCard(),identityId:'recipient'};
 await assert.rejects(()=>s.share(e,{...recipient,keyVersion:0},true),/keyVersion/);assert.equal(submissions,0);
 await assert.rejects(()=>s.share(e,recipient,true),/finalization interrupted/);assert.equal(submissions,2);
 const context=await s.share(e,recipient,true);assert.equal(submissions,2);assert.equal(grants.length,1);assert.equal(context.recipientIdentityId,'recipient');assert.equal(context.envelopeRevision,1);
});

test('recovery verifies registered identity without registering the operation twice',async()=>{
 const h=harness();await h.session.connect();const saved={...h.session.identity};h.session.lock();
 await assert.rejects(()=>h.session.restore(saved,[]),/registered identity/);assert.equal(h.session.identity,null);
 await h.session.restore(saved,[{identity_id:saved.identityId,wallet_public_key:saved.walletPublicKey,encryption_public_key:saved.publicKeyBase64,encryption_key_version:saved.keyVersion}]);
 assert.deepEqual(h.session.identity,saved);assert.equal(h.counts().registrationCount,1);
});

async function checkpointHarness(failSubmission=0,knownSignature=false){
 let submissions=0;const verified=[];
 const provider={publicKey:{toString:()=> '11111111111111111111111111111111'},connect:async()=>{},signMessage:async()=>({signature:new Uint8Array(64)})};
 const chain={buildInitializeInstruction:async()=>({instruction:{}}),buildGrantInstruction:async()=>({instruction:{},artifactAccount:'account'}),submitAndFinalize:async(_p,_i,_r,options)=>{
  const n=++submissions,signature='sig-'+n;
  if(n===failSubmission){if(knownSignature)await options.onSubmitted({signature});throw Error('submission interrupted');}
  await options.onSubmitted({signature});return signature;
 },verifyFinalizedSignature:async signature=>{verified.push(signature);}};
 const api=async path=>path.startsWith('/v1/artifacts/')?{revision:0}:{expires_at:null};
 const session=createConsoleSession({api,getProvider:()=>provider,apiBase:'http://localhost',chain});await session.connect();
 const exchange={file,policyAccepted:true};await session.upload(exchange);
 return {session,exchange,recipient:{...session.publicCard(),identityId:'recipient'},submissions:()=>submissions,verified};
}
for(const [stage,flag,signatureField] of [[1,'initializeStarted','initializeSignature'],[2,'grantStarted','signature']]){
 test(`checkpoint failure before submission ${stage} is retryable but persisted uncertainty stays closed`,async()=>{
  const h=await checkpointHarness();let persisted;
  await assert.rejects(()=>h.session.share(h.exchange,h.recipient,true,async()=>{
   const share=h.exchange.prepared.share;if(share?.[flag]&&!share?.[signatureField]){persisted=structuredClone(h.exchange);throw Error('checkpoint interrupted');}
  }),/checkpoint interrupted/);
  assert.equal(h.submissions(),stage-1);
  assert.equal(!!h.exchange.prepared.share[flag],false);
  // A response may be lost after the server stored the conservative checkpoint.
  // A restored copy cannot infer that no submission followed it.
  await assert.rejects(()=>h.session.share(persisted,h.recipient,true),/unresolved/);
  assert.equal(h.submissions(),stage-1);
  let retryCheckpoints=0;
  await h.session.share(h.exchange,h.recipient,true,async()=>{retryCheckpoints++;assert.equal(h.exchange.prepared.share[flag],true);});
  assert.equal(h.submissions(),2);assert.ok(retryCheckpoints>0);
 });
 test(`unknown submission ${stage} cannot be retried after restoring its state`,async()=>{
  const h=await checkpointHarness(stage);
  await assert.rejects(()=>h.session.share(h.exchange,h.recipient,true),/submission interrupted/);
  const restored=structuredClone(h.exchange);
  await assert.rejects(()=>h.session.share(restored,h.recipient,true),/unresolved/);
  assert.equal(h.submissions(),stage);
 });
 test(`known signature from interrupted submission ${stage} is reconciled without duplication`,async()=>{
  const h=await checkpointHarness(stage,true);
  await assert.rejects(()=>h.session.share(h.exchange,h.recipient,true),/submission interrupted/);
  await h.session.share(structuredClone(h.exchange),h.recipient,true);
  assert.equal(h.submissions(),2);assert.ok(h.verified.includes('sig-'+stage));
 });
}
