import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Keypair} from '@solana/web3.js';
import {createAccount,openWorkspace,receiveFile,sendFile} from './client.mjs';

function memoryService(){
 const identities=new Map(),accounts=new Map(),files=new Map(),grants=new Map(),control={failAcknowledgement:false,failAccountWrite:false};
 const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
 return {state:{identities,accounts,files,grants},fetch:async(url,options={})=>{
  const path=new URL(url).pathname,method=options.method||'GET',body=options.body?JSON.parse(options.body):null;
  if(path==='/health')return json({status:'ok',capability_id:'CA2-CAP-HOST-DEVNET-KNOWLEDGE-EXCHANGE',network:'solana-devnet',program_id:'ns5yjVYuX3bsaMWdG4pPF5hmajdD21xHDVLMbJUCeh1',custody:'ciphertext-only'});
  if(path==='/v1/identities'&&method==='POST'){identities.set(body.identity_id,{identity_id:body.identity_id,wallet_public_key:body.wallet_public_key,encryption_public_key:body.encryption_public_key,encryption_key_version:body.encryption_key_version});return json({status:'registered'});}
  if(path==='/v1/account/read'&&method==='POST'){const owned=[...identities.values()].filter(x=>x.wallet_public_key===body.wallet_public_key),ids=new Set(owned.map(x=>x.identity_id));return json({account:accounts.get(body.wallet_public_key)||null,identities:owned,packages:[...files.values()].filter(x=>x.owners.some(id=>ids.has(id))).map(x=>({artifact_id:x.artifact.artifact_version_id,originator:ids.has(x.artifact.originator_id),status:x.status}))});}
  if(path==='/v1/account/write'&&method==='POST'){if(control.failAccountWrite){control.failAccountWrite=false;return json({message:'account write interrupted'},503);}const record={revision:body.expected_revision+1,ciphertext_base64:body.ciphertext_base64,ciphertext_sha256:body.ciphertext_sha256};accounts.set(body.wallet_public_key,record);return json(record);}
  if(path==='/v1/files'&&method==='POST'){const a=body.artifact;files.set(a.artifact_version_id,{artifact:a,original_bytes:body.original_bytes,owners:[a.originator_id],envelopes:new Map([[a.originator_id,{base64:a.originator_envelope_base64,sha256:a.originator_envelope_sha256}]]),revision:0,status:{artifact_id:a.artifact_version_id,original_bytes:body.original_bytes,expires_at:null,expired:false}});return json(files.get(a.artifact_version_id).status);}
  if(path.startsWith('/v1/artifacts/')&&method==='GET'){const id=decodeURIComponent(path.split('/').pop()),file=files.get(id);return file?json({artifact_version_id:id,revision:file.revision,owners:file.owners}):json({message:'missing'},404);}
  if(path==='/v1/grants'&&method==='POST'){grants.set(body.operation_id,body);return json({status:'prepared'});}
  if(/^\/v1\/grants\/[^/]+\/finalize$/.test(path)&&method==='POST'){const operation=path.split('/')[3],grant=grants.get(operation),file=files.get(grant.artifact_version_id);file.owners.push(grant.recipient_id);file.envelopes.set(grant.recipient_id,{base64:grant.recipient_envelope_base64,sha256:grant.recipient_envelope_sha256});file.revision++;return json({status:'finalized',revision:file.revision});}
  const access=path.match(/^\/v1\/files\/([^/]+)\/access$/);if(access&&method==='POST'){const file=files.get(decodeURIComponent(access[1])),envelope=file.envelopes.get(body.requester_id);if(!envelope)return json({message:'denied'},403);return json({ciphertext_base64:file.artifact.ciphertext_base64,ciphertext_sha256:file.artifact.ciphertext_sha256,recipient_envelope_base64:envelope.base64,recipient_envelope_sha256:envelope.sha256,revision:file.revision});}
  const ack=path.match(/^\/v1\/files\/([^/]+)\/acknowledge$/);if(ack&&method==='POST'){if(control.failAcknowledgement){control.failAcknowledgement=false;return json({message:'receipt interrupted'},503);}const file=files.get(decodeURIComponent(ack[1]));file.status.expires_at=2_000_000_000;return json({attempt_id:body.attempt_id,acknowledged_at:1_968_464_000,expires_at:file.status.expires_at});}
  const status=path.match(/^\/v1\/files\/([^/]+)$/);if(status&&method==='GET')return json(files.get(decodeURIComponent(status[1])).status);
  return json({message:`unhandled ${method} ${path}`},500);
 },control};
}
const chain={buildInitializeInstruction:async()=>({instruction:{}}),buildGrantInstruction:async()=>({instruction:{},artifactAccount:'artifact-account'}),submitAndFinalize:async(_p,_i,_r,options)=>{const signature='signature-'+crypto.randomUUID();await options.onSubmitted({signature});return signature;},verifyFinalizedSignature:async()=>{}};
async function keypair(path){const pair=Keypair.generate();await writeFile(path,JSON.stringify([...pair.secretKey]),{mode:0o600});return pair;}

test('two CLI identities create, recover, send, receive and verify without browser globals',async()=>{
 const root=await mkdtemp(join(tmpdir(),'kep-cli-')),service=memoryService(),apiBase='https://kep.test',aKey=join(root,'a.json'),bKey=join(root,'b.json'),aRecovery=join(root,'a-recovery.json'),bRecovery=join(root,'b-recovery.json');await keypair(aKey);await keypair(bKey);
 const common={apiBase,fetchImpl:service.fetch,approve:async()=>true,chain};
 const a=await createAccount({...common,keypairPath:aKey,recoveryPath:aRecovery}),b=await createAccount({...common,keypairPath:bKey,recoveryPath:bRecovery});assert.notEqual(a.publicCard.identityId,b.publicCard.identityId);
 const recipient=join(root,'recipient.json');await writeFile(recipient,JSON.stringify(b.publicCard));const original=join(root,'original.bin'),expected=crypto.getRandomValues(new Uint8Array([0,255,1,128,13,10].length));await writeFile(original,expected);
 const handoffPath=join(root,'handoff.json');const sent=await sendFile({...common,keypairPath:aKey,recoveryPath:aRecovery,filePath:original,recipientPath:recipient,handoffPath,acceptRetention:true,approveTransactions:true});assert.equal(sent.handoff.recipientIdentityId,b.publicCard.identityId);
 const outputPath=join(root,'received.bin');const received=await receiveFile({...common,keypairPath:bKey,recoveryPath:bRecovery,handoffPath,outputPath,acceptRetention:true});assert.equal(received.acknowledged,true);assert.deepEqual(new Uint8Array(await readFile(outputPath)),expected);
 const reopenedA=await openWorkspace({...common,keypairPath:aKey,recoveryPath:aRecovery}),reopenedB=await openWorkspace({...common,keypairPath:bKey,recoveryPath:bRecovery});assert.equal(reopenedA.exchanges.length,1);assert.equal(reopenedB.exchanges.length,1);
});

test('saved original has a durable acknowledgement-only retry',async()=>{
 const root=await mkdtemp(join(tmpdir(),'kep-cli-')),service=memoryService(),apiBase='https://kep.test',aKey=join(root,'a.json'),bKey=join(root,'b.json'),aRecovery=join(root,'a-recovery.json'),bRecovery=join(root,'b-recovery.json');await keypair(aKey);await keypair(bKey);const common={apiBase,fetchImpl:service.fetch,approve:async()=>true,chain};
 const a=await createAccount({...common,keypairPath:aKey,recoveryPath:aRecovery}),b=await createAccount({...common,keypairPath:bKey,recoveryPath:bRecovery});const recipient=join(root,'recipient.json');await writeFile(recipient,JSON.stringify(b.publicCard));const original=join(root,'original'),handoffPath=join(root,'handoff');await writeFile(original,'durable receipt');await sendFile({...common,keypairPath:aKey,recoveryPath:aRecovery,filePath:original,recipientPath:recipient,handoffPath,acceptRetention:true,approveTransactions:true});
 const outputPath=join(root,'received'),receiptPath=outputPath+'.kep-receipt.json';service.control.failAcknowledgement=true;await assert.rejects(()=>receiveFile({...common,keypairPath:bKey,recoveryPath:bRecovery,handoffPath,outputPath,acceptRetention:true}),/Original verified and saved/);assert.equal((await readFile(outputPath,'utf8')),'durable receipt');
 const {acknowledgeReceipt}=await import('./client.mjs');const result=await acknowledgeReceipt({...common,keypairPath:bKey,recoveryPath:bRecovery,receiptPath});assert.equal(result.acknowledged,true);assert.equal(JSON.parse(await readFile(receiptPath,'utf8')).format,'kep-acknowledged-receipt-v1');
});

test('service identity, effect consent and output overwrite fail closed',async()=>{
 const bad=async()=>new Response(JSON.stringify({status:'ok',capability_id:'wrong'}),{headers:{'content-type':'application/json'}});await assert.rejects(()=>createAccount({apiBase:'https://bad.test',fetchImpl:bad,keypairPath:'unused',recoveryPath:'unused'}),/expected KEP/);
 const root=await mkdtemp(join(tmpdir(),'kep-cli-')),service=memoryService(),key=join(root,'key.json'),recovery=join(root,'recovery.json');await keypair(key);const common={apiBase:'https://kep.test',fetchImpl:service.fetch,keypairPath:key,recoveryPath:recovery,approve:async()=>true,chain};await createAccount(common);
 await assert.rejects(()=>sendFile({...common,filePath:'unused',recipientPath:'unused',handoffPath:'unused'}),/accept/);
 await assert.rejects(()=>sendFile({...common,filePath:'unused',recipientPath:'unused',handoffPath:'unused',acceptRetention:true}),/approve/);
});

test('account creation resumes from a private recovery file after account-write failure',async()=>{
 const root=await mkdtemp(join(tmpdir(),'kep-cli-')),service=memoryService(),key=join(root,'key.json'),recovery=join(root,'recovery.json');await keypair(key);service.control.failAccountWrite=true;const options={apiBase:'https://kep.test',fetchImpl:service.fetch,keypairPath:key,recoveryPath:recovery,approve:async()=>true,chain};
 await assert.rejects(()=>createAccount(options),/interrupted/);const first=JSON.parse(await readFile(recovery,'utf8'));assert.equal(first.format,'kep-cli-recovery-v1');assert.ok(first.bootstrap.ciphertext_base64);
 const resumed=await createAccount(options);assert.equal(resumed.resumed,true);assert.equal((await openWorkspace(options)).publicCard.identityId,resumed.publicCard.identityId);
});

test('interrupted send resumes exact encrypted journal without duplicate chain submission',async()=>{
 const root=await mkdtemp(join(tmpdir(),'kep-cli-')),service=memoryService(),apiBase='https://kep.test',aKey=join(root,'a.json'),bKey=join(root,'b.json'),aRecovery=join(root,'a-recovery.json'),bRecovery=join(root,'b-recovery.json');await keypair(aKey);await keypair(bKey);
 let submissions=0,interrupt=true;const interruptedChain={buildInitializeInstruction:chain.buildInitializeInstruction,buildGrantInstruction:chain.buildGrantInstruction,verifyFinalizedSignature:chain.verifyFinalizedSignature,submitAndFinalize:async(_p,_i,_r,options)=>{const signature='durable-signature-'+(++submissions);await options.onSubmitted({signature});if(interrupt){interrupt=false;throw Error('simulated finality interruption');}return signature;}};
 const common={apiBase,fetchImpl:service.fetch,approve:async()=>true,chain:interruptedChain};const a=await createAccount({...common,keypairPath:aKey,recoveryPath:aRecovery}),b=await createAccount({...common,keypairPath:bKey,recoveryPath:bRecovery});
 const recipient=join(root,'recipient.json'),original=join(root,'original.bin'),handoffPath=join(root,'handoff.json'),journalPath=join(root,'send.journal');await writeFile(recipient,JSON.stringify(b.publicCard));await writeFile(original,'journal-secret-original');
 const options={...common,keypairPath:aKey,recoveryPath:aRecovery,filePath:original,recipientPath:recipient,handoffPath,journalPath,acceptRetention:true,approveTransactions:true};
 await assert.rejects(()=>sendFile(options),/Send journal retained/);const sealed=JSON.parse(await readFile(journalPath,'utf8'));assert.equal(sealed.format,'kep-encrypted-journal-v1');assert.doesNotMatch(JSON.stringify(sealed),/journal-secret-original|durable-signature-1/);
 const result=await sendFile(options);assert.equal(result.journalResumed,true);assert.equal(submissions,2);assert.equal(result.handoff.recipientIdentityId,b.publicCard.identityId);await assert.rejects(()=>readFile(journalPath),error=>error.code==='ENOENT');
});
