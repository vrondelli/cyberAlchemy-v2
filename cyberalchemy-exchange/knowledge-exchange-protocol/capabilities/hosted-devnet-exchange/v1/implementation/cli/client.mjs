import {readFile} from 'node:fs/promises';
import {basename,resolve} from 'node:path';
import {createAccountClient,accountSnapshot,openAccount,sealAccount} from '../ui-src/account-client.js';
import {createConsoleSession,parseHandoff} from '../ui-src/console-session.js';
import {PROGRAM_ID} from '../ui-src/protocol.js';
import {createLocalProvider,loadKeypair} from './provider.mjs';
import {readEncryptedJournal,readJson,removePrivateFile,writeEncryptedJournal,writePrivateJson,writeVerifiedFile} from './storage.mjs';

const CAPABILITY='CA2-CAP-HOST-DEVNET-KNOWLEDGE-EXCHANGE';
export function normalizeApiBase(value){const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('API base must be an HTTP(S) origin with no credentials, path, query or fragment.');return url.origin;}
export function createApi(base,{fetchImpl=fetch}={}){const origin=normalizeApiBase(base);return async(path,options={})=>{const response=await fetchImpl(origin+path,{...options,redirect:'manual',cache:'no-store',headers:{accept:'application/json',...(options.body?{'content-type':'application/json'}:{})}});if(response.status>=300&&response.status<400)throw Error('KEP API redirects are not accepted.');let body;try{body=await response.json();}catch{throw Error(`KEP API returned non-JSON (${response.status}).`);}if(!response.ok)throw Error(body.message||body.error||`KEP API request failed (${response.status}).`);return body;};}
export async function verifyService(api){const health=await api('/health');if(health.status!=='ok'||health.capability_id!==CAPABILITY||health.network!=='solana-devnet'||health.program_id!==PROGRAM_ID||health.custody!=='ciphertext-only')throw Error('The endpoint is not the expected KEP Devnet service.');return health;}

async function providerFor(keypairPath,approve){return createLocalProvider(await loadKeypair(keypairPath),{approve});}
function unpackRecovery(value){if(value?.format==='kep-account-recovery-v1')return value;if(value?.format==='kep-cli-recovery-v1'&&value.account?.format==='kep-account-recovery-v1')return value.account;throw Error('Expected a KEP account recovery file.');}

export async function createAccount({apiBase,keypairPath,recoveryPath,approve,chain,fetchImpl}){
 const api=createApi(apiBase,{fetchImpl});await verifyService(api);const provider=await providerFor(keypairPath,approve),getProvider=()=>provider;
 const account=createAccountClient({api,getProvider});const lookup=await account.lookup();if(lookup.account)throw Error('An account already exists for this wallet. Use login with its recovery file.');
 const session=createConsoleSession({api,getProvider,apiBase:normalizeApiBase(apiBase),chain});let recoveryFile,resumed=false;
 try{recoveryFile=await readJson(recoveryPath,64_000);}catch(error){if(error.code!=='ENOENT')throw error;}
 if(recoveryFile){
  const recovery=unpackRecovery(recoveryFile);if(!recoveryFile.bootstrap)throw Error('Recovery file exists but has no resumable account-creation state.');account.adoptRecovery(JSON.stringify(recovery));const snapshot=await openAccount(recoveryFile.bootstrap,recovery.recoveryKey,account.wallet);await session.restore(snapshot.identity,lookup.identities);resumed=true;
 }else{
  await session.connect();account.createKey();const recovery=account.recovery(),snapshot=accountSnapshot(session.identity,[]),bootstrap={revision:0,...await sealAccount(snapshot,recovery.recoveryKey,account.wallet,0)};
  await writePrivateJson(recoveryPath,{format:'kep-cli-recovery-v1',account:recovery,bootstrap,createdAt:new Date().toISOString()});
 }
 await account.save(accountSnapshot(session.identity,[]));return {walletPublicKey:account.wallet,publicCard:session.publicCard(),recoveryPath,resumed};
}

export async function openWorkspace({apiBase,keypairPath,recoveryPath,approve,chain,fetchImpl}){
 const api=createApi(apiBase,{fetchImpl});await verifyService(api);const provider=await providerFor(keypairPath,approve),getProvider=()=>provider;
 const account=createAccountClient({api,getProvider});const lookup=await account.lookup();if(!lookup.account)throw Error('No KEP account exists for this wallet. Run account create first.');
 const recovery=unpackRecovery(await readJson(recoveryPath,16_384));const value=await account.unlock(JSON.stringify(recovery));
 const session=createConsoleSession({api,getProvider,apiBase:normalizeApiBase(apiBase),chain});await session.restore(value.identity,lookup.identities);
 const exchanges=Array.isArray(value.exchanges)?value.exchanges:[];let syncing=false;
 const sync=async()=>{if(syncing)throw Error('Concurrent workspace save rejected.');syncing=true;try{await account.save(accountSnapshot(session.identity,exchanges));}finally{syncing=false;}};
 return {api,account,session,exchanges,sync,publicCard:session.publicCard()};
}

export async function sendFile(options){
 if(!options.acceptRetention)throw Error('Explicitly accept kep-file-retention-v1 before sending.');if(!options.approveTransactions)throw Error('Explicitly approve Solana Devnet transactions and fees before sending.');
 const workspace=await openWorkspace(options),recipient=await readJson(options.recipientPath,16_384),recovery=unpackRecovery(await readJson(options.recoveryPath,16_384));
 const filePath=resolve(options.filePath),handoffPath=resolve(options.handoffPath),journalPath=resolve(options.journalPath||`${options.handoffPath}.kep-send.json`);
 if(journalPath===handoffPath)throw Error('The send journal and handoff output must use different paths.');
 const scope={apiBase:normalizeApiBase(options.apiBase),walletPublicKey:workspace.account.wallet};let saved;
 try{saved=await readEncryptedJournal(journalPath,{key:recovery.recoveryKey,scope});}catch(error){if(error.code!=='ENOENT')throw error;}
 let exchange;
 if(saved){
  if(saved.format!=='kep-send-journal-v1'||saved.filePath!==filePath||saved.handoffPath!==handoffPath||saved.recipientText!==JSON.stringify(recipient)||!saved.exchange?.id||!saved.exchange.prepared)throw Error('The send journal is bound to different command inputs. Resume with the original file, recipient and handoff paths.');
  exchange=workspace.exchanges.find(value=>value.id===saved.exchange.id);if(exchange)Object.assign(exchange,saved.exchange);else{exchange=saved.exchange;workspace.exchanges.unshift(exchange);}
 }else{
  const bytes=await readFile(filePath);if(bytes.length>10_000_000)throw Error('Choose one file of 10 MB or less.');
  const file=new File([bytes],basename(filePath),{type:'application/octet-stream'});exchange={id:crypto.randomUUID(),title:basename(filePath),file,policyAccepted:true,direction:'share',history:['Original prepared by CLI']};workspace.exchanges.unshift(exchange);
 }
 const checkpoint=async()=>{const {file,...durableExchange}=exchange;await writeEncryptedJournal(journalPath,{format:'kep-send-journal-v1',filePath,handoffPath,recipientText:JSON.stringify(recipient),exchange:durableExchange},{key:recovery.recoveryKey,scope});await workspace.sync();};
 const history=value=>{if(!exchange.history.includes(value))exchange.history.push(value);};
 try{
  await workspace.session.upload(exchange,checkpoint);history('Encrypted original uploaded');await checkpoint();
  const handoff=await workspace.session.share(exchange,recipient,true,checkpoint);exchange.handoff=handoff;exchange.shared=true;exchange.recipientName=recipient.identityId;history('Recipient grant finalized on Devnet');await checkpoint();
  await writePrivateJson(handoffPath,handoff,{overwrite:options.overwrite});await removePrivateFile(journalPath);return {artifactId:exchange.context.artifactId,handoff,history:exchange.history,journalResumed:!!saved};
 }catch(error){error.message+=` Send journal retained at ${journalPath}. Resume with the same send command.`;throw error;}
}

export async function receiveFile(options){
 if(!options.acceptRetention)throw Error('Explicitly accept kep-file-retention-v1 before receiving.');const workspace=await openWorkspace(options),context=parseHandoff(JSON.stringify(await readJson(options.handoffPath,16_384)));
 const exchange={id:crypto.randomUUID(),title:'Received package',context,direction:'receive',policyAccepted:true,history:['Public handoff opened']};workspace.exchanges.unshift(exchange);await workspace.session.refresh(exchange);
 let savedPath;try{await workspace.session.receive(exchange,async file=>{savedPath=await writeVerifiedFile(options.outputPath,file.bytes,{overwrite:options.overwrite});exchange.title=file.name;exchange.history.push('Original verified and saved by CLI');});}catch(error){
  if(exchange.received){const receiptPath=options.receiptPath||`${options.outputPath}.kep-receipt.json`;await writePrivateJson(receiptPath,{format:'kep-pending-receipt-v1',context,receiptState:exchange.received.receiptState,savedPath,error:error.message},{overwrite:true});exchange.pendingReceipt=receiptPath;await workspace.sync();throw Error(`Original verified and saved at ${savedPath}. Acknowledgement is pending; run kep acknowledge ${receiptPath}.`);}throw error;
 }finally{if(exchange.received&&!exchange.pendingReceipt)await workspace.sync();}
 if(!exchange.receipt)throw Error(`Original saved at ${savedPath}; acknowledgement remains pending.`);
 exchange.history.push('Download receipt acknowledged');await workspace.sync();return {artifactId:context.artifactId,savedPath,sha256:exchange.received.file.sha256,acknowledged:true,expiresAt:exchange.receipt.expires_at};
}

export async function acknowledgeReceipt(options){
 const workspace=await openWorkspace(options),pending=await readJson(options.receiptPath,32_768);if(pending?.format!=='kep-pending-receipt-v1')throw Error('Expected a KEP pending receipt file.');
 const exchange=workspace.exchanges.find(value=>value.context?.artifactId===pending.context?.artifactId)||{id:crypto.randomUUID(),title:'Received package',context:pending.context,direction:'receive',policyAccepted:true,history:[]};if(!workspace.exchanges.includes(exchange))workspace.exchanges.unshift(exchange);exchange.policyAccepted=true;
 const receipt=await workspace.session.resumeAcknowledgement(exchange,pending.receiptState);exchange.history.push('Download receipt acknowledged by CLI');exchange.pendingReceipt=undefined;await workspace.sync();await writePrivateJson(options.receiptPath,{format:'kep-acknowledged-receipt-v1',artifactId:pending.context.artifactId,receipt},{overwrite:true});return {artifactId:pending.context.artifactId,acknowledged:true,expiresAt:receipt.expires_at,savedPath:pending.savedPath};
}
