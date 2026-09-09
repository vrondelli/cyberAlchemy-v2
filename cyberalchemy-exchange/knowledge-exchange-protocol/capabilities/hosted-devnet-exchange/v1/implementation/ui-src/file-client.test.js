import test from 'node:test';
import assert from 'node:assert/strict';
import {encryptFile,decryptFile,MAX_FILE_BYTES,createFileClient,uploadMessage,commandMessage} from './file-client.js';
import {encryptBytes,concatBytes,sha256Hex} from './protocol.js';
const file=(bytes,name='original.bin')=>({name,type:'application/octet-stream',size:bytes.length,arrayBuffer:async()=>bytes.buffer});
const ctx=e=>({artifactId:'file-1',policyId:'policy-1',epoch:1,...e});
test('arbitrary binary including invalid UTF-8 recovers byte for byte',async()=>{
 for(const bytes of [new Uint8Array(),new Uint8Array([0,255,192,128,13,10,0,254]),new Uint8Array(MAX_FILE_BYTES).fill(231)]){
  const e=await encryptFile(file(bytes),'file-1','policy-1');const result=await decryptFile(e.ciphertextBase64,e.contentKeyBase64,ctx(e));assert.deepEqual(result.bytes,bytes);
 }
});
test('oversize rejected before reading or encrypting',async()=>{
 await assert.rejects(()=>encryptFile({size:MAX_FILE_BYTES+1,arrayBuffer(){throw Error('must not read')}},'a','p'),/10 MB/);
});
test('tampering and wrong key cannot produce original bytes',async()=>{
 const e=await encryptFile(file(new Uint8Array([1,255])),'file-1','policy-1');const altered=Buffer.from(e.ciphertextBase64,'base64');altered[30]^=1;
 await assert.rejects(()=>decryptFile(altered.toString('base64'),e.contentKeyBase64,ctx(e)));
});
test('manifest hash and path separators are checked',async()=>{
 const e=await encryptFile(file(new Uint8Array([1]),'../unsafe.bin'),'file-1','policy-1');assert.equal((await decryptFile(e.ciphertextBase64,e.contentKeyBase64,ctx(e))).name,'.._unsafe.bin');
 const data=new Uint8Array([255]);const m=new TextEncoder().encode(JSON.stringify({format:'kep-original-file-v1',name:'x',type:'text/plain',size:1,sha256:'0'.repeat(64)}));const length=new Uint8Array(4);new DataView(length.buffer).setUint32(0,m.length);
 const bad=await encryptBytes(concatBytes(length,m,data),'file-1','policy-1');await assert.rejects(()=>decryptFile(bad.ciphertextBase64,bad.contentKeyBase64,ctx(bad)),/verification/);
});
test('policy rejection makes no network call',async()=>{
 const client=createFileClient({api(){throw Error('network used')},authorize(){throw Error('wallet used')}});
 await assert.rejects(()=>client.prepare(file(new Uint8Array([1])),{},'x','p',false),/Accept/);
 await assert.rejects(()=>client.receive({}, {}, false),/Accept/);
});
test('signed commands bind action, identity, attempt, policy and revision',()=>{
 const c={requester_id:'a',attempt_id:'n',policy_accepted:true};assert.notEqual(commandMessage('access','x',c,'d',1),commandMessage('acknowledge','x',c,'d',1));assert.notEqual(commandMessage('access','x',c,'d',1),commandMessage('access','x',c,'d',2));
});

test('independent recipient decrypts binary and acknowledgement is separately retryable',async()=>{
 const {generateEncryptionIdentity,sealContentKey}=await import('./protocol.js');
 const a={...await generateEncryptionIdentity(),identityId:'a'},b={...await generateEncryptionIdentity(),identityId:'b'};
 const original=new Uint8Array([0,255,192,128,13,10]);
 const signer=async message=>({message,signature_base64:'test-signature'});
 const sender=createFileClient({api:async()=>({}),authorize:signer});
 const prepared=await sender.prepare(file(original),a,'file-1','policy-1',true);
 const context={...prepared.context,recipientIdentityId:'b',envelopeRevision:1};
 const envelope=await sealContentKey(b.publicKeyBase64,prepared.contentKeyBase64,context);
 let acknowledgements=0,failAck=true,tampered=false;
 const receiver=createFileClient({authorize:signer,api:async(path)=>{
  if(path.endsWith('/acknowledge')){acknowledgements++;if(failAck)throw Error('network interrupted');return {expires_at:123};}
  if(path.endsWith('/access'))return {ciphertext_base64:tampered?'AAAA':prepared.request.artifact.ciphertext_base64,ciphertext_sha256:context.ciphertextSha256,recipient_envelope_base64:envelope.envelopeBase64,recipient_envelope_sha256:envelope.envelopeSha256,revision:1};
  return {revision:1};
 }});
 const result=await receiver.receive(context,b,true,'stable-attempt');assert.deepEqual(result.file.bytes,original);assert.equal(acknowledgements,0);
 await assert.rejects(result.acknowledge,/network/);assert.deepEqual(result.file.bytes,original);failAck=false;await result.acknowledge();assert.equal(acknowledgements,2);
 tampered=true;await assert.rejects(()=>receiver.receive(context,b,true),/verification/);assert.equal(acknowledgements,2);
 await assert.rejects(()=>receiver.receive(context,a,true));
});
test('verified bytes survive cancelled acknowledgement signing',async()=>{
 const {generateEncryptionIdentity}=await import('./protocol.js');const identity={...await generateEncryptionIdentity(),identityId:'a'};
 const sender=createFileClient({api:async()=>({}),authorize:async message=>({message,signature_base64:'fixture'})});
 const prepared=await sender.prepare(file(new Uint8Array([7,8,9])),identity,'file-1','policy-1',true);
 let signing=0;const receiver=createFileClient({authorize:async message=>{if(message.includes('file-acknowledge')){signing++;throw Error('cancelled')}return {message,signature_base64:'fixture'};},api:async path=>path.endsWith('/access')?{ciphertext_base64:prepared.request.artifact.ciphertext_base64,ciphertext_sha256:prepared.context.ciphertextSha256,recipient_envelope_base64:prepared.request.artifact.originator_envelope_base64,recipient_envelope_sha256:prepared.request.artifact.originator_envelope_sha256,revision:0}:{revision:0}});
 const received=await receiver.receive(prepared.context,identity,true,'attempt');assert.deepEqual(received.file.bytes,new Uint8Array([7,8,9]));
 await assert.rejects(()=>received.acknowledge(),/cancelled/);assert.equal(signing,1);assert.deepEqual(received.file.bytes,new Uint8Array([7,8,9]));
});
