import test from 'node:test';
import assert from 'node:assert/strict';
import {sealAccount,openAccount,accountSnapshot,createAccountClient} from './account-client.js';
import {bytesToBase64} from './protocol.js';
const key=()=>bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));
const data={version:1,identity:{walletPublicKey:'wallet',privateKeyBase64:'private'},exchanges:[]};
test('vault recovery binds key, wallet, revision and ciphertext',async()=>{
 const k=key(),sealed={revision:1,...await sealAccount(data,k,'wallet',1)};assert.deepEqual(await openAccount(sealed,k,'wallet'),data);
 await assert.rejects(()=>openAccount(sealed,key(),'wallet'),/unlock/);await assert.rejects(()=>openAccount(sealed,k,'other'),/unlock/);await assert.rejects(()=>openAccount({...sealed,revision:2},k,'wallet'),/unlock/);
 assert.notEqual(sealed.ciphertext_base64,(await sealAccount(data,k,'wallet',1)).ciphertext_base64);
});
test('account snapshot excludes file payloads and verified plaintext',()=>{
 const e={context:{artifactId:'x'},file:new File(['secret'],'x'),received:{file:{bytes:'secret'}},prepared:{context:{},contentKeyBase64:'wrapped-in-account',request:{artifact:{ciphertext_base64:'file-ciphertext',operation_id:'op',originator_envelope_sha256:'digest'}}}};
 const snapshot=JSON.stringify(accountSnapshot(data.identity,[e]));assert.ok(!snapshot.includes('secret'));assert.ok(!snapshot.includes('file-ciphertext'));assert.ok(snapshot.includes('wrapped-in-account'));
});
test('account save retries same ciphertext, restores with recovery, and locks',async()=>{
 let record=null,fail=true;const writes=[];const provider={connect:async()=>{},publicKey:{toString:()=> 'wallet'},signMessage:async()=>({signature:new Uint8Array(64)})};
 const api=async(path,opts)=>{if(path.endsWith('/read'))return {account:record,packages:[]};const r=JSON.parse(opts.body);writes.push(r);record={revision:r.expected_revision+1,ciphertext_base64:r.ciphertext_base64,ciphertext_sha256:r.ciphertext_sha256};if(fail){fail=false;throw Error('lost reply');}return record;};
 const c=createAccountClient({api,getProvider:()=>provider});await c.lookup();c.createKey();const recovery=JSON.stringify(c.recovery());await assert.rejects(()=>c.save(data),/lost/);await c.save(data);assert.equal(writes[0].ciphertext_base64,writes[1].ciphertext_base64);assert.equal(writes[0].expected_revision,writes[1].expected_revision);
 c.lock();assert.equal(c.unlocked,false);assert.throws(()=>c.recovery(),/Unlock/);await c.lookup();assert.deepEqual(await c.unlock(recovery),data);
});
test('failed first lookup does not pin an unconnected wallet',async()=>{
 let wallet='wallet-a';const provider=()=>({connect:async()=>{},publicKey:{toString:()=>wallet},signMessage:async()=>{throw Error('signing cancelled')}});
 const client=createAccountClient({api:async()=>{throw Error('network must not run')},getProvider:provider});
 await assert.rejects(()=>client.lookup(),/cancelled/);wallet='wallet-b';
 await assert.rejects(()=>client.lookup(),/cancelled/);assert.equal(client.wallet,undefined);
});
