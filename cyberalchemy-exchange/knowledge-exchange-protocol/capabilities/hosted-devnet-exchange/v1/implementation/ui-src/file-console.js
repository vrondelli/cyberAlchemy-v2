import {createFileClient,RETENTION_POLICY} from './file-client.js';
import {generateEncryptionIdentity,bytesToBase64,messages,randomHex,sealContentKey,buildInitializeInstruction,buildGrantInstruction,submitAndFinalize,verifyFinalizedSignature} from './protocol.js';
const $=s=>document.querySelector(s);
let provider,identity,prepared,received,context,initialized=false;
const api=async(path,options={})=>{
 const response=await fetch(path,{...options,headers:{'content-type':'application/json'},cache:'no-store'});
 const result=await response.json();if(!response.ok)throw Error(result.message||result.error||`Request failed (${response.status})`);return result;
};
const authorize=async message=>{
 if(!identity || provider.publicKey.toString()!==identity.walletPublicKey)throw Error('Connect the wallet for this identity.');
 const result=await provider.signMessage(new TextEncoder().encode(message),'utf8');return {message,signature_base64:bytesToBase64(result.signature)};
};
const client=createFileClient({api,authorize});
function accepted(){return $('#policy').checked;}
function retention(status){$('#retention-status').textContent=status.expired?'File expired. Provenance remains.':status.expires_at?`Available until ${new Date(status.expires_at*1000).toLocaleString()}`:'Expiry starts after the first verified download.';}
function showContext(value){$('#handoff').value=JSON.stringify(value,null,2);}
async function refresh(){if(context)retention(await api(`/v1/files/${context.artifactId}`));}
async function run(task){
 const buttons=[...document.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);$('#status').textContent='Working…';
 try{await task();$('#status').textContent='Done.';}catch(error){$('#status').textContent=error.message;}finally{buttons.forEach(b=>b.disabled=false);}
}
$('#connect').onclick=()=>run(async()=>{
 provider=window.solana;
 if(!provider?.connect||!provider?.signMessage)throw Error('A Solana wallet with message signing is required.');
 await provider.connect();
 if(!identity){identity={...await generateEncryptionIdentity(),identityId:`file-${crypto.randomUUID()}`,walletPublicKey:provider.publicKey.toString(),registrationOperation:crypto.randomUUID()};}
 const message=messages.register(identity.registrationOperation,identity.identityId,identity.walletPublicKey,identity.publicKeyBase64,identity.keyVersion);
 await api('/v1/identities',{method:'POST',body:JSON.stringify({operation_id:identity.registrationOperation,identity_id:identity.identityId,wallet_public_key:identity.walletPublicKey,encryption_public_key:identity.publicKeyBase64,encryption_key_version:identity.keyVersion,authorization:await authorize(message)})});
 $('#identity').textContent=identity.identityId;
 $('#public-card').value=JSON.stringify({identityId:identity.identityId,walletPublicKey:identity.walletPublicKey,publicKeyBase64:identity.publicKeyBase64,keyVersion:identity.keyVersion},null,2);
});
$('#file').onchange=()=>{prepared=null;context=null;received=null;initialized=false;$('#policy').checked=false;$('#policy-detail').open=Boolean($('#file').files.length);};
$('#upload').onclick=()=>run(async()=>{
 if(!identity)throw Error('Connect your wallet first.');if(!accepted())throw Error('Accept the retention policy.');
 const file=$('#file').files[0];if(!file)throw Error('Choose a file.');
 if(!prepared)prepared=await client.prepare(file,identity,randomHex(),RETENTION_POLICY,true);
 retention(await client.upload(prepared));context=prepared.context;showContext(context);
});
$('#share').onclick=()=>run(async()=>{
 if(!prepared||!identity)throw Error('Upload a file first.');
 if(!accepted())throw Error('Accept the retention policy.');
 if(!$('#chain-consent').checked)throw Error('Confirm that you want wallet-approved Solana Devnet transactions.');
 const recipient=JSON.parse($('#recipient').value);
 if(!recipient.identityId||!recipient.publicKeyBase64||!recipient.walletPublicKey)throw Error('Paste a registered recipient public card.');
 // Pin each chain operation and signature so a retry does not submit a second transaction.
 prepared.share ??= {recipientText:JSON.stringify(recipient),operation:crypto.randomUUID()};
 const share=prepared.share;
 if(share.recipientText!==JSON.stringify(recipient))throw Error('Recipient changed during this grant. Finish the current attempt first.');
 if(!initialized){
  if(share.initializeSignature){await verifyFinalizedSignature(share.initializeSignature);initialized=true;}
  else {
  if(share.initializeStarted)throw Error('Initialization outcome is unresolved. Inspect the wallet history before retrying.');
  const instruction=await buildInitializeInstruction({walletPublicKey:identity.walletPublicKey,artifactId:context.artifactId,policyId:context.policyId,epoch:context.epoch,ciphertextSha256:context.ciphertextSha256,originatorEnvelopeSha256:prepared.request.artifact.originator_envelope_sha256,operationId:prepared.request.artifact.operation_id,apiBase:location.origin});
  share.initializeStarted=true;
  share.initializeSignature=await submitAndFinalize(provider,instruction.instruction,undefined,{onSubmitted:({signature})=>{share.initializeSignature=signature;}});initialized=true;
  }
 }
 share.revision ??= (await api(`/v1/artifacts/${context.artifactId}`)).revision;
 share.context ??= {...context,recipientIdentityId:recipient.identityId,recipientKeyVersion:recipient.keyVersion,envelopeRevision:share.revision+1};
 share.envelope ??= await sealContentKey(recipient.publicKeyBase64,prepared.contentKeyBase64,share.context);
 const e=share.envelope;
 if(!share.prepared){
  await api('/v1/grants',{method:'POST',body:JSON.stringify({operation_id:share.operation,artifact_version_id:context.artifactId,originator_id:identity.identityId,recipient_id:recipient.identityId,expected_revision:share.revision,recipient_envelope_base64:e.envelopeBase64,recipient_envelope_sha256:e.envelopeSha256,knowledge_consideration_lamports:0,authorization:await authorize(messages.grant(share.operation,context.artifactId,identity.identityId,recipient.identityId,share.revision,e.envelopeSha256))})});share.prepared=true;
 }
 if(!share.signature){
  const instruction=await buildGrantInstruction({walletPublicKey:identity.walletPublicKey,artifactId:context.artifactId,recipientWalletPublicKey:recipient.walletPublicKey,recipientEncryptionPublicKey:recipient.publicKeyBase64,recipientEnvelopeSha256:e.envelopeSha256,operationId:share.operation,expectedRevision:share.revision});
  if(share.grantStarted)throw Error('Grant outcome is unresolved. Inspect the wallet history before retrying.');
  share.artifactAccount=instruction.artifactAccount;share.grantStarted=true;
  share.signature=await submitAndFinalize(provider,instruction.instruction,undefined,{onSubmitted:({signature})=>{share.signature=signature;}});
 }
 await verifyFinalizedSignature(share.signature);
 await api(`/v1/grants/${share.operation}/finalize`,{method:'POST',body:JSON.stringify({transaction_signature:share.signature,artifact_account:share.artifactAccount})});
 showContext(share.context);
});
$('#receive').onclick=()=>run(async()=>{
 if(!identity)throw Error('Connect the recipient wallet first.');
 const input=JSON.parse($('#handoff').value);context=input;
 received=await client.receive(context,identity,accepted());
 $('#save').hidden=false;
 // Only after full authenticated decryption and checksum verification.
 await received.acknowledge();await refresh();$('#save').hidden=false;
});
$('#retry-ack').onclick=()=>run(async()=>{if(!accepted())throw Error('Accept the retention policy.');if(!received)throw Error('No verified download to acknowledge.');await received.acknowledge();await refresh();$('#save').hidden=false;});
$('#save').onclick=()=>{
 if(!received)return;const blob=new Blob([received.file.bytes],{type:'application/octet-stream'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=received.file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
};
$('#refresh').onclick=()=>run(refresh);
