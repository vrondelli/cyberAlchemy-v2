#!/usr/bin/env node
// Local-only account/API message signer. No network calls or transaction signing.
import {readFileSync} from 'node:fs';
import {createPrivateKey,createPublicKey,sign} from 'node:crypto';
import {createInterface} from 'node:readline/promises';
import {pathToFileURL} from 'node:url';
const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58(bytes){let n=BigInt('0x'+bytes.toString('hex')),s='';while(n){s=alphabet[Number(n%58n)]+s;n/=58n;}for(const b of bytes){if(b)break;s='1'+s;}return s;}
export function prepareSignature(request,keyBytes,expectedOrigin,now=Date.now()){
 if(!Array.isArray(keyBytes)||keyBytes.length!==64||keyBytes.some(n=>!Number.isInteger(n)||n<0||n>255))throw Error('Expected a local Solana CLI keypair JSON file.');
 if(request.format!=='kep-cli-sign-request-v1'||typeof request.id!=='string'||request.origin!==expectedOrigin||!Number.isSafeInteger(request.expiresAt)||request.expiresAt<now||request.expiresAt>now+90000)throw Error('Wrong origin, invalid or expired signing request.');
 const origin=new URL(expectedOrigin);if(!['https:','http:'].includes(origin.protocol)||origin.origin!==expectedOrigin)throw Error('Use the exact HTTP(S) service origin.');
 if(typeof request.messageBase64!=='string'||request.messageBase64.length>30000)throw Error('Invalid message size.');
 const bytes=Buffer.from(request.messageBase64,'base64'),message=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 if(bytes.toString('base64')!==request.messageBase64||!message.startsWith('ca2:kep:authorization:v2:'))throw Error('Only KEP API authorization messages are supported.');
 const fields=JSON.parse(message.slice('ca2:kep:authorization:v2:'.length));
 if(!Array.isArray(fields)||!['account-read','account-write','register','file-upload','file-access','file-acknowledge'].includes(fields[3]))throw Error('Unsupported API action. CLI transaction signing is not available.');
 if(fields[0]!=='https://kep.cyberalchemylab.com'||fields[1]!=='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG'||fields[2]!=='ns5yjVYuX3bsaMWdG4pPF5hmajdD21xHDVLMbJUCeh1')throw Error('Unsupported KEP signing domain.');
 const key=createPrivateKey({key:Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),Buffer.from(keyBytes.slice(0,32))]),format:'der',type:'pkcs8'});
 const publicBytes=createPublicKey(key).export({format:'der',type:'spki'}).subarray(-32),wallet=base58(publicBytes);
 if(wallet!==request.walletPublicKey||!publicBytes.equals(Buffer.from(keyBytes.slice(32))))throw Error('Keypair does not match the requested wallet.');
 // JSON escaping prevents control sequences in a downloaded request affecting the terminal.
 return {review:JSON.stringify({origin:request.origin,wallet,action:fields[3],fields},null,2),complete:()=>({format:'kep-cli-sign-response-v1',id:request.id,walletPublicKey:wallet,signatureBase64:sign(null,bytes,key).toString('base64')})};
}
async function main(){
 const args=process.argv.slice(2),get=flag=>args[args.indexOf(flag)+1];
 if(!['--request','--keypair','--origin'].every(flag=>args.includes(flag)&&get(flag)))throw Error('Usage: node kep-sign.mjs --request kep-request.json --keypair /path/to/id.json --origin https://your-kep-host');
 const request=JSON.parse(readFileSync(get('--request'),'utf8'));
 const prepared=prepareSignature(request,JSON.parse(readFileSync(get('--keypair'),'utf8')),get('--origin'));
 console.error('Review the exact API authorization fields. This command makes no network requests.\n'+prepared.review);
 const rl=createInterface({input:process.stdin,output:process.stderr});let approval;try{approval=await rl.question('Type SIGN to approve: ');}finally{rl.close();}
 if(approval!=='SIGN')throw Error('Signing cancelled.');
 if(Date.now()>request.expiresAt)throw Error('Request expired; request a fresh one in the console.');
 console.log(JSON.stringify(prepared.complete()));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
