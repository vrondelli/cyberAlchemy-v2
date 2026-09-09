import test from 'node:test';
import assert from 'node:assert/strict';
import {Keypair} from '@solana/web3.js';
import {createCliProvider} from './cli-provider.js';
import {prepareSignature} from '../static/kep-sign.mjs';
import {accountMessage,createAccountClient} from './account-client.js';
const origin='http://127.0.0.1:8783';
const pair=Keypair.generate(),wallet=pair.publicKey.toString();
const sign=request=>prepareSignature(request,[...pair.secretKey],origin).complete();

test('CLI signer connects through the real account client without a browser wallet',async()=>{
 const provider=createCliProvider(wallet,{origin,requestSignature:sign});let request;
 const account=createAccountClient({getProvider:()=>provider,api:async(path,options)=>{assert.equal(path,'/v1/account/read');request=JSON.parse(options.body);return {account:null};}});
 await account.lookup();assert.equal(account.wallet,wallet);assert.equal(request.authorization.message,accountMessage('read',request));assert.ok(request.authorization.signature_base64);assert.equal(provider.supportsTransactions,false);
});
test('rejects wrong response ID, forged signatures, wrong wallet and expired responses',async()=>{
 for(const mutate of [r=>({...r,id:'wrong'}),r=>({...r,walletPublicKey:'wrong'}),r=>({...r,signatureBase64:Buffer.alloc(64).toString('base64')})]){
  const p=createCliProvider(wallet,{origin,requestSignature:r=>mutate(sign(r))});
  await assert.rejects(p.signMessage(new TextEncoder().encode(accountMessage('read',{wallet_public_key:wallet,expires_at:123}))));
 }
 let now=Date.now();const p=createCliProvider(wallet,{origin,now:()=>now,requestSignature:r=>{const response=sign(r);now+=90001;return response;}});
 await assert.rejects(p.signMessage(new TextEncoder().encode(accountMessage('read',{wallet_public_key:wallet,expires_at:123}))),/expired/);
});
test('local signer refuses another origin, keypair, non-KEP messages and unsupported actions',()=>{
 const request={format:'kep-cli-sign-request-v1',id:'test',origin,walletPublicKey:wallet,expiresAt:Date.now()+80000,messageBase64:Buffer.from(accountMessage('read',{wallet_public_key:wallet,expires_at:123})).toString('base64')};
 assert.throws(()=>prepareSignature(request,[...pair.secretKey],'https://other.example'),/origin/);
 assert.throws(()=>prepareSignature(request,[...Keypair.generate().secretKey],origin),/match/);
 assert.throws(()=>prepareSignature({...request,messageBase64:Buffer.from('arbitrary bytes').toString('base64')},[...pair.secretKey],origin),/Only KEP/);
 assert.throws(()=>prepareSignature({...request,messageBase64:Buffer.from(accountMessage('unsupported',{})).toString('base64')},[...pair.secretKey],origin),/Unsupported/);
});
