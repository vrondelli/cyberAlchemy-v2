import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {setTimeout as delay} from 'node:timers/promises';
import {readFile,chmod} from 'node:fs/promises';
import {createApp} from '../src/app.mjs';
import {now} from '../src/identity.mjs';
import {launchBrowser} from '../scripts/browser.mjs';
const c=JSON.parse(await readFile('.runtime/config.json')),origin=c.origin;
// Real HTTPS proxy and OIDC issuer; only app lifecycle time is controlled.
// Run with the normal app stopped; socket binding fails if another app owns it.
async function fixture(){
 // Each new browser loads the theme again; allow the real proxy rate bucket to refill.
 await delay(2500);
 let time=now(),hold,notify;
 const handler=await createApp(c,{clock:()=>time});
 const server=http.createServer(async(req,res)=>{
  if(new URL(req.url,origin).pathname==='/callback'&&hold){const pending=hold;notify();await pending;}
  void handler(req,res);
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen('.runtime/socket/app.sock',resolve)});
 await chmod('.runtime/socket/app.sock',0o600);
 const browser=await launchBrowser(),context=await browser.newContext(),page=await context.newPage();context.setDefaultTimeout(10000);context.setDefaultNavigationTimeout(10000);
 async function direct(path,options={}){
  const cookies=(await context.cookies(origin)).map(x=>x.name+'='+x.value).join('; ');
  return fetch(origin+path,{...options,redirect:'manual',headers:{cookie:cookies,...options.headers}});
 }
 async function signIn(){await page.locator('#password').waitFor();if(await page.locator('#username').count())await page.locator('#username').fill('alice');await page.locator('#password').fill(c.userPassword);await page.locator('#kc-login').click();await page.waitForURL(origin+'/');await page.getByRole('heading',{name:'You’re signed in'}).waitFor();}
 return {context,page,direct,signIn,advance:n=>{time+=n},pauseCallback(){let release;hold=new Promise(r=>{release=r});const reached=new Promise(r=>{notify=r});return {reached,release:()=>{hold=null;release()}}},async close(){await browser.close();await new Promise(r=>{server.close(r);server.closeAllConnections()})}};
}

test('idle locks both tabs despite live SSO; retry requires credentials and rotates cookie',{timeout:30000},async()=>{
 const h=await fixture();try{
 await h.page.goto(origin);await h.signIn();
 const old=(await h.context.cookies(origin)).find(x=>x.name==='__Host-auth_session').value;
 h.advance(899);assert.equal((await h.direct('/health')).status,200);h.advance(1);await h.page.goto(origin+'/document');await h.page.getByRole('heading',{name:'Your session expired'}).waitFor();
 const second=await h.context.newPage();await second.goto(origin);await second.getByRole('heading',{name:'Your session expired'}).waitFor();
 await h.page.getByRole('link',{name:'Sign in again'}).click();
 assert.equal(new URL(h.page.url()).searchParams.get('max_age'),'0');await h.signIn();
 const current=(await h.context.cookies(origin)).find(x=>x.name==='__Host-auth_session').value;assert.notEqual(current,old);
 const stale=await h.direct('/document',{headers:{cookie:'__Host-auth_session='+old}});assert.equal(stale.status,401);
 await h.context.clearCookies({name:'__Host-auth_session'});await h.page.goto(origin);await h.page.locator('#password').waitFor();
 }finally{await h.close()}
});
test('token renewal uses SSO without credentials; absolute deadline survives activity',{timeout:30000},async()=>{
 const h=await fixture();try{
 await h.page.goto(origin);await h.signIn();const old=(await h.context.cookies(origin)).find(x=>x.name==='__Host-auth_session').value;
 h.advance(301);const r=await h.direct('/');assert.equal(r.status,303);const auth=new URL(r.headers.get('location'));assert.equal(auth.searchParams.get('prompt'),'none');
 // direct request does not install its transaction cookie in the browser, so navigate normally.
 await h.page.goto(origin);await h.page.getByRole('heading',{name:'You’re signed in'}).waitFor();
 const current=(await h.context.cookies(origin)).find(x=>x.name==='__Host-auth_session').value;assert.notEqual(current,old);
 // Continue activity near the idle limit, crossing the first login's original idle boundary.
 h.advance(899);await h.page.goto(origin);await h.page.getByRole('heading',{name:'You’re signed in'}).waitFor();
 h.advance(28800-1200);await h.page.goto(origin);await h.page.getByRole('heading',{name:'Your session expired'}).waitFor();assert.match(await h.page.locator('body').innerText(),/maximum sign-in time/);
 }finally{await h.close()}
});
test('logout while renewal callback is pending cannot restore the session',{timeout:30000},async()=>{
 const h=await fixture();let pause;try{
 await h.page.goto(origin);await h.signIn();const csrf=await h.page.locator('input[name=csrf]').inputValue();h.advance(301);
 pause=h.pauseCallback();const navigation=h.page.goto(origin);await pause.reached;
 const logout=await h.direct('/logout',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrf})});assert.equal(logout.status,303);
 pause.release();await navigation;await h.page.getByRole('heading',{name:'Sign-in could not be completed'}).waitFor();
 assert.equal((await h.direct('/document')).status,401);
 }finally{pause?.release();await h.close()}
});
test('idle deadline crossed during renewal callback fails closed',{timeout:30000},async()=>{
 const h=await fixture();let pause;try{
 await h.page.goto(origin);await h.signIn();h.advance(850);
 pause=h.pauseCallback();const navigation=h.page.goto(origin);await pause.reached;h.advance(50);pause.release();await navigation;
 await h.page.getByRole('heading',{name:'Sign-in could not be completed'}).waitFor();assert.equal((await h.direct('/document')).status,401);
 }finally{pause?.release();await h.close()}
});

test('logout during asynchronous token validation cancels a consumed callback',{timeout:30000},async()=>{
 const h=await fixture();const realFetch=globalThis.fetch;let release;try{
 await h.page.goto(origin);await h.signIn();const csrf=await h.page.locator('input[name=csrf]').inputValue();h.advance(301);
 let notify;const reached=new Promise(r=>{notify=r}),held=new Promise(r=>{release=r});let armed=true;
 globalThis.fetch=async(...args)=>{const response=await realFetch(...args);if(armed&&String(args[0]).endsWith('/token/introspect')){armed=false;notify();await held;}return response;};
 const navigation=h.page.goto(origin);await reached;
 const logout=await h.direct('/logout',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrf})});assert.equal(logout.status,303);
 release();await navigation;await h.page.getByRole('heading',{name:'Sign-in could not be completed'}).waitFor();assert.equal((await h.direct('/document')).status,401);
 }finally{release?.();globalThis.fetch=realFetch;await h.close()}
});
test('a concurrent replay cannot consume a transaction twice',{timeout:30000},async()=>{
 const h=await fixture();const realFetch=globalThis.fetch;let release;try{
 await h.page.goto(origin);await h.signIn();h.advance(301);
 let notify,callback;const reached=new Promise(r=>{notify=r}),held=new Promise(r=>{release=r});let armed=true;
 h.page.on('request',r=>{const u=new URL(r.url());if(u.origin===origin&&u.pathname==='/callback')callback=u.pathname+u.search;});
 globalThis.fetch=async(...args)=>{const response=await realFetch(...args);if(armed&&String(args[0]).endsWith('/token/introspect')){armed=false;notify();await held;}return response;};
 const navigation=h.page.goto(origin);await reached;assert.ok(callback);
 assert.equal((await h.direct(callback)).status,400);release();await navigation;
 await h.page.getByRole('heading',{name:'You’re signed in'}).waitFor();assert.equal((await h.direct('/document')).status,200);
 }finally{release?.();globalThis.fetch=realFetch;await h.close()}
});
