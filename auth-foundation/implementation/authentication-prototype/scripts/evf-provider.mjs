// Offline EVF provider: real cryptographic verifier and Rust bridge controls.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {generateKeyPair,SignJWT} from 'jose';
import {verifier,now} from '../src/identity.mjs';
const request=JSON.parse(await readFile(process.argv[2]));
if(Object.keys(request).sort().join(',')!=='case,input_digest,schema_version'||request.schema_version!=='auth-prototype-evf/v1')throw Error('Invalid input');
const manifest=JSON.parse(await readFile('evidence/INPUT-CANDIDATE.json'));
const hash=data=>createHash('sha256').update(data).digest('hex');
if(hash(JSON.stringify(manifest.files))!==manifest.input_digest)throw Error('Manifest drift');
for(const f of manifest.files)if(hash(await readFile(f.path))!==f.sha256)throw Error('Input drift: '+f.path);
const digest=manifest.input_digest;
let output;
if(request.input_digest!==digest)output={status:'rejected',input_digest:digest,cause:'STALE_INPUT'};
else if(request.case==='neutral'){
 execFileSync(process.execPath,['--test','test/unit.test.mjs'],{timeout:30000,stdio:'pipe'});
 output={status:'passed',input_digest:digest};
}else{
 const causes={'wrong-audience':'WRONG_AUDIENCE','wrong-issuer':'WRONG_ISSUER','expired':'EXPIRED','id-token':'TOKEN_TYPE','wrong-signature':'SIGNATURE'};
 if(!causes[request.case])throw Error('Unknown mutation');
 const keys=await generateKeyPair('RS256');const issuer='http://localhost:18080/realms/auth-prototype';
 const verify=verifier({issuer},keys.publicKey);
 const payload={iss:issuer,sub:'alice',aud:'prototype-api',azp:'prototype-browser',typ:'Bearer',iat:now(),exp:now()+300,jti:crypto.randomUUID()};
 const token=p=>new SignJWT(p).setProtectedHeader({alg:'RS256'}).sign(keys.privateKey);
 await verify(await token(payload)); // mandatory positive control
 let mutant;
 if(request.case==='wrong-signature'){const other=await generateKeyPair('RS256');mutant=await new SignJWT(payload).setProtectedHeader({alg:'RS256'}).sign(other.privateKey);}
 else {const changes={'wrong-audience':{aud:'other'},'wrong-issuer':{iss:'https://attacker.invalid'},expired:{exp:now()-1},'id-token':{typ:'ID'}};mutant=await token({...payload,...changes[request.case]});}
 let rejected=false;try{await verify(mutant)}catch{rejected=true}
 if(!rejected)throw Error('Mutation survived');
 output={status:'rejected',input_digest:digest,cause:causes[request.case]};
}
console.log(JSON.stringify(output));
