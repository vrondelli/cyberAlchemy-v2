import {bytesToBase64,base64ToBytes,sha256Hex,signedMessage} from './protocol.js';
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
export const accountMessage=(action,r)=>signedMessage('account-'+action,[r.wallet_public_key,r.expires_at,...(action==='write'?[r.expected_revision,r.ciphertext_sha256]:[])]);
const aad=(wallet,revision)=>encoder.encode(JSON.stringify(['kep-account-v1',wallet,revision]));
const importKey=key=>{const bytes=base64ToBytes(key);if(bytes.length!==32)throw Error('Invalid recovery key.');return crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt','decrypt']);};
export async function sealAccount(value,key,wallet,revision){
 const iv=crypto.getRandomValues(new Uint8Array(12)),plain=encoder.encode(JSON.stringify(value));
 if(plain.length>999972)throw Error('Account backup exceeds its current size limit.');
 const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(wallet,revision),tagLength:128},await importKey(key),plain));
 const bytes=new Uint8Array(iv.length+encrypted.length);bytes.set(iv);bytes.set(encrypted,iv.length);
 return {ciphertext_base64:bytesToBase64(bytes),ciphertext_sha256:await sha256Hex(bytes)};
}
export async function openAccount(record,key,wallet){
 try{
  const bytes=base64ToBytes(record.ciphertext_base64);
  if(await sha256Hex(bytes)!==record.ciphertext_sha256)throw Error('digest');
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12),additionalData:aad(wallet,record.revision),tagLength:128},await importKey(key),bytes.slice(12));
  const value=JSON.parse(decoder.decode(plain));
  if(value.version!==1||value.identity?.walletPublicKey!==wallet||!value.identity.privateKeyBase64||!Array.isArray(value.exchanges))throw Error('schema');
  return value;
 }catch{throw Error('Unable to unlock this account. Check the wallet and recovery file.');}
}
export function accountSnapshot(identity,exchanges){
 return {version:1,identity,exchanges:exchanges.filter(e=>e.context).map(e=>{
  const {id,title,context,direction,history,policyAccepted,recipientName,recipientText,chainConsent,shared,handoff,pendingReceipt}=e;
  // Never duplicate original payloads or received plaintext into account storage.
  const p=e.prepared;
  const prepared=p?{context:p.context,contentKeyBase64:p.contentKeyBase64,initialized:p.initialized,share:p.share,request:{artifact:{operation_id:p.request.artifact.operation_id,originator_envelope_sha256:p.request.artifact.originator_envelope_sha256}}}:undefined;
  return {id,title,context,direction,history,policyAccepted,recipientName,recipientText,chainConsent,shared,handoff,pendingReceipt,prepared};
 })};
}
export function createAccountClient({api,getProvider=()=>window.solana,now=()=>Date.now()}){
 let provider,wallet,key,revision=0,pending=null,record=null;
 async function sign(action,body){
  if(!provider||provider.publicKey?.toString()!==wallet)throw Error('The wallet changed. Lock this account before switching.');
  const r={...body,wallet_public_key:wallet,expires_at:Math.floor(now()/1000)+90};
  const message=accountMessage(action,r),signed=await provider.signMessage(encoder.encode(message),'utf8');
  return {...r,authorization:{message,signature_base64:bytesToBase64(signed.signature)}};
 }
 return {
  get wallet(){return wallet;},get unlocked(){return !!key;},get exists(){return !!record;},get pending(){return !!pending;},
  async lookup(){
   const previousProvider=provider,previousWallet=wallet,nextProvider=getProvider();
   if(!nextProvider?.connect||!nextProvider?.signMessage)throw Error('A Solana wallet with message signing is required.');
   try{
    await nextProvider.connect();const next=nextProvider.publicKey.toString();
    if(previousWallet&&next!==previousWallet)throw Error('Lock the current account before switching wallets.');
    provider=nextProvider;wallet=next;
    const result=await api('/v1/account/read',{method:'POST',body:JSON.stringify(await sign('read',{}))});record=result.account;return result;
   }catch(error){provider=previousProvider;wallet=previousWallet;throw error;}
  },
  createKey(){if(record)throw Error('Account already exists. Unlock it with its recovery file.');key??=bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));revision=0;return this.recovery();},
  adoptRecovery(text){const backup=JSON.parse(text);if(record||backup.format!=='kep-account-recovery-v1'||backup.walletPublicKey!==wallet||typeof backup.recoveryKey!=='string')throw Error('Cannot resume account creation with this recovery file.');key=backup.recoveryKey;revision=0;pending=null;return backup;},
  recovery(){if(!key)throw Error('Unlock your account first.');return {format:'kep-account-recovery-v1',walletPublicKey:wallet,recoveryKey:key};},
  async unlock(text){const backup=JSON.parse(text);if(backup.format!=='kep-account-recovery-v1'||backup.walletPublicKey!==wallet||!record)throw Error('Select the recovery file for this wallet.');const value=await openAccount(record,backup.recoveryKey,wallet);key=backup.recoveryKey;revision=record.revision;pending=null;return value;},
  async save(snapshot){if(!key)throw Error('Create or unlock your account first.');
   // Pin ciphertext until acknowledgement. Re-sign on retry without replacing its revision or bytes.
   pending??={expected_revision:revision,...await sealAccount(snapshot,key,wallet,revision+1)};
   const result=await api('/v1/account/write',{method:'POST',body:JSON.stringify(await sign('write',pending))});revision=result.revision;record=result;pending=null;return result;
  },
  lock(){provider=null;wallet=null;key=null;revision=0;pending=null;record=null;}
 };
}
