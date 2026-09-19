// Open questions: ../../../development/authentication-v1/MFA-RECOVERY-PLAN.md
import http from 'node:http';
import assert from 'node:assert/strict';import postgres from '../../session-core/node_modules/postgres/src/index.js';import {digest} from '../../session-core/src/store.mjs';import {databaseUrl} from '../src/foundation.mjs';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {resolve} from 'node:path';import {randomBytes,createHmac} from 'node:crypto';
import {launchBrowser} from '../../authentication-https/scripts/browser.mjs';import {operatorRequest,operatorHeaders} from '../../authentication-https/scripts/operator.mjs';import {createCluster,root,original} from '../scripts/cluster.mjs';
process.umask(0o077);process.env.LD_LIBRARY_PATH=resolve(original,'.runtime/browser-libs/root/usr/lib/x86_64-linux-gnu');
const owner=JSON.parse(readFileSync(resolve(original,'.runtime/config.json'))),cluster={config:JSON.parse(readFileSync(resolve(root,".runtime/config.json")))},browser=await launchBrowser(),checks=[],users=[],contexts=[];let stage='initialization',lastPage;
const pass=id=>{checks.push({id,status:'passed'});console.log('PASS '+id);};
async function admin(path,method='GET',body){const r=await operatorRequest('/admin/realms/auth-https'+path,{method,headers:await operatorHeaders(owner),...(body===undefined?{}:{body:JSON.stringify(body)})});assert.equal(r.ok,true,'Admin fixture request failed '+r.status);return r;}
async function fixture(kind){const suffix=randomBytes(4).toString('hex'),u={username:'mfa-check-'+kind+'-'+suffix,password:randomBytes(24).toString('base64url'),email:'check-'+suffix+'@prototype.test',kind};await admin('/users','POST',{username:u.username,email:u.email,emailVerified:false,enabled:true,firstName:'MFA',lastName:kind,credentials:[{type:'password',value:u.password,temporary:false}]});u.id=(await(await admin('/users?exact=true&username='+u.username)).json())[0].id;users.push(u);if(kind==='privileged')await admin('/users/'+u.id+'/role-mappings/realm','POST',[await(await admin('/roles/auth-privileged')).json()]);return u;}
async function request(t,path,method='GET',body){return t.page.evaluate(async({path,method,body})=>{const r=await fetch(path,{method,redirect:'manual',...(body===undefined?{}:{headers:{'content-type':'application/x-www-form-urlencoded'},body})});let json;try{json=await r.json()}catch{}return {status:r.status,body:json};},{path,method,body});}
const statusPath=name=>name==='foundation'?'/status':'/api/profile',startPath=name=>name==='foundation'?'/login':'/api/auth/oidc/start',securityPath=name=>name==='foundation'?'/security':'/api/auth/security';
async function start(name,u){const context=await browser.newContext(),page=await context.newPage();contexts.push(context);page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(15000);lastPage=page;const a=cluster.config.apps[name],t={name,u,context,page,a};await page.goto(a.origin+startPath(name));await password(t);return t;}
async function password(t){lastPage=t.page;if(await t.page.locator('#username').count())await t.page.locator('#username').fill(t.u.username);await t.page.locator('#password').fill(t.u.password);await t.page.locator('#kc-login').click();}
async function mail(u,needle){for(let i=0;i<30;i++){const list=await(await fetch('http://127.0.0.1:18025/api/v1/messages')).json();const item=list.messages?.find(m=>m.To.some(to=>to.Address===u.email)&&m.Subject.toLowerCase().includes(needle));if(item){const msg=await(await fetch('http://127.0.0.1:18025/api/v1/message/'+item.ID)).json();const text=msg.Text||msg.HTML;const urls=[...text.matchAll(/https:\/\/localhost:18443\/[^\s<>"']+/g)].map(m=>m[0].replaceAll('&amp;','&'));const url=urls.find(s=>s.includes('/login-actions/'));assert.ok(url,'Expected local Keycloak action link');return url;}await new Promise(r=>setTimeout(r,300));}throw Error('Local email not received');}
async function verifyEmail(t){const url=await mail(t.u,'verif');await t.page.goto(url);if(await t.page.locator('button[name=confirm]').count())await t.page.locator('button[name=confirm]').click();t.u.verified=true;}
function otp(secret,offset=0){const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const ch of secret.toUpperCase().replace(/\s/g,''))bits+=chars.indexOf(ch).toString(2).padStart(5,'0');const bytes=Buffer.from(bits.match(/.{8}/g).map(b=>parseInt(b,2)));const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)+offset));const h=createHmac('sha1',bytes).update(counter).digest(),i=h[19]&15;return String((h.readUInt32BE(i)&0x7fffffff)%1000000).padStart(6,'0');}
async function submitOtp(t,code){await t.page.locator('#otp').fill(code);await t.page.locator('#kc-login').click();}
async function enroll(t){await t.page.locator('#totpSecret').waitFor({state:'attached'});await t.page.locator('#mode-manual').click();t.u.secret=await t.page.locator('#kc-totp-secret-key').innerText();await t.page.locator('#totp').fill(otp(t.u.secret));if(await t.page.locator('#userLabel').count())await t.page.locator('#userLabel').fill('Prototype test');t.u.lastStep=Math.floor(Date.now()/30000);await t.page.locator('#saveTOTPBtn').click();await t.page.waitForURL(u=>u.origin===t.a.origin);}
async function signedIn(t){await t.page.waitForURL(u=>u.origin===t.a.origin);await t.page.waitForLoadState('networkidle');assert.equal((await request(t,statusPath(t.name))).status,200);}
async function freshOtp(t){const step=Math.floor(Date.now()/30000);if(t.u.lastStep>=step)await new Promise(r=>setTimeout(r,(t.u.lastStep+1)*30000-Date.now()+300));const code=otp(t.u.secret);t.u.lastStep=Math.floor(Date.now()/30000);await submitOtp(t,code);return code;}
async function codes(t){console.log('CHECK save recovery codes'); await t.page.locator('#kc-recovery-codes-list').waitFor();t.u.codes=(await t.page.locator('#kc-recovery-codes-list li').allTextContents()).map(s=>s.trim().replace(/^\d+:\s*/,''));assert.equal(t.u.codes.length,12);await t.page.locator('#kcRecoveryCodesConfirmationCheck').check();if(await t.page.locator('#logout-sessions').count())await t.page.locator('#logout-sessions').uncheck();await t.page.locator('#saveRecoveryAuthnCodesBtn').click();}
async function recovery(t,code){if(!await t.page.locator('#recoveryCodeInput').count()){await t.page.getByRole('link',{name:/try another way/i}).click();await t.page.getByRole('button',{name:/recovery/i}).click();}await t.page.locator('#recoveryCodeInput').fill(code);await t.page.locator('#kc-login').click();}
async function enter(name,u){console.log('CHECK login '+name+' '+u.kind); const t=await start(name,u);await freshOtp(t);await signedIn(t);return t;}
async function action(t,kind){console.log('CHECK '+t.name+' '+kind); await t.page.goto(t.a.origin+securityPath(t.name));stage=t.name+' '+kind+' form submit';await t.page.locator('form').filter({has:t.page.locator('input[name=action][value='+kind+']')}).locator('button').click();stage=t.name+' '+kind+' fresh authentication';await t.page.locator('#password').waitFor({state:'visible'});await password(t);if(t.u.secret)await freshOtp(t);}
async function deniedEveryWorker(t){for(const index of [0,1]){cluster.select(t.name,index);assert.equal((await request(t,statusPath(t.name))).status,401);}cluster.select(t.name,null);}
const accountUrl='https://localhost:18443/realms/auth-https/account/account-security/signing-in';
process.chdir(root);
async function checkWorkers(t,status){
 const cookie=(await t.context.cookies(t.a.origin)).map(c=>c.name+'='+c.value).join('; ');
 for(const index of [0,1]){
  const actual=await new Promise((done,reject)=>{const req=http.get({socketPath:'.runtime/'+t.name+'-'+index+'.sock',path:statusPath(t.name),headers:{host:new URL(t.a.origin).host,cookie}},res=>{res.resume();done(res.statusCode)});req.on('error',reject);});
  assert.equal(actual,status);
 }
}
async function beginDelete(t){
 await t.page.getByTestId('otp/credential-list').getByRole('button',{name:'Delete',exact:true}).click();
 console.log('CHECK fresh password');await t.page.locator('#password').waitFor();await password(t);console.log('CHECK fresh OTP');await t.page.locator('#otp').waitFor();
 assert.equal(await t.page.getByRole('button',{name:'Confirm deletion',exact:true}).count(),0);
 await freshOtp(t);await t.page.getByRole('button',{name:'Confirm deletion',exact:true}).waitFor();
}
try {
 stage='first enrollment';const u=await fixture('regular');await admin('/users/'+u.id,'PUT',{requiredActions:['CONFIGURE_TOTP']});
 const first=await start('foundation',u);await verifyEmail(first);await enroll(first);await signedIn(first);
 const current=await enter('foundation',u),peer=await enter('bodywar',u);lastPage=current.page;
 stage='open account console';await current.page.goto(accountUrl);await current.page.getByRole('heading',{name:'Signing in',exact:true}).waitFor();
 stage='cancel deletion';console.log('CHECK cancellation');await beginDelete(current);await current.page.getByRole('button',{name:'Decline',exact:true}).click();
 await current.page.getByRole('heading',{name:'Signing in',exact:true}).waitFor();
 assert.equal((await(await admin('/users/'+u.id+'/credentials')).json()).some(c=>c.type==='otp'),true);
 await checkWorkers(peer,200);pass('cancel-deletion-preserves-factor-and-working-session');
 stage='confirm deletion';await beginDelete(current);pass('delete-requires-fresh-password-and-existing-factor');
 const errors=[];current.page.on('response',r=>{if(r.status()>=400)errors.push({status:r.status(),path:new URL(r.url()).pathname})});
 await current.page.getByRole('button',{name:'Confirm deletion',exact:true}).click();
 await current.page.getByRole('heading',{name:'Sign in to continue',exact:true}).waitFor();
 const resultUrl=new URL(current.page.url());assert.equal(resultUrl.search,'');assert.equal(resultUrl.hash,'');
 assert.deepEqual(errors,[]);assert.equal((await(await admin('/users/'+u.id+'/credentials')).json()).some(c=>c.type==='otp'),false);
 pass('confirmed-deletion-removes-factor-and-shows-clean-sign-in-screen');
 await checkWorkers(first,401);await checkWorkers(current,401);await checkWorkers(peer,401);
 pass('deletion-invalidates-existing-sessions-on-both-workers-of-both-apps');
 stage='fresh account sign-in';await current.page.getByRole('link',{name:'Sign in again',exact:true}).click();
 await current.page.locator('#password').waitFor();await password(current);
 await current.page.getByRole('heading',{name:'Signing in',exact:true}).waitFor();
 assert.equal(await current.page.getByTestId('otp/not-set-up').count(),1);pass('fresh-account-sign-in-shows-authenticator-removed');
 stage='untrusted completion URL';const context=await browser.newContext();contexts.push(context);const page=await context.newPage();page.setDefaultTimeout(15000);
 const requests=[];page.on('request',r=>{const path=new URL(r.url()).pathname;if(path.endsWith('/token')||path.endsWith('/account/credentials'))requests.push(path)});
 await page.goto(accountUrl+'?kc_action_status=success&code=untrusted&state=untrusted');
 await page.getByRole('heading',{name:'Sign in to continue',exact:true}).waitFor();assert.deepEqual(requests,[]);
 await page.getByRole('link',{name:'Sign in again',exact:true}).click();await page.locator('#password').waitFor();
 pass('forged-completion-parameters-grant-no-authentication');
} catch(error){console.error(JSON.stringify({failed_stage:stage,error:error.name,message:error.message.replace(/https?:\/\/[^\s"']+/g,'[URL]').replace(/(?:fill|type)\([^\n]*\)/g,'fill([redacted])')}));process.exitCode=1;}
finally {for(const c of contexts)await c.close();await browser.close();for(const u of users)await admin('/users/'+u.id,'DELETE');writeFileSync(resolve(root,'evidence/delete-live.json'),JSON.stringify({status:process.exitCode?'failed':'passed',checks,authority_effect:'none',open_questions_ref:'../README.md#open-questions'},null,2)+'\n');}
