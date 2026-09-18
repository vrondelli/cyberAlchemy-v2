import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,chmod,symlink,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {resolveSecretFiles} from '../src/secret-files.mjs';
import {compileConfig} from '../src/config.mjs';
import {childEnvironment} from '../src/child-environment.mjs';
import {startRuntime} from '../src/runtime.mjs';

test('file secrets reject ambiguous inputs, permissive files, links and multiline values',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'keld-secret-input-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const path=join(dir,'secret');await writeFile(path,'sk_test_synthetic',{mode:0o400});
 const input={listener:{mode:'proxy-http'},payments:{stripe:{secretEnv:'KELD_STRIPE_SECRET'}}};
 const env={KELD_STRIPE_SECRET_FILE:path};
 assert.equal((await resolveSecretFiles(input,{env})).env.KELD_STRIPE_SECRET,'sk_test_synthetic');
 assert.equal((await resolveSecretFiles(input,{env:{...env,KELD_STRIPE_SECRET:'private'}})).issues[0].code,'ambiguous-secret-source');
 await chmod(path,0o644);assert.equal((await resolveSecretFiles(input,{env})).issues[0].code,'private-secret-file-required');
 await chmod(path,0o600);await writeFile(path,'secret\n');assert.ok((await resolveSecretFiles(input,{env})).issues.length);
 await symlink(path,join(dir,'link'));assert.ok((await resolveSecretFiles(input,{env:{KELD_STRIPE_SECRET_FILE:join(dir,'link')}})).issues.length);
 const missing=await resolveSecretFiles(input,{env:{KELD_STRIPE_SECRET:'sk_test_private'}});
 assert.equal(missing.issues[0].code,'secret-file-required');assert.ok(!JSON.stringify(missing).includes('sk_test_private'));
});

test('worker configuration resolves no OIDC, session or webhook secrets',async()=>{
 const input=JSON.parse(await readFile(new URL('../config.example.json',import.meta.url)));input.payments.mercadopago.applicationId='456';
 input.origin='https://shop.example.test';input.listener={mode:'proxy-http',host:'0.0.0.0',port:8080};delete input.tls;delete input.auth;
 input.ledger={database:'/tmp/ledger',fixtureFile:'/tmp/fixture',sha256:'a'.repeat(64),bytes:12,reservationSeconds:3600};
 input.quoteBrl={numerator:5,denominator:1,reference:'test',expiresAt:2000000000};
 const env={KELD_STRIPE_SECRET:'sk_test_fixture',KELD_MP_TOKEN:'APP_USR-fixture',KELD_PAYPAL_CLIENT_ID:'id',KELD_PAYPAL_SECRET:'secret'};
 const result=compileConfig(input,{env,role:'worker',now:100});
 assert.equal(result.integration.auth,undefined);assert.equal(result.transport,'http');assert.equal(result.bindHost,'0.0.0.0');
 assert.throws(()=>compileConfig({...input,origin:'http://shop.example.test'},{env,role:'worker'}));
 const resolved=await resolveSecretFiles({auth:{secretEnv:'KELD_OIDC_SECRET'},webhooks:{stripe:{secretEnv:'KELD_WEBHOOK'}}},{env:{KELD_OIDC_SECRET_FILE:'/missing',KELD_WEBHOOK_FILE:'/missing'},role:'worker'});
 assert.deepEqual(resolved,{env:{},issues:[]});
});

test('Python child environment omits parent authentication and merchant secrets',()=>{
 process.env.KELD_STRIPE_SECRET='synthetic-never-inherit';process.env.KELD_OIDC_SECRET_FILE='/secret/location';
 try{assert.deepEqual(Object.keys(childEnvironment()).sort(),['LANG','LC_ALL','PATH','PYTHONDONTWRITEBYTECODE','TMPDIR']);}
 finally{delete process.env.KELD_STRIPE_SECRET;delete process.env.KELD_OIDC_SECRET_FILE;}
});

test('private HTTP launcher exposes readiness only after initialization',async t=>{
 let calls=0,closed=0;
 const runtime=await startRuntime({port:0,bindHost:'127.0.0.1',transport:'http',integration:{}},{factory:async()=>({
  initialize:async()=>{calls++;},close:async()=>{closed++;},handler:(req,res)=>{res.writeHead(200);res.end('application');}
 })});
 t.after(()=>runtime.close());
 const origin='http://127.0.0.1:'+runtime.server.address().port;
 assert.equal(await (await fetch(origin+'/readyz')).text(),'Ready');assert.equal(calls,1);
 assert.equal(await (await fetch(origin+'/')).text(),'application');
 await runtime.close();assert.equal(closed,1);
});
