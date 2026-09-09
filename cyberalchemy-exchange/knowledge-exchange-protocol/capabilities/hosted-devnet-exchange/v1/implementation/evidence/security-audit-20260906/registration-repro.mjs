import {generateKeyPairSync,sign,randomUUID} from 'node:crypto';
import bs58 from 'bs58';
const base='http://127.0.0.1:8783'; // Disposable local UX database only.
const {privateKey,publicKey}=generateKeyPairSync('ed25519');
const wallet=bs58.encode(publicKey.export({type:'spki',format:'der'}).subarray(-32));
const prefix='audit-'+randomUUID(), encryption=Buffer.alloc(32,7).toString('base64');
const a={operation_id:prefix+':split',identity_id:'identity',wallet_public_key:wallet,encryption_public_key:encryption,encryption_key_version:1};
const message=`ca2:kep:hosted:v1:register:${a.operation_id}:${a.identity_id}:${wallet}:${encryption}:1`;
a.authorization={message,signature_base64:sign(null,Buffer.from(message),privateKey).toString('base64')};
const b={...a,operation_id:prefix,identity_id:'split:identity'};
// Identical signed bytes, distinct identity and operation fields.
const result=[];
for(const body of [a,b]){const response=await fetch(base+'/v1/identities',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});result.push({status:response.status,body:await response.json()});}
console.log(JSON.stringify({target:base,identicalAuthorization:true,requests:result},null,2));
if(result.some(r=>r.status!==200))process.exitCode=1;
