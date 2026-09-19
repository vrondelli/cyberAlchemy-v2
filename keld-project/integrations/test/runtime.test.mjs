import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {get} from 'node:https';
import {compileConfig,loadConfig,ConfigurationError} from '../src/config.mjs';
import {startRuntime} from '../src/runtime.mjs';
const env={KELD_OIDC_SECRET:'x'.repeat(32),KELD_DATABASE_URL:'postgresql://fixture:fixture@localhost/keld',KELD_SESSION_KEY:Buffer.alloc(32,1).toString('base64url'),KELD_STRIPE_SECRET:'sk_test_fixture',KELD_MP_TOKEN:'APP_USR-fixture',KELD_PAYPAL_CLIENT_ID:'fixture',KELD_PAYPAL_SECRET:'fixture'};
async function configFixture(t){
 const root=await mkdtemp(join(tmpdir(),'keld-runtime-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const input=JSON.parse(await readFile(new URL('../config.example.json',import.meta.url),'utf8'));input.payments.mercadopago.applicationId='456';
 input.auth.issuer='https://issuer.localhost/realms/keld';input.tls={certFile:'cert.pem',keyFile:'key.pem'};
 input.ledger={database:'commerce.db',fixtureFile:'fixture.bin',sha256:createHash('sha256').update('fixture').digest('hex'),bytes:7,reservationSeconds:3600};
 input.quoteBrl={numerator:5,denominator:1,reference:'test-only',expiresAt:Math.floor(Date.now()/1000)+3600};
 await writeFile(join(root,'fixture.bin'),'fixture');
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,IP:127.0.0.1','-keyout',join(root,'key.pem'),'-out',join(root,'cert.pem')],{stdio:'ignore'});
 const path=join(root,'config.json');await writeFile(path,JSON.stringify(input));return {input,root,path};
}
test('config collects missing fields without exposing environment values; rejects live keys and public binding',()=>{
 assert.throws(()=>compileConfig({version:1},{env:{}}),e=>e instanceof ConfigurationError&&e.issues.length>15);
});
test('config validates fixture and TLS locally, preserves integer quotes and aggregates file failures',async t=>{
 const {input,root,path}=await configFixture(t);const config=await loadConfig(path,{env});
 assert.equal((await config.integration.quoteBrl(5001)).amountCents,25005);
 assert.equal(config.integration.auth.namespace,'keld');
 assert.equal(config.integration.payments.mercadopago.api,'orders-v1');
 assert.equal(config.integration.payments.paypal.currency,'USD');
 assert.throws(()=>compileConfig({...input,payments:{...input.payments,paypal:{...input.payments.paypal,currency:'EUR'}}},{env}),e=>e.issues.some(i=>i.path==='payments.paypal.currency'));
 assert.throws(()=>compileConfig({...input,payments:{...input.payments,mercadopago:{...input.payments.mercadopago,applicationId:undefined}}},{env}),e=>e.issues.some(i=>i.path==='payments.mercadopago.applicationId'));
 assert.throws(()=>compileConfig(input,{env:{...env,KELD_MP_TOKEN:'TEST-legacy'}}),e=>e.issues.some(i=>i.path==='payments.mercadopago.accessTokenEnv'));
 assert.equal(config.integration.events,undefined);
 const eventConfig=compileConfig({...input,webhooks:{stripe:{secretEnv:'KELD_STRIPE_WEBHOOK_SECRET'}}},{env:{...env,KELD_STRIPE_WEBHOOK_SECRET:'whsec_fixture'}});
 assert.equal(eventConfig.integration.events.stripe.account,input.payments.stripe.account);
 assert.throws(()=>compileConfig({...input,webhooks:{stripe:{secretEnv:'KELD_MISSING'},paypal:{}}},{env}),e=>e.issues.some(i=>i.path==='webhooks.stripe.secretEnv')&&e.issues.some(i=>i.path==='webhooks.paypal.webhookId'));
 const expired={...input,quoteBrl:{...input.quoteBrl,expiresAt:1}};
 assert.throws(()=>compileConfig(expired,{env}),e=>e.issues.some(i=>i.path==='quoteBrl.expiresAt'));
 assert.equal(compileConfig(expired,{env,requireCurrentQuote:false}).integration.payments.environment,'sandbox');
 assert.throws(()=>compileConfig({...input,origin:'https://0.0.0.0:17443'},{env:{...env,KELD_STRIPE_SECRET:'sk_live_private-secret'}}),e=>{
   const paths=e.issues.map(i=>i.path);assert.ok(paths.includes('origin'));assert.ok(paths.includes('payments.stripe.secretEnv'));assert.ok(!JSON.stringify(e).includes('private-secret'));return true;
 });
 await writeFile(join(root,'fixture.bin'),'changed');await rm(join(root,'cert.pem'));
 await assert.rejects(()=>loadConfig(path,{env}),e=>e.issues.some(i=>i.path==='ledger.fixtureFile')&&e.issues.some(i=>i.path==='tls.certFile'));
});
function request(port){return new Promise((resolve,reject)=>{get({hostname:'127.0.0.1',port,rejectUnauthorized:false},res=>{let data='';res.on('data',b=>data+=b);res.on('end',()=>resolve({status:res.statusCode,data}));}).on('error',reject);});}
test('HTTPS runtime serves after initialization and closes resources once',async t=>{
 const {path}=await configFixture(t);const config=await loadConfig(path,{env});let initialize=0,closed=0;
 const running=await startRuntime({...config,port:0},{factory:async()=>({initialize:async()=>{initialize++;},handler:(req,res)=>{res.end('buyer-ready');},close:async()=>{closed++;}})});
 t.after(()=>running.close());
 assert.equal(initialize,1);const port=running.server.address().port;assert.deepEqual(await request(port),{status:200,data:'buyer-ready'});
 await Promise.all([running.close(),running.close()]);assert.equal(closed,1);assert.equal(running.server.listening,false);
});
test('failed initialization shuts down the listener and session resources',async t=>{
 const {path}=await configFixture(t);const config=await loadConfig(path,{env});let closed=0;
 await assert.rejects(()=>startRuntime({...config,port:0},{factory:async()=>({initialize:async()=>{throw Error('test migration failed');},handler:()=>{},close:async()=>{closed++;}})}));assert.equal(closed,1);
});

test('occupied port prevents session migration and closes the new session resource',async t=>{
 const {path}=await configFixture(t);const config=await loadConfig(path,{env});
 const running=await startRuntime({...config,port:0},{factory:async()=>({initialize:async()=>{},handler:(req,res)=>res.end(),close:async()=>{}})});t.after(()=>running.close());
 let migrated=0,closed=0;
 await assert.rejects(()=>startRuntime({...config,port:running.server.address().port},{factory:async()=>({initialize:async()=>{migrated++;},handler:()=>{},close:async()=>{closed++;}})}));
 assert.equal(migrated,0);assert.equal(closed,1);
});

test('archive configuration verifies files above 1 MiB and rejects the 256 MiB ceiling',async t=>{
 const {input,root,path}=await configFixture(t);
 const data=Buffer.alloc(13*1024*1024,29);
 input.ledger.bytes=data.length;input.ledger.sha256=createHash('sha256').update(data).digest('hex');
 await writeFile(join(root,'fixture.bin'),data);await writeFile(path,JSON.stringify(input));
 assert.equal((await loadConfig(path,{env})).integration.ledger.delivery.artifacts[0].bytes,data.length);
 assert.throws(()=>compileConfig({...input,ledger:{...input.ledger,bytes:256*1024*1024+1}},{env}),e=>e.issues.some(i=>i.path==='ledger.bytes'));
 await writeFile(join(root,'fixture.bin'),Buffer.alloc(data.length,30));
 await assert.rejects(()=>loadConfig(path,{env}),e=>e.issues.some(i=>i.code==='fixture-integrity-failed'));
});
