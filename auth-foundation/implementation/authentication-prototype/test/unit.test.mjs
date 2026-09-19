import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,SignJWT} from 'jose';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verifier,now} from '../src/identity.mjs';
import {authorize} from '../src/bridge.mjs';
const issuer='http://localhost:18080/realms/auth-prototype';
const keys=await generateKeyPair('RS256');
const verify=verifier({issuer},keys.publicKey);
const base=()=>({iss:issuer,sub:'alice',aud:'prototype-api',azp:'prototype-browser',typ:'Bearer',iat:now(),exp:now()+300,jti:crypto.randomUUID()});
const sign=(p,key=keys.privateKey)=>new SignJWT(p).setProtectedHeader({alg:'RS256'}).sign(key);
test('real RSA access-token verification positive control',async()=>assert.equal((await verify(await sign(base()))).sub,'alice'));
for(const [name,change] of Object.entries({issuer:{iss:'https://attacker.invalid'},audience:{aud:'other'},id_token:{typ:'ID'},client:{azp:'attacker'},expired:{exp:1},future:{iat:now()+100},lifetime:{exp:now()+600},missing_subject:{sub:undefined}}))test('reject '+name,async()=>assert.rejects(()=>sign({...base(),...change}).then(verify)));
test('reject wrong signature',async()=>{const other=await generateKeyPair('RS256');await assert.rejects(()=>sign(base(),other.privateKey).then(verify));});
test('reject unsigned and malformed tokens',async()=>{await assert.rejects(()=>verify('e30.e30.'));await assert.rejects(()=>verify('malformed'));});
test('existing Rust authorization engine preserves kind and current grant boundary',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'auth-proto-'));const path=join(dir,'policy.json');
 const p={revision:1,principals:[{issuer,subject:'alice',kind:'human',client:'prototype-browser',id:'human:alice',enabled:true,read:true}]};
 async function check(policy,kind='human',payload=base()){await writeFile(path,JSON.stringify(policy));return authorize(payload,kind,path)}
 try {
  assert.equal(await check(p),true);
  assert.equal(await check(p,'service'),false);
  for(const change of [{enabled:false},{read:false},{client:'other'},{kind:'service'},{id:'service:alice'}])assert.equal(await check({...p,principals:[{...p.principals[0],...change}]}),false);
  assert.equal(await check({...p,principals:[...p.principals,...p.principals]}),false);
  assert.equal(await check({...p,revision:0}),false);
  assert.equal(await check(p,'human',{...base(),sub:'unknown'}),false);
  assert.equal(await check(p,'human',{...base(),exp:now()-1}),false);
  const machine={...p,principals:[{...p.principals[0],subject:'worker',kind:'service',client:'prototype-service',id:'service:worker'}]};
  assert.equal(await check(machine,'service',{...base(),sub:'worker',azp:'prototype-service'}),true);
  await writeFile(path,'broken');assert.equal(await authorize(base(),'human',path),false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
