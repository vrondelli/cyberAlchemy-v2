import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,SignJWT} from 'jose';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verifier,now,validateProfile} from '../src/identity.mjs';
import {authorize} from '../src/bridge.mjs';
import {PROFILES,selectedProfile,applyProfile} from '../src/profiles.mjs';
import {createOperationalEvidence,correlationId} from '../src/operational-evidence.mjs';
import {operatorRequest} from '../scripts/operator.mjs';
const issuer='https://localhost:18443/realms/auth-https';
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

test('only exact stable and candidate HTTPS profiles are approved',()=>{
 for(const c of Object.values(PROFILES))assert.doesNotThrow(()=>validateProfile(c));
 for(const change of [{issuer:issuer.replace('https:','http:')},{issuer:'https://attacker.invalid'},{origin:'https://localhost:13000'},{operatorOrigin:'https://localhost:19444'},{composeProject:'other'},{appPort:13000},{browserClient:'other'},{serviceClient:'other'}])assert.throws(()=>validateProfile({...PROFILES.stable,...change}));
 assert.throws(()=>validateProfile({...PROFILES.stable,profile:'candidate'}));
 assert.throws(()=>validateProfile({...PROFILES.stable,issuer:PROFILES.candidate.issuer}));
});

test('profile selection and legacy stable migration fail closed',()=>{
 assert.deepEqual(selectedProfile('candidate'),PROFILES.candidate);
 assert.throws(()=>selectedProfile('other'));
 const legacy={issuer:PROFILES.stable.issuer,origin:PROFILES.stable.origin,browserClient:'prototype-browser',serviceClient:'prototype-service',secret:'preserved'};
 assert.deepEqual(applyProfile(legacy,PROFILES.stable),{...legacy,...PROFILES.stable});
 assert.throws(()=>applyProfile(legacy,PROFILES.candidate));
});

test('ORODI request accounting conserves offered and queued observations',()=>{
 const evidence=createOperationalEvidence();
 const first=evidence.offer();
 assert.deepEqual(evidence.snapshot().telemetry,{offered:1,queued:1,rejected:0,exported:0,dropped:0,pending:1});
 assert.equal(evidence.snapshot().conserved,true);
 first('exported');
 evidence.offer({reject:true});
 const final=evidence.snapshot();
 assert.deepEqual(final.telemetry,{offered:2,queued:1,rejected:1,exported:1,dropped:0,pending:0});
 assert.equal(final.conserved,true);assert.equal(final.required_drops_zero,true);
 assert.throws(()=>first('exported'));
});

test('server correlation identifiers are fresh UUIDs',()=>{
 const first=correlationId(),second=correlationId();
 assert.match(first,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
 assert.notEqual(first,second);
});

test('operator channel rejects unapproved origin before network access',async()=>{
 await assert.rejects(()=>operatorRequest('/admin/realms/auth-https',{origin:'https://attacker.invalid'}),/Unapproved operator origin/);
});

import './session.test.mjs';
