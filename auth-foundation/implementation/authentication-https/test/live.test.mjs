import {test} from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import http from 'node:http';
import {readFile,writeFile,rename,stat,mkdtemp,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {launchBrowser,browserOptions} from '../scripts/browser.mjs';
import {serviceToken} from '../src/identity.mjs';
import {operatorRequest,operatorHeaders} from '../scripts/operator.mjs';
const c=JSON.parse(await readFile('.runtime/config.json')),origin=c.origin;
const ca=await readFile('.runtime/tls/ca.crt');
function request(url,options={}){return new Promise((resolve,reject)=>{const req=https.request(url,{ca,servername:'localhost',timeout:5000,...options},r=>{const chunks=[];r.on('data',x=>chunks.push(x));r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,body:Buffer.concat(chunks).toString(),authorized:r.socket?.authorized}))});req.on('error',reject);req.on('timeout',()=>req.destroy(Error('timeout')));req.end(options.body)})}
const api=token=>fetch(origin+'/api/document',{headers:{Authorization:'Bearer '+token}});
async function policyChange(change,work){const path='.runtime/policy.json',original=await readFile(path);const p=JSON.parse(original);change(p);p.revision++;await writeFile(path+'.next',JSON.stringify(p),{mode:0o600});await rename(path+'.next',path);try{await work()}finally{await writeFile(path+'.next',original,{mode:0o600});await rename(path+'.next',path)}}
async function login(page,path='/'){await page.goto(origin+path);await page.locator('#password').waitFor();if(await page.locator('#username').count())await page.locator('#username').fill('alice');await page.locator('#password').fill(c.userPassword);await page.locator('#kc-login').click();await page.waitForURL(origin+path)}

test('verified TLS succeeds; unknown CA, wrong certificate hostname and HTTP fail',async()=>{
 assert.equal((await request(origin+'/health')).status,200);
 // Explicit empty CA overrides even NODE_EXTRA_CA_CERTS for this negative control.
 await assert.rejects(()=>request(origin+'/health',{ca:[]}));
 await assert.rejects(()=>request('https://127.0.0.1:13443/health',{servername:'wrong.invalid',headers:{Host:'localhost:13443'}}));
 for(const protocol of ['TLSv1.2','TLSv1.3'])assert.equal((await request(origin+'/health',{minVersion:protocol,maxVersion:protocol})).status,200);
 const cleartext=await new Promise(resolve=>{const req=http.get('http://localhost:13443/health',r=>{r.resume();resolve(r.statusCode)});req.on('error',()=>resolve(0))});assert.notEqual(cleartext,200);
});
test('Host, forwarded headers, public administration and direct publication boundaries',async()=>{
 assert.equal((await request(origin+'/health',{headers:{Host:'attacker.invalid'}})).status,421);
 for(const header of ['Forwarded','X-Forwarded-For','X-Forwarded-Host','X-Forwarded-Proto','X-Forwarded-Port','X-Real-IP','X-Original-URL']){
  for(const url of [origin+'/health',c.issuer+'/.well-known/openid-configuration'])assert.equal((await request(url,{headers:{[header]:'attacker'}})).status,400);
 }
 for(const path of ['/admin/realms/auth-https','/realms/master/.well-known/openid-configuration','/health/ready','/metrics','/'])assert.equal((await request('https://localhost:18443'+path)).status,404);
 for(const name of ['auth-foundation-https-keycloak-1','auth-foundation-https-postgres-1']){const data=JSON.parse(execFileSync('docker',['inspect',name],{encoding:'utf8'}))[0];assert.equal(Object.keys(data.HostConfig.PortBindings||{}).length,0)}
 assert.equal((await stat('.runtime/socket/app.sock')).mode&0o777,0o600);
 // The untrusted caller cannot use the app without the owner-only socket and proxy fields.
 const status=await new Promise((resolve,reject)=>{const req=http.get({socketPath:'.runtime/socket/app.sock',path:'/health',headers:{Host:'localhost:13443'}},r=>{r.resume();resolve(r.statusCode)});req.on('error',reject)});assert.equal(status,400);
});
test('operator API requires client certificate plus realm-scoped credentials',async()=>{
 const path='/admin/realms/auth-https';
 const missing=await request('https://localhost:19443'+path);assert.equal(missing.status,400);
 const wrongCert=await request('https://localhost:19443'+path,{cert:await readFile('.runtime/tls/frontend.crt'),key:await readFile('.runtime/tls/frontend.key')}).catch(()=>({status:0}));assert.ok([0,400].includes(wrongCert.status));
 assert.equal((await operatorRequest(path)).status,401);
 const headers=await operatorHeaders(c),realm=await operatorRequest(path,{headers});assert.equal(realm.status,200);assert.equal((await realm.json()).sslRequired,'all');
 assert.equal((await request('https://localhost:18443'+path,{headers})).status,404);
 const containers=JSON.parse(execFileSync('docker',['inspect','auth-foundation-https-keycloak-1'],{encoding:'utf8'}));assert.ok(!containers[0].Config.Env.some(x=>x.startsWith('KC_BOOTSTRAP_ADMIN_')));
 const masterUsers=execFileSync('docker',['exec','auth-foundation-https-postgres-1','psql','-U','keycloak','-d','keycloak','-Atc',"SELECT count(*) FROM user_entity WHERE realm_id=(SELECT id FROM realm WHERE name='master')"],{encoding:'utf8'}).trim();assert.equal(masterUsers,'0');
});
test('browser trusts isolated CA without bypass; branded login, secure cookies, document and logout',async()=>{
 const browser=await launchBrowser();try{
 const context=await browser.newContext(),page=await context.newPage();let callback;
 page.on('request',r=>{if(new URL(r.url()).pathname==='/callback')callback=r.url()});
 await page.goto(origin);await page.getByRole('heading',{name:'One identity. Explicit access.'}).waitFor();
 const auth=new URL(page.url());assert.equal(auth.origin,'https://localhost:18443');assert.equal(auth.searchParams.get('code_challenge_method'),'S256');assert.ok(auth.searchParams.get('nonce'));
 await page.screenshot({path:'.runtime/https-login.png',fullPage:true});
 await page.locator('#username').fill('alice');await page.locator('#password').fill(c.userPassword);await page.locator('#kc-login').click();await page.waitForURL(origin+'/');await page.getByRole('heading',{name:'You’re signed in'}).waitFor();
 const session=(await context.cookies()).find(x=>x.name==='__Host-auth_session');assert.ok(session?.secure&&session.httpOnly);assert.equal(session.sameSite,'Lax');assert.equal(session.path,'/');assert.equal(await page.evaluate(()=>localStorage.length),0);
 assert.equal((await context.request.get(callback)).status(),400);
 const doc=await context.request.get(origin+'/document');assert.equal(doc.status(),200);assert.equal((await doc.json()).principal_kind,'human');
 await policyChange(p=>p.principals.find(x=>x.kind==='human').read=false,async()=>assert.equal((await context.request.get(origin+'/document')).status(),403));
 assert.equal((await context.request.post(origin+'/logout',{form:{csrf:'wrong'},headers:{Origin:origin}})).status(),403);
 assert.equal((await context.request.post(origin+'/logout',{form:{csrf:'wrong'},headers:{Origin:'https://attacker.invalid'}})).status(),403);
 await page.screenshot({path:'.runtime/https-app.png',fullPage:true});
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL(origin+'/signed-out');await page.getByRole('heading',{name:'You’re signed out'}).waitFor();
 assert.equal((await request(origin+'/document',{headers:{Cookie:'__Host-auth_session='+session.value}})).status,401);
 await page.getByRole('link',{name:'Sign in',exact:true}).click();await page.locator('#username').waitFor();
 }finally{await browser.close()}
});
test('an isolated browser without the CA rejects the HTTPS origin',async()=>{
 const home=await mkdtemp(join(tmpdir(),'auth-untrusted-'));const browser=await chromium.launch({...browserOptions(),env:{...process.env,HOME:home}});
 try{const page=await browser.newPage();await assert.rejects(()=>page.goto(origin),/CERT_AUTHORITY_INVALID/)}finally{await browser.close();await rm(home,{recursive:true,force:true})}
});
test('direct document entry, SSO, mobile and terminal callback errors',async()=>{
 const browser=await launchBrowser();try{
 const context=await browser.newContext({viewport:{width:320,height:760}}),page=await context.newPage();
 await page.goto(origin+'/document');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'.runtime/https-mobile.png',fullPage:true});
 await page.locator('#username').fill('alice');await page.locator('#username').focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#password').evaluate(e=>e===document.activeElement),true);await page.keyboard.type(c.userPassword);await page.keyboard.press('Enter');await page.waitForURL(origin+'/document');assert.equal(JSON.parse(await page.locator('body').innerText()).decision,'ALLOW');
 await page.goto(origin);await page.getByRole('heading',{name:'You’re signed in'}).waitFor();await context.clearCookies({name:'__Host-auth_session'});await login(page);await page.getByRole('heading',{name:'You’re signed in'}).waitFor();
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL(origin+'/signed-out');
 for(const mode of ['state','cancel','nonce','pkce']){
  await page.goto(origin);const u=new URL(page.url()),state=u.searchParams.get('state');
  if(mode==='nonce'||mode==='pkce'){
   u.searchParams.set(mode==='nonce'?'nonce':'code_challenge','X'.repeat(43));await page.goto(u.href);await page.locator('#username').fill('alice');await page.locator('#password').fill(c.userPassword);await page.locator('#kc-login').click();
  }else await page.goto(origin+'/callback?'+new URLSearchParams(mode==='cancel'?{error:'access_denied',state}:{code:'wrong',state:'wrong',iss:c.issuer}));
  await page.getByRole('heading',{name:'Sign-in could not be completed'}).waitFor();assert.equal(new URL(page.url()).pathname,'/callback');
  // Clear IdP SSO between negative cases so each modified authorization reaches a fresh form.
  await context.clearCookies();
 }
 for(const path of ['/?returnTo=https://attacker.invalid','/login?next=//attacker.invalid'])assert.equal((await request(origin+path)).status,400);
 }finally{await browser.close()}
});
test('private-key service identity and current grant/disable enforcement over TLS',async()=>{
 const {access_token}=await serviceToken(c);let r=await api(access_token);assert.equal(r.status,200);assert.equal((await r.json()).principal_kind,'service');
 assert.equal((await api('invalid')).status,401);
 await policyChange(p=>p.principals.find(x=>x.kind==='service').read=false,async()=>assert.equal((await api(access_token)).status,403));
 const headers=await operatorHeaders(c),base='/admin/realms/auth-https/clients';const list=await (await operatorRequest(base+'?clientId=prototype-service',{headers})).json(),path=base+'/'+list[0].id;const original=await (await operatorRequest(path,{headers})).json();
 assert.equal((await operatorRequest(path,{method:'PUT',headers,body:JSON.stringify({...original,enabled:false})})).status,204);
 try{assert.equal((await api(access_token)).status,401);await assert.rejects(()=>serviceToken(c))}finally{assert.equal((await operatorRequest(path,{method:'PUT',headers,body:JSON.stringify(original)})).status,204)}
 assert.equal((await api(access_token)).status,200);
});
test('repeat setup preserves credentials, subjects, keys and policy',async()=>{
 async function snapshot(){const headers=await operatorHeaders(c),base='/admin/realms/auth-https';const data={};for(const endpoint of ['users','clients','keys']){const r=await operatorRequest(base+'/'+endpoint,{headers});assert.equal(r.status,200);data[endpoint]=await r.json();if(Array.isArray(data[endpoint]))data[endpoint].sort((a,b)=>a.id.localeCompare(b.id))}for(const name of ['config.json','policy.json'])data[name]=await readFile('.runtime/'+name,'utf8');return JSON.stringify(data)}
 const before=await snapshot();execFileSync(process.execPath,['scripts/setup.mjs'],{stdio:'pipe',timeout:30000});assert.ok(before===await snapshot(),'Setup changed preserved state');
});
test('issuer outage denies existing tokens and renders bounded login failure',async()=>{
 const {access_token}=await serviceToken(c);assert.equal((await api(access_token)).status,200);
 execFileSync('docker',['pause','auth-foundation-https-keycloak-1'],{stdio:'pipe'});
 try{const start=Date.now();assert.equal((await api(access_token)).status,401);assert.ok(Date.now()-start<6500);const r=await fetch(origin,{redirect:'manual'});assert.equal(r.status,401);assert.match(await r.text(),/Sign-in could not be completed/)}finally{execFileSync('docker',['unpause','auth-foundation-https-keycloak-1'],{stdio:'pipe'})}
 assert.equal((await api(access_token)).status,200);
});
test('malformed URL and oversized body fail without taking down the application',async()=>{
 assert.equal((await request(origin+'/logout',{method:'POST',body:'x'.repeat(40000),headers:{'Content-Type':'application/x-www-form-urlencoded','Content-Length':'40000'}})).status,413);
 const status=await new Promise((resolve,reject)=>{const req=https.request({hostname:'localhost',port:13443,ca,path:'http://[invalid',headers:{Host:'localhost:13443'}},r=>{r.resume();resolve(r.statusCode)});req.on('error',reject);req.end()});assert.ok([400,401].includes(status));assert.equal((await request(origin+'/health')).status,200);
});
