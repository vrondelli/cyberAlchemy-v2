import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,rename} from 'node:fs/promises';
import {chromium} from 'playwright';
import {serviceToken,configuration,active,verifier} from '../src/identity.mjs';
const c=JSON.parse(await readFile('.runtime/config.json'));
const origin=c.origin;
const policyPath='.runtime/policy.json';
async function policyChange(fn,work){const original=await readFile(policyPath,'utf8');const p=JSON.parse(original);fn(p);p.revision++;await writeFile(policyPath+'.next',JSON.stringify(p),{mode:0o600});await rename(policyPath+'.next',policyPath);try{await work()}finally{await writeFile(policyPath+'.next',original,{mode:0o600});await rename(policyPath+'.next',policyPath)}}
async function get(token,headers={}){return fetch(origin+'/api/document',{headers:{Authorization:`Bearer ${token}`,...headers}})}
async function admin(){const r=await fetch('http://localhost:18080/realms/master/protocol/openid-connect/token',{method:'POST',body:new URLSearchParams({grant_type:'password',client_id:'admin-cli',username:'prototype-admin',password:c.adminPassword})});assert.equal(r.status,200);return {Authorization:`Bearer ${(await r.json()).access_token}`,'Content-Type':'application/json'};}
test('unauthenticated, caller evidence, and malformed API requests deny',async()=>{
 assert.equal((await fetch(origin+'/document',{redirect:'manual'})).status,303);
 assert.equal((await fetch(origin+'/api/document')).status,401);
 assert.equal((await get('bad')).status,401);
 assert.equal((await get('bad',{'x-authentication-evidence-ref':'verified'})).status,400);
 assert.equal((await fetch(origin+'/document?authentication_evidence_ref=verified')).status,400);
 assert.equal((await fetch(origin+'/callback?code=wrong&state=wrong')).status,400);
 const {request}=await import('node:http');
 const malformedStatus=await new Promise((resolve,reject)=>{const req=request({hostname:'localhost',port:13000,path:'http://[invalid',headers:{Host:'localhost:13000'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode))});req.on('error',reject);req.end()});
 assert.ok([400,401].includes(malformedStatus));assert.equal((await fetch(origin+'/health')).status,200);
});
test('real private-key service authentication and current authorization',async()=>{
 const {access_token}=await serviceToken(c);const r=await get(access_token);assert.equal(r.status,200);assert.equal((await r.json()).principal_kind,'service');
 const p=JSON.parse(Buffer.from(access_token.split('.')[1],'base64url'));p.sub='attacker';const altered=access_token.split('.');altered[1]=Buffer.from(JSON.stringify(p)).toString('base64url');assert.equal((await get(altered.join('.'))).status,401);
 await policyChange(p=>{p.principals.find(x=>x.kind==='service').read=false},async()=>assert.equal((await get(access_token)).status,403));
 await policyChange(p=>{p.principals.find(x=>x.kind==='service').enabled=false},async()=>assert.equal((await get(access_token)).status,403));
 assert.equal((await get(access_token)).status,200);
});
test('real browser code/PKCE login, cookie isolation, policy revocation and CSRF logout',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext();const page=await context.newPage();
  let completedCallback;page.on('request',r=>{if(new URL(r.url()).pathname==='/callback')completedCallback=r.url()});
  await page.goto(origin);
  const u=new URL(page.url());assert.equal(u.searchParams.get('code_challenge_method'),'S256');assert.ok(u.searchParams.get('nonce'));assert.ok(u.searchParams.get('state'));
  await page.locator('#username').fill('alice');await page.locator('#password').fill(c.userPassword);await page.locator('#kc-login').click();
  await page.waitForURL(origin+'/');await page.getByRole('heading',{name:'You’re signed in'}).waitFor();
  const cookies=await context.cookies();const session=cookies.find(x=>x.name==='auth_session');assert.ok(session);assert.equal(session.httpOnly,true);assert.equal(session.sameSite,'Lax');
  assert.equal(await page.evaluate(()=>localStorage.length),0);
  assert.ok(completedCallback);assert.equal((await context.request.get(completedCallback)).status(),400);
  let r=await context.request.get(origin+'/document');assert.equal(r.status(),200);assert.equal((await r.json()).principal_kind,'human');
  await policyChange(p=>{p.principals.find(x=>x.kind==='human').read=false},async()=>assert.equal((await context.request.get(origin+'/document')).status(),403));
  assert.equal((await context.request.get(origin+'/document')).status(),200);
  assert.equal((await context.request.post(origin+'/logout',{form:{csrf:'wrong'},headers:{Origin:origin}})).status(),403);
  assert.equal((await context.request.post(origin+'/logout',{form:{csrf:'wrong'},headers:{Origin:'https://attacker.invalid'}})).status(),403);
  const oldCookie=`auth_session=${session.value}`;
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL(origin+'/signed-out');
  await page.getByRole('heading',{name:'You’re signed out'}).waitFor();
  assert.equal((await fetch(origin+'/document',{headers:{Cookie:oldCookie},redirect:'manual'})).status,303);
  await context.close();
 }finally{await browser.close();}
});
test('disabled Keycloak service client rejects existing tokens and new issuance',async()=>{
 const {access_token}=await serviceToken(c),headers=await admin();
 const base='http://localhost:18080/admin/realms/auth-prototype/clients';
 const list=await (await fetch(base+'?clientId=prototype-service',{headers})).json();const url=base+'/'+list[0].id;
 const original=await (await fetch(url,{headers})).json();
 assert.equal((await fetch(url,{method:'PUT',headers,body:JSON.stringify({...original,enabled:false})})).status,204);
 try{assert.equal((await get(access_token)).status,401);await assert.rejects(()=>serviceToken(c));}
 finally{assert.equal((await fetch(url,{method:'PUT',headers,body:JSON.stringify(original)})).status,204);}
});
test('issuer outage denies an otherwise valid service token',async()=>{
 const {execFileSync}=await import('node:child_process');
 const {access_token}=await serviceToken(c);
 assert.equal((await get(access_token)).status,200);
 const loginStart=await fetch(origin,{redirect:'manual'}),loginState=new URL(loginStart.headers.get('location')).searchParams.get('state'),loginCookie=loginStart.headers.get('set-cookie').split(';')[0];
 execFileSync('docker',['pause','auth-foundation-prototype-keycloak-1'],{stdio:'pipe'});
 try{const start=Date.now();assert.equal((await get(access_token)).status,401);assert.ok(Date.now()-start<6000);
 const failedCallback=await fetch(origin+'/callback?'+new URLSearchParams({code:'invalid',state:loginState,iss:c.issuer}),{headers:{Cookie:loginCookie},redirect:'manual'});
 assert.equal(failedCallback.status,401);assert.equal(failedCallback.headers.get('location'),null);assert.match(await failedCallback.text(),/Sign-in could not be completed/);}
 finally{execFileSync('docker',['unpause','auth-foundation-prototype-keycloak-1'],{stdio:'pipe'});}
 assert.equal((await get(access_token)).status,200);
});

test('direct document entry, branded native form, keyboard login and existing SSO',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:320,height:760}}),page=await context.newPage();
  await page.goto(origin+'/document');
  await page.getByRole('heading',{name:'One identity. Explicit access.'}).waitFor();
  assert.equal(new URL(page.url()).origin,'http://localhost:18080');
  assert.ok(await page.locator('link[href*="auth-foundation"][href$="css/login.css"]').count());
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(17, 27, 34)');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('#username').getAttribute('autocomplete'),'username');
  assert.equal(await page.locator('#password').getAttribute('autocomplete'),'current-password');
  await page.screenshot({path:'.runtime/branded-login-mobile.png',fullPage:true});
  await page.setViewportSize({width:1200,height:900});
  await page.screenshot({path:'.runtime/branded-login-desktop.png',fullPage:true});
  await page.locator('#username').fill('alice');await page.locator('#username').focus();
  await page.keyboard.press('Tab');assert.equal(await page.locator('#password').evaluate(e=>e===document.activeElement),true);
  await page.keyboard.type(c.userPassword);await page.keyboard.press('Enter');
  await page.waitForURL(origin+'/document');assert.equal(JSON.parse(await page.locator('body').innerText()).decision,'ALLOW');
  const old=(await context.cookies()).find(x=>x.name==='auth_session');
  await page.goto(origin+'/signed-out');assert.equal(page.url(),origin+'/signed-out');
  assert.equal((await context.cookies()).find(x=>x.name==='auth_session').value,old.value);
  await page.goto(origin);await page.getByRole('heading',{name:'You’re signed in'}).waitFor();
  // Retain the IdP SSO session but remove only the local application session.
  await context.clearCookies({name:'auth_session'});
  await page.goto(origin);await page.getByRole('heading',{name:'You’re signed in'}).waitFor();
  assert.notEqual((await context.cookies()).find(x=>x.name==='auth_session').value,old.value);
  await page.screenshot({path:'.runtime/branded-app.png',fullPage:true});
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL(origin+'/signed-out');
  await page.screenshot({path:'.runtime/branded-signed-out.png',fullPage:true});
  await page.getByRole('link',{name:'Sign in',exact:true}).click();
  await page.locator('#username').waitFor();assert.equal(new URL(page.url()).origin,'http://localhost:18080');
 }finally{await browser.close();}
});
test('unsafe return parameters, cancellation, wrong state and replay terminate without redirect loops',async()=>{
 for(const path of ['/?returnTo=https://attacker.invalid','/login?next=//attacker.invalid','/document?returnTo=/api/document','/signed-out?next=/']){
  const r=await fetch(origin+path,{redirect:'manual'});assert.equal(r.status,400);assert.equal(r.headers.get('location'),null);
 }
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext(),page=await context.newPage();
  for(const mode of ['cancel','wrong-state','bad-code']){
   await page.goto(origin);const state=new URL(page.url()).searchParams.get('state');
   const callback=origin+'/callback?'+new URLSearchParams(mode==='cancel'?{error:'access_denied',error_description:'UNTRUSTED_PROVIDER_DETAIL',state}:{code:'invalid',state:mode==='wrong-state'?'wrong':state,iss:c.issuer});
   let r=await page.goto(callback);assert.equal(r.status(),401);
   await page.getByRole('heading',{name:'Sign-in could not be completed'}).waitFor();
   assert.equal(await page.locator('body').innerText().then(t=>t.includes('UNTRUSTED_PROVIDER_DETAIL')),false);
   assert.equal((await context.cookies()).some(x=>x.name==='auth_login'||x.name==='auth_session'),false);
   assert.equal(new URL(page.url()).pathname,'/callback');
   r=await page.goto(callback);assert.equal(r.status(),400);
   await page.getByRole('link',{name:'Try signing in again'}).click();await page.locator('#username').waitFor();
  }
  // An expired transaction cookie cannot complete even a matching state.
  await page.goto(origin);const expiredState=new URL(page.url()).searchParams.get('state');
  const loginCookie=(await context.cookies()).find(x=>x.name==='auth_login');
  await context.addCookies([{...loginCookie,expires:Math.floor(Date.now()/1000)-1}]);
  const expired=await page.goto(origin+'/callback?'+new URLSearchParams({code:'invalid',state:expiredState}));
  assert.equal(expired.status(),400);await page.getByRole('heading',{name:'Sign-in could not be completed'}).waitFor();
  await page.getByRole('link',{name:'Try signing in again'}).click();await page.locator('#username').waitFor();
  // Invalid credentials remain in the native branded Keycloak form with a visible error.
  await page.locator('#username').fill('alice');await page.locator('#password').fill('incorrect-test-password');await page.locator('#kc-login').click();
  await page.getByText('Invalid username or password.',{exact:true}).first().waitFor();
  assert.equal(await page.locator('#username').getAttribute('aria-invalid'),'true');
  assert.ok(await page.locator('[aria-live="polite"]').filter({hasText:'Invalid username or password.'}).count());
 }finally{await browser.close();}
});

test('repeated setup preserves credentials, identities, signing keys and policy while selecting realm theme',async()=>{
 const {execFileSync}=await import('node:child_process');
 async function snapshot(){
  const headers=await admin(),base='http://localhost:18080/admin/realms/auth-prototype';
  const realm=await (await fetch(base,{headers})).json();
  const users=await (await fetch(base+'/users',{headers})).json();
  const clients=await (await fetch(base+'/clients',{headers})).json();
  const keys=await (await fetch(base+'/keys',{headers})).json();
  const master=await (await fetch('http://localhost:18080/admin/realms/master',{headers})).json();
  assert.equal(realm.loginTheme,'auth-foundation');assert.equal(realm.displayName,'Auth Foundation');
  assert.notEqual(master.loginTheme,'auth-foundation');
  const browserClient=clients.find(x=>x.clientId===c.browserClient);
  assert.equal(browserClient.attributes['post.logout.redirect.uris'],origin+'/signed-out');
  return JSON.stringify({config:await readFile('.runtime/config.json','utf8'),policy:await readFile(policyPath,'utf8'),users:users.map(u=>({id:u.id,username:u.username,enabled:u.enabled})).sort((a,b)=>a.id.localeCompare(b.id)),clients:clients.sort((a,b)=>a.id.localeCompare(b.id)),keys});
 }
 const before=await snapshot();
 execFileSync(process.execPath,['scripts/setup.mjs'],{stdio:'pipe',timeout:30000});
 // Do not print snapshot contents, including on failure.
 assert.ok(before===await snapshot(),'Setup changed preserved identity state');
});

test('issuer outage gives bounded browser entry and local logout failure pages',async()=>{
 const {execFileSync}=await import('node:child_process');const browser=await chromium.launch({headless:true});let paused=false;
 try{
  const context=await browser.newContext(),page=await context.newPage();
  await page.goto(origin);await page.locator('#username').fill('alice');await page.locator('#password').fill(c.userPassword);await page.locator('#kc-login').click();await page.waitForURL(origin+'/');
  execFileSync('docker',['pause','auth-foundation-prototype-keycloak-1'],{stdio:'pipe'});paused=true;
  const start=Date.now(),entry=await fetch(origin,{redirect:'manual'});
  assert.equal(entry.status,401);assert.equal(entry.headers.get('location'),null);assert.match(await entry.text(),/Sign-in could not be completed/);assert.ok(Date.now()-start<6000);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await page.getByRole('heading',{name:'Signed out of this app'}).waitFor();
  assert.match(await page.locator('body').innerText(),/could not confirm sign-out there/);
  assert.equal((await context.cookies()).some(x=>x.name==='auth_session'),false);
  await page.getByRole('link',{name:'Continue',exact:true}).click();assert.equal(page.url(),origin+'/signed-out');
 }finally{if(paused)execFileSync('docker',['unpause','auth-foundation-prototype-keycloak-1'],{stdio:'pipe'});await browser.close();}
});
