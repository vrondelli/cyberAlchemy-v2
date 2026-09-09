import {createFileClient,RETENTION_POLICY} from './file-client.js';
import {generateEncryptionIdentity,parseHandoffCard,bytesToBase64,messages,randomHex,sealContentKey,buildInitializeInstruction,buildGrantInstruction,submitAndFinalize,verifyFinalizedSignature} from './protocol.js';

const chainDefaults={buildInitializeInstruction,buildGrantInstruction,submitAndFinalize,verifyFinalizedSignature};
async function checkpointBeforeSubmission(share,flag,checkpoint){
 // Persist the conservative marker before invoking the wallet. Only this live
 // call knows that a rejected checkpoint never reached submission. Restored
 // markers stay fail-closed because storage may have succeeded before a crash.
 share[flag]=true;
 try{await checkpoint();}
 catch(error){delete share[flag];throw error;}
}

// This controller owns private material; views never serialize it or store it on disk.
export function createConsoleSession({api, getProvider=()=>window.solana, apiBase=location.origin,chain=chainDefaults}) {
 const {buildInitializeInstruction,buildGrantInstruction,submitAndFinalize,verifyFinalizedSignature}=chain;
 let provider, identity, registered=false;
 const assertIdentity=()=>{if(!registered||!identity||provider?.publicKey?.toString()!==identity.walletPublicKey)throw Error('Connect the wallet for this session identity.');};
 const authorize=async message=>{
  if(!identity||provider?.publicKey?.toString()!==identity.walletPublicKey)throw Error('The wallet changed. Return to the wallet for this identity.');
  const result=await provider.signMessage(new TextEncoder().encode(message),'utf8');
  return {message,signature_base64:bytesToBase64(result.signature)};
 };
 const client=createFileClient({api,authorize});
 return {
  get identity(){return registered?identity:null;},
  lock(){provider=null;identity=null;registered=false;},
  async restore(value,registeredIdentities=[]){
   if(!value?.identityId||!value.registrationOperation||!value.publicKeyBase64||!value.privateKeyBase64||value.keyVersion!==1)throw Error('Invalid backed-up identity.');
   provider=getProvider();if(provider?.publicKey?.toString()!==value.walletPublicKey)throw Error('Recovery identity belongs to another wallet.');
   const proof=registeredIdentities.find(i=>i.identity_id===value.identityId&&i.wallet_public_key===value.walletPublicKey&&i.encryption_public_key===value.publicKeyBase64&&i.encryption_key_version===value.keyVersion);
   if(!proof)throw Error('The recovered identity does not match this account’s registered identity.');
   identity=value;registered=true;return this.publicCard();
  },
  publicCard(){if(!registered)throw Error('Connect your identity first.');return {identityId:identity.identityId,walletPublicKey:identity.walletPublicKey,publicKeyBase64:identity.publicKeyBase64,keyVersion:identity.keyVersion};},
  async connect(){
   provider=getProvider();if(!provider?.connect||!provider?.signMessage)throw Error('Install or open a Solana wallet with message signing.');
   if(registered){assertIdentity();return this.publicCard();}
   await provider.connect();
   if(!identity)identity={...await generateEncryptionIdentity(),identityId:`console-${crypto.randomUUID()}`,walletPublicKey:provider.publicKey.toString(),registrationOperation:crypto.randomUUID()};
   const message=messages.register(identity.registrationOperation,identity.identityId,identity.walletPublicKey,identity.publicKeyBase64,identity.keyVersion);
   await api('/v1/identities',{method:'POST',body:JSON.stringify({operation_id:identity.registrationOperation,identity_id:identity.identityId,wallet_public_key:identity.walletPublicKey,encryption_public_key:identity.publicKeyBase64,encryption_key_version:identity.keyVersion,authorization:await authorize(message)})});
   registered=true;return this.publicCard();
  },
  async upload(exchange,checkpoint=async()=>{}){
   assertIdentity();if(!exchange.policyAccepted)throw Error('Accept the retention policy.');
   if(!exchange.prepared){exchange.prepared=await client.prepare(exchange.file,identity,randomHex(),RETENTION_POLICY,true);exchange.context=exchange.prepared.context;await checkpoint();}
   const status=await client.upload(exchange.prepared);exchange.context=exchange.prepared.context;exchange.status=status;return status;
  },
  async share(exchange,recipient,consent,checkpoint=async()=>{}){
   if(provider?.supportsTransactions===false)throw Error('This CLI signer supports API messages only. Lock and reconnect with a browser wallet to grant access.');
   assertIdentity();if(!exchange.context||!exchange.prepared)throw Error('Upload the original first.');
   if(!consent)throw Error('Confirm the wallet-approved Solana Devnet transactions.');
   const prepared=exchange.prepared,context=exchange.context;
   let initialized=!!prepared.initialized;

 parseHandoffCard(JSON.stringify({...recipient,kind:'ca2-kep-public-identity/v1',encryptionPublicKey:recipient.publicKeyBase64}),'ca2-kep-public-identity/v1');
 // Pin each chain operation and signature so a retry does not submit a second transaction.
 prepared.share ??= {recipientText:JSON.stringify(recipient),operation:crypto.randomUUID()};
 const share=prepared.share;
 if(share.recipientText!==JSON.stringify(recipient))throw Error('Recipient changed during this grant. Finish the current attempt first.');
 if(!initialized){
  if(share.initializeSignature){await verifyFinalizedSignature(share.initializeSignature);initialized=true;prepared.initialized=true;}
  else {
  if(share.initializeStarted)throw Error('Initialization outcome is unresolved. Inspect the wallet history before retrying.');
  const instruction=await buildInitializeInstruction({walletPublicKey:identity.walletPublicKey,artifactId:context.artifactId,policyId:context.policyId,epoch:context.epoch,ciphertextSha256:context.ciphertextSha256,originatorEnvelopeSha256:prepared.request.artifact.originator_envelope_sha256,operationId:prepared.request.artifact.operation_id,apiBase:apiBase});
  await checkpointBeforeSubmission(share,'initializeStarted',checkpoint);
  share.initializeSignature=await submitAndFinalize(provider,instruction.instruction,undefined,{onSubmitted:async({signature})=>{share.initializeSignature=signature;await checkpoint();}});initialized=true;prepared.initialized=true;await checkpoint();
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
  share.artifactAccount=instruction.artifactAccount;await checkpointBeforeSubmission(share,'grantStarted',checkpoint);
  share.signature=await submitAndFinalize(provider,instruction.instruction,undefined,{onSubmitted:async({signature})=>{share.signature=signature;await checkpoint();}});await checkpoint();
 }
 await verifyFinalizedSignature(share.signature);
 await api(`/v1/grants/${share.operation}/finalize`,{method:'POST',body:JSON.stringify({transaction_signature:share.signature,artifact_account:share.artifactAccount})});share.finalized=true;await checkpoint();
 return share.context;

  },
  async receive(exchange,beforeAcknowledge=async()=>{}){
   assertIdentity();if(!exchange.policyAccepted)throw Error('Accept the retention policy.');
   exchange.received=await client.receive(exchange.context,identity,true);
   exchange.ackPending=true;
   await beforeAcknowledge(exchange.received.file);
   return this.acknowledge(exchange);
  },
  async acknowledge(exchange){
   assertIdentity();if(!exchange.policyAccepted)throw Error('Accept the retention policy.');
   if(!exchange.received)throw Error('Download and verify the original first.');
   const receipt=await exchange.received.acknowledge();exchange.ackPending=false;exchange.receipt=receipt;
   await this.refresh(exchange);return receipt;
  },
  async resumeAcknowledgement(exchange,receiptState){
   assertIdentity();if(!exchange.policyAccepted)throw Error('Accept the retention policy.');
   const receipt=await client.acknowledgeReceipt(exchange.context,identity,receiptState,true);exchange.ackPending=false;exchange.receipt=receipt;await this.refresh(exchange);return receipt;
  },
  async refresh(exchange){
   if(!exchange.context)throw Error('Upload or open a handoff first.');
   exchange.status=await api(`/v1/files/${encodeURIComponent(exchange.context.artifactId)}`);return exchange.status;
  }
 };
}
export function parseHandoff(text){
 const c=JSON.parse(text);
 if(!c||typeof c!=='object'||!['artifactId','policyId','plaintextCommitment','ciphertextSha256','contentNonceBase64','recipientIdentityId'].every(k=>typeof c[k]==='string'&&c[k].length>0)||!Number.isSafeInteger(c.epoch)||!Number.isSafeInteger(c.recipientKeyVersion)||!Number.isSafeInteger(c.envelopeRevision)||c.envelopeRevision<0)throw Error('Paste a complete KEP file handoff card.');
 return c;
}
export function availability(status, now=Date.now()){
 if(!status)return 'Not uploaded';
 if(status.expired)return 'Expired · provenance retained';
 if(status.expires_at==null)return 'Awaiting first verified download';
 const remaining=status.expires_at*1000-now;
 if(remaining<=0)return 'Expiry due · refresh status';
 const seconds=Math.ceil(remaining/1000),days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),mins=Math.floor(seconds%3600/60);
 return `${days}d ${hours}h ${mins}m remaining`;
}
