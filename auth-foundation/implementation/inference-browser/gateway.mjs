import {assertRenewal} from './renewal.mjs';
import {createMemoryState} from './state.mjs';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {POLICY} from '../authentication-https/src/session-state.mjs';
// In-process browser adapter; bearer tokens never enter browser responses. Open Questions: README.md.
const random=()=>randomBytes(32).toString('base64url');
const cookie=(name,value,age)=>`${name}=${value}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}`;
const readCookie=(request,name)=>{const parts=(request.headers.get('cookie')??'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(name+'='));return parts.length===1?parts[0].slice(name.length+1):undefined;};
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function createBrowserGateway({origin,oauth,enrollment,inference,clock=()=>Math.floor(Date.now()/1000),capacity=256,state=createMemoryState()}){
 if(new URL(origin).origin!==origin||!origin.startsWith('https://')||![oauth?.begin,oauth?.finish,oauth?.validate,enrollment?.enroll,enrollment?.revoke,inference].every(f=>typeof f==='function')||!Number.isSafeInteger(capacity)||capacity<1||capacity>256)throw Error('BROWSER_BINDING');
 const sessions=state.sessions,transactions=new Map();
 const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
 const redirect=(url,cookies=[])=>{const h=new Headers({location:url,'cache-control':'no-store'});for(const c of cookies)h.append('set-cookie',c);return new Response(null,{status:303,headers:h});};
 function revoke(id){return state.transaction(()=>{const s=sessions.get(id);if(s){enrollment.revoke(s.identity);delete s.token;sessions.delete(id);}for(const [k,t]of transactions)if(t.parent===id){t.cancelled=true;transactions.delete(k);}});}
 function live(id){return state.transaction(()=>{const s=sessions.get(id);if(s&&(s.expires<=clock()||s.last+POLICY.idle<=clock())){revoke(id);return;}return s;});}
 const same=(id,s)=>Boolean(s&&live(id)?.csrf===s.csrf);
 return async request=>{
  try{
   const url=new URL(request.url);if(url.origin!==origin)return json({error:'INVALID_ORIGIN'},400);
   for(const id of sessions.keys())live(id);for(const [id,t]of transactions)if(t.expires<=clock()){t.cancelled=true;transactions.delete(id);}
   const sid=readCookie(request,'__Host-inference_session'),session=live(sid);
   if(request.method==='GET'&&url.pathname==='/')return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Inference</title><main><h1>Inference</h1><a href="/login">Sign in</a><section id="app" hidden><label>Tenant <select id="tenant"></select></label><form id="ask"><label>Message <textarea id="message" required></textarea></label><button>Send</button></form><button id="renew">Continue session</button><button id="logout">Sign out</button><pre id="result" aria-live="polite"></pre></section></main><script src="/browser.js"></script></html>',{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'none'; script-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",'referrer-policy':'no-referrer'}});
   if(request.method==='GET'&&url.pathname==='/browser.js')return new Response(`let state;const app=document.querySelector('#app'),out=document.querySelector('#result');fetch('/session').then(async r=>{if(!r.ok)return;state=await r.json();app.hidden=false;for(const tenant of state.tenants){const option=document.createElement('option');option.value=tenant;option.textContent=tenant;document.querySelector('#tenant').append(option);}});document.querySelector('#ask').onsubmit=async event=>{event.preventDefault();const r=await fetch('/v1/inference',{method:'POST',headers:{'content-type':'application/json','x-csrf-token':state.csrf,'x-tenant-id':document.querySelector('#tenant').value},body:JSON.stringify({task:'text.generate',input:{messages:[{role:'user',content:document.querySelector('#message').value}]}})});const data=await r.json();out.textContent=data.error==='RENEWAL_REQUIRED'?'Choose Continue session, then send your request again.':JSON.stringify(data,null,2);};document.querySelector('#renew').onclick=async()=>{const r=await fetch('/renew',{method:'POST',headers:{'x-csrf-token':state.csrf}});const data=await r.json();if(r.ok)location.assign(data.authorization_url);else out.textContent='Sign in again to continue.';};document.querySelector('#logout').onclick=async()=>{await fetch('/logout',{method:'POST',redirect:'manual',headers:{'x-csrf-token':state.csrf}});location.href='/';};`,{headers:{'content-type':'text/javascript','cache-control':'no-store'}});
   if(request.method==='POST'&&url.pathname==='/renew'){
    if(url.search||!session?.authentication||request.headers.get('origin')!==origin||!equal(request.headers.get('x-csrf-token'),session.csrf))return json({error:'FORBIDDEN'},403);
    if(transactions.size>=capacity)return json({error:'LOGIN_UNAVAILABLE'},429);
    if(session.identity.expires_at>clock()){await oauth.validate(session.token);await enrollment.enroll(session.identity);}
    const started=await oauth.begin(session);if(!same(sid,session)||transactions.size>=capacity)return json({error:'RENEWAL_FAILED'},401);
    const prior=readCookie(request,'__Host-inference_login');if(transactions.has(prior)){transactions.get(prior).cancelled=true;transactions.delete(prior);}
    const id=random();transactions.set(id,{...started,expires:clock()+180,parent:sid,renew:true,consumed:false,cancelled:false});
    const response=json({authorization_url:started.url});response.headers.append('set-cookie',cookie('__Host-inference_login',id,180));return response;
   }
   if(request.method==='GET'&&url.pathname==='/login'){
    if(url.search||transactions.size>=capacity)return json({error:'LOGIN_UNAVAILABLE'},400);
    const started=await oauth.begin();if(transactions.size>=capacity)return json({error:'LOGIN_UNAVAILABLE'},429);
    const prior=readCookie(request,'__Host-inference_login');if(transactions.has(prior)){transactions.get(prior).cancelled=true;transactions.delete(prior);}
    const id=random();transactions.set(id,{...started,expires:clock()+180,parent:session?sid:null,consumed:false,cancelled:false});return redirect(started.url,[cookie('__Host-inference_login',id,180)]);
   }
   if(request.method==='GET'&&url.pathname==='/callback'){
    const id=readCookie(request,'__Host-inference_login'),t=transactions.get(id);
    if(!t||t.consumed||t.cancelled)return json({error:'LOGIN_FAILED'},401);t.consumed=true;
    let authenticated,committed=false;
    try{
     authenticated=await oauth.finish(url.href,t.transaction);
     if(authenticated.identity.kind!=='human'||typeof authenticated.token!=='string'||!authenticated.token)throw Error('LOGIN_FAILED');
     if(t.renew)assertRenewal(session??{},authenticated);
     const tenants=await enrollment.enroll(authenticated.identity);
     let next,expires;state.transaction(()=>{
     if(t.cancelled||t.expires<=clock()||transactions.get(id)!==t||request.signal.aborted||(t.parent&&(!same(t.parent,session)||sid!==t.parent))||sessions.size>=capacity&&!t.parent)throw Error('LOGIN_FAILED');
     const parent=t.parent?live(t.parent):undefined;
     const absolute=t.renew?parent.absolute:clock()+POLICY.absolute;
     if(t.parent)revoke(t.parent);
     next=random();expires=authenticated.authentication?absolute:Math.min(authenticated.identity.expires_at,absolute);if(expires<=clock())throw Error('LOGIN_FAILED');
     sessions.set(next,{...authenticated,csrf:random(),tenants,absolute,expires,last:t.renew?parent.last:clock()});});
     committed=true;return redirect('/',[cookie('__Host-inference_session',next,expires-clock()),cookie('__Host-inference_login','',0)]);
    }finally{if(authenticated&&!committed)enrollment.revoke(authenticated.identity);transactions.delete(id);}
   }
   if(request.method==='GET'&&url.pathname==='/session'){
    if(!session)return json({error:'UNAUTHENTICATED'},401);
    if(session.identity.expires_at<=clock())return json({tenants:[],csrf:session.csrf,expires_at:session.expires,renewal_required:true});
    // Refresh memberships from current trusted policy; no browser authority fields.
    await oauth.validate(session.token);const tenants=await enrollment.enroll(session.identity);if(!same(sid,session))return json({error:'UNAUTHENTICATED'},401);
    return json({tenants,csrf:session.csrf,expires_at:session.expires,renewal_required:false});
   }
   if(request.method==='POST'&&url.pathname==='/logout'){
    if(!session||request.headers.get('origin')!==origin||!equal(request.headers.get('x-csrf-token'),session.csrf))return json({error:'FORBIDDEN'},403);
    revoke(sid);return redirect('/',[cookie('__Host-inference_session','',0),cookie('__Host-inference_login','',0)]);
   }
   if(['/healthz','/v1/models','/v1/capabilities','/v1/inference'].includes(url.pathname)){
    if(url.pathname==='/healthz')return inference(request);
    // Bearer clients use the same enrollment/security port independently of cookies.
    if(request.headers.has('authorization')){if(sid)return json({error:'AMBIGUOUS_AUTHENTICATION'},400);return inference(request);}
    if(!session)return json({error:'UNAUTHENTICATED'},401);
    if(session.identity.expires_at<=clock())return json({error:'RENEWAL_REQUIRED'},409);
    if(request.method!=='GET'&&(request.headers.get('origin')!==origin||!equal(request.headers.get('x-csrf-token'),session.csrf)))return json({error:'FORBIDDEN'},403);
    const headers=new Headers(request.headers);headers.delete('cookie');headers.delete('x-csrf-token');headers.set('authorization','Bearer '+session.token);
    const forwarded=new Request(request,{headers});const response=await inference(forwarded);
    let retained;try{retained=state.transaction(()=>{const current=live(sid);if(!current||current.csrf!==session.csrf)return false;sessions.set(sid,{...current,last:clock()});return true;});}catch(error){await response.body?.cancel();throw error;}
    if(!retained){await response.body?.cancel();return json({error:'UNAUTHENTICATED'},401);}return response;
   }
   return json({error:'NOT_FOUND'},404);
  }catch{return json({error:'AUTHENTICATION_FAILED'},401);}
 };
}
