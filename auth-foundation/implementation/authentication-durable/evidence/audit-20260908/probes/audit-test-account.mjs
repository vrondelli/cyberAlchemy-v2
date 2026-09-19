// Live, trusted-TLS regression against the running durable prototype.
// Open questions: ../../../development/authentication-v1/MFA-RECOVERY-PLAN.md
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {launchBrowser} from '../../authentication-https/scripts/browser.mjs';
import {operatorRequest,operatorHeaders} from '../../authentication-https/scripts/operator.mjs';
import {ensureAccountAccess} from '../scripts/account-access.mjs';
const root=resolve(new URL('..',import.meta.url).pathname),original=resolve(root,'../authentication-https');
process.env.LD_LIBRARY_PATH=resolve(original,'.runtime/browser-libs/root/usr/lib/x86_64-linux-gnu');
const owner=JSON.parse(readFileSync(resolve(original,'.runtime/config.json'))),config=JSON.parse(readFileSync(resolve(root,'.runtime/config.json')));
const request=async(path,method='GET',body)=>{
 const r=await operatorRequest('/admin/realms/auth-https'+path,{method,headers:await operatorHeaders(owner),...(body===undefined?{}:{body:JSON.stringify(body)})});
 assert.ok(r.ok,'Operator fixture request failed: '+r.status);return r;
};
const get=async path=>(await request(path)).json(),checks=[],contexts=[];
const pass=id=>{checks.push(id);console.log('PASS '+id);};
const u={username:'account-check-'+randomBytes(5).toString('hex'),password:randomBytes(24).toString('base64url')};
const browser=await launchBrowser();let userId;
const target=config.issuer+'/account/account-security/signing-in';
async function login(name){
 const context=await browser.newContext(),page=await context.newPage();contexts.push(context);page.setDefaultTimeout(15000);
 const app=config.apps[name];await page.goto(app.origin+(name==='foundation'?'/login':'/api/auth/oidc/start'));
 await page.locator('#username').fill(u.username);await page.locator('#password').fill(u.password);await page.locator('#kc-login').click();
 await page.waitForURL(url=>url.origin===app.origin);return {page,app};
}
try {
 await request('/users','POST',{username:u.username,email:u.username+'@prototype.test',emailVerified:true,enabled:true,firstName:'Account',lastName:'Regression',credentials:[{type:'password',value:u.password,temporary:false}]});
 userId=(await get('/users?exact=true&username='+u.username))[0].id;
 const userPath='/users/'+userId;
 await request(userPath+'/role-mappings/realm','DELETE',await get(userPath+'/role-mappings/realm'));
 const legacy=await login('foundation');
 const denied=legacy.page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/account/credentials')&&r.status()===401);
 await legacy.page.goto(target);await denied;
 await legacy.page.getByText('Sorry, an unexpected error has occurred.').waitFor();
 pass('legacy-import-without-account-roles-reproduces-reported-error');
 const before=(await get(userPath+'/credentials')).map(c=>({id:c.id,type:c.type,createdDate:c.createdDate}));
 assert.deepEqual((await ensureAccountAccess({get,request,userId})).added_roles,['view-profile','manage-account']);
 assert.deepEqual((await ensureAccountAccess({get,request,userId})).added_roles,[]);
 assert.deepEqual((await get(userPath+'/credentials')).map(c=>({id:c.id,type:c.type,createdDate:c.createdDate})),before);
 pass('migration-is-idempotent-and-preserves-credentials');
 const management=(await get('/clients?clientId=realm-management'))[0];
 assert.deepEqual(await get(userPath+'/role-mappings/clients/'+management.id+'/composite'),[]);
 assert.deepEqual(await get(userPath+'/role-mappings/realm/composite'),[]);
 pass('self-service-migration-grants-no-realm-or-administrator-roles');
 for(const name of ['foundation','bodywar']){
  const {page,app}=await login(name);
  await page.goto(app.origin+(name==='foundation'?'/security':'/api/auth/security'));
  const link=page.getByRole('link',{name:'Manage saved authenticators and remove a lost device'});
  assert.equal(await link.getAttribute('href'),target);
  const credentials=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/account/credentials')&&r.status()===200);
  await link.click();await credentials;
  await page.getByRole('heading',{name:'Signing in',exact:true}).waitFor();
  await page.getByRole('heading',{name:'Two-factor authentication',exact:true}).waitFor();
  assert.equal(await page.getByText('Sorry, an unexpected error has occurred.').count(),0);
  pass(name+'-link-opens-working-credential-management');
 }
} catch(error){console.error('FAIL account console regression: '+error.name);process.exitCode=1;}
finally {
 for(const context of contexts)await context.close();await browser.close();
 if(userId)await request('/users/'+userId,'DELETE');
 writeFileSync(resolve(root,'evidence/audit-20260908/account-live.json'),JSON.stringify({status:process.exitCode?'failed':'passed',checks,authority_effect:'none',open_questions_ref:'../README.md#open-questions'},null,2)+'\n');
}
