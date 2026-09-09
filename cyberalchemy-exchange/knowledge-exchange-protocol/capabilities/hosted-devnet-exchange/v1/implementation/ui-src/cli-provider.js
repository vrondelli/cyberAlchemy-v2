import {PublicKey} from '@solana/web3.js';
import {bytesToBase64,base64ToBytes} from './protocol.js';
export function createCliProvider(wallet,{requestSignature,origin=location.origin,now=()=>Date.now()}={}) {
 const publicKey=new PublicKey(wallet);
 if(!PublicKey.isOnCurve(publicKey.toBytes()))throw Error('Enter a signing wallet address.');
 return {publicKey,kind:'cli',supportsTransactions:false,async connect(){return {publicKey};},async signMessage(bytes){
  const request={format:'kep-cli-sign-request-v1',id:crypto.randomUUID(),origin,walletPublicKey:publicKey.toString(),expiresAt:now()+90000,messageBase64:bytesToBase64(bytes)};
  const response=await requestSignature(request);
  if(now()>request.expiresAt)throw Error('Signing request expired. Retry for a fresh request.');
  if(response?.format!=='kep-cli-sign-response-v1'||response.id!==request.id||response.walletPublicKey!==request.walletPublicKey)throw Error('Signature response belongs to another request or wallet.');
  const signature=base64ToBytes(response.signatureBase64);
  const key=await crypto.subtle.importKey('raw',publicKey.toBytes(),{name:'Ed25519'},false,['verify']);
  if(signature.length!==64||!await crypto.subtle.verify('Ed25519',key,signature,bytes))throw Error('Invalid CLI signature.');
  return {signature};
 }};
}
