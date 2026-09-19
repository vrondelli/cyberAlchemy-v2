import * as oidc from 'openid-client';
import {randomBytes} from 'node:crypto';
import {configuration,verifier,active,now} from './identity.mjs';
import {authorize} from './bridge.mjs';
import {POLICY,sessionState,checkAuthentication} from './session-state.mjs';
import {createOperationalEvidence,correlationId} from './operational-evidence.mjs';

// Clock injection is an in-process test seam, never an HTTP or environment control.
export async function createApp(c,{clock=now}={}) {
const config=await configuration(c),apiConfig=await configuration(c,true),verify=verifier(c);
const sessions=new Map(),transactions=new Map();
const random=()=>randomBytes(32).toString('base64url');
let inFlight=0;
const counters={requests:0,allowed:0,denied:0};
const operationalEvidence=createOperationalEvidence();
const expectedHost=new URL(c.origin).host;
function cookie(req,name){const values=(req.headers.cookie||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(name+'='));return values.length===1?values[0].slice(name.length+1):undefined;}
function setCookie(name,value,age){return `${name}=${value}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}`;}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));}
function redirect(res,url,cookies){res.writeHead(303,{Location:url,...(cookies?{'Set-Cookie':cookies}:{})});res.end();}
function html(res,status,title,content){res.writeHead(status,{'Content-Type':'text/html; charset=utf-8'});res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Auth Foundation</title><link rel="stylesheet" href="/style.css"><main><p class="eyebrow">AUTH FOUNDATION / LOCAL PROTOTYPE</p><h1>${title}</h1>${content}<footer>Local test environment · test accounts only</footer></main></html>`);}
function page(res,session){return html(res,200,'One identity.<br>Explicit access.',`<section><h2>You’re signed in</h2><p>Your session locks after 15 minutes of inactivity, with an eight-hour maximum.</p><a class="button" href="/document">Open protected document</a><form method="post" action="/logout"><input type="hidden" name="csrf" value="${session.csrf}"><button>Sign out</button></form></section>`);}
function loginError(res,status=401){res.setHeader('Set-Cookie',setCookie('__Host-auth_login','',0));return html(res,status,'Sign-in could not be completed','<section><p>The sign-in attempt expired, was cancelled, or could not be verified. Please start a new attempt.</p><a class="button" href="/login">Try signing in again</a></section>');}
const destinations=Object.freeze({home:'/',document:'/document'});
async function issuerReady(){const response=await fetch(c.issuer+'/.well-known/openid-configuration',{signal:AbortSignal.timeout(3000),redirect:'error'});if(!response.ok)throw Error('Issuer unavailable');await response.body?.cancel();}
function expirePage(res,reason='idle-expired'){
 return html(res,401,'Your session expired',`<section><p>${reason==='absolute-expired'?'The maximum sign-in time was reached.':'Sign in again to continue securely.'}</p><a class="button" href="/login">Sign in again</a></section>`);
}
function cancelTransaction(id){const t=transactions.get(id);if(t)t.cancelled=true;transactions.delete(id);}
function invalidate(id,reason){const s=sessions.get(id);if(s){s.status=reason;delete s.token;delete s.idToken;}for(const [tid,t] of transactions)if(t.parentId===id)cancelTransaction(tid);}
function live(id){const s=sessions.get(id);return sessionState(s,clock())==='active'?s:undefined;}
async function login(req,res,destination,renew=false){
 if(!Object.hasOwn(destinations,destination))throw Error('Invalid destination');
 if(transactions.size>=256)return loginError(res,429);
 await issuerReady();
 if(transactions.size>=256)return loginError(res,429);
 // One outstanding transaction per browser; never accept a caller-supplied return URL.
 cancelTransaction(cookie(req,'__Host-auth_login'));
 const parentId=cookie(req,'__Host-auth_session'),parent=live(parentId);
 if(renew&&!parent)return expirePage(res);
 const issued=now();
 const id=random(),state=oidc.randomState(),nonce=oidc.randomNonce(),verifier=oidc.randomPKCECodeVerifier();
 transactions.set(id,{state,nonce,verifier,destination,expires:clock()+180,issued,parentId:parent?parentId:undefined,parent,renew,consumed:false,cancelled:false});
 const location=oidc.buildAuthorizationUrl(config,{redirect_uri:c.origin+'/callback',scope:'openid',state,nonce,code_challenge:await oidc.calculatePKCECodeChallenge(verifier),code_challenge_method:'S256',max_age:renew?String(POLICY.absolute):'0',prompt:renew?'none':'login',...(renew?{id_token_hint:parent.idToken}:{})});
 return redirect(res,location.href,setCookie('__Host-auth_login',id,180));
}
async function body(req){let value='';for await(const chunk of req){value+=chunk;if(value.length>1024)throw Error('Body limit');}return new URLSearchParams(value);}
async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin');res.setHeader('Content-Security-Policy',`default-src 'none'; style-src 'self'; form-action 'self' ${c.issuer}/protocol/openid-connect/logout; frame-ancestors 'none'; base-uri 'none'`);
 if(req.headers.host!==expectedHost||req.headers['x-forwarded-proto']!=='https'||req.headers['x-forwarded-host']!==expectedHost)return json(res,400,{error:'Invalid host'});
 res.setHeader('X-Auth-Correlation-Id',correlationId());
 counters.requests++;
 if(inFlight>=32){operationalEvidence.offer({reject:true});return json(res,503,{error:'Busy'});}
 const completeEvidence=operationalEvidence.offer();
 inFlight++;
 let browserRequest=false;
 try {
 if(req.headers['x-auth-correlation-id']!==undefined)return json(res,400,{error:'Caller correlation field rejected'});
 const url=new URL(req.url,c.origin);
 browserRequest=req.method==='GET'&&['/','/login','/callback','/document'].includes(url.pathname);
 if(url.pathname!=='/callback'&&url.search)return json(res,400,{error:'Unexpected parameters'});
 for(const [id,t] of transactions)if(t.expires<=clock())cancelTransaction(id);
 for(const [id,s] of sessions){const state=sessionState(s,clock());if(state!=='active'&&s.status==='active')invalidate(id,state);if(s.absolute+180<=clock())sessions.delete(id);}
 const sessionId=cookie(req,'__Host-auth_session'),session=live(sessionId);
 const expired=sessionId&&!session;

 if(req.method==='GET'&&url.pathname==='/health')return json(res,200,{status:'staging-candidate',profile:c.profile,...counters,operational_evidence:operationalEvidence.snapshot()});
 if(req.method==='GET'&&url.pathname==='/style.css'){res.writeHead(200,{'Content-Type':'text/css'});return res.end('body{margin:0;background:#111b22;color:#e9eee8;font:18px/1.6 system-ui}main{max-width:760px;margin:8vh auto;padding:24px}.eyebrow{font-size:12px;letter-spacing:.2em;color:#acd69c}h1{font-size:clamp(40px,7vw,66px);line-height:1.1}section{padding:24px;border:1px solid #42524c;margin:24px 0;border-radius:12px}h2{font-size:23px}.button,button{display:inline-block;background:#c2e2b3;color:#152018;padding:12px 20px;border:0;border-radius:6px;text-decoration:none;font:inherit;cursor:pointer}form{display:inline-block;margin:12px}footer{font-size:13px;color:#aab5ad}code{color:#c2e2b3}*{box-sizing:border-box}:focus-visible{outline:3px solid #e9eee8;outline-offset:4px}@media(max-width:400px){main{padding:16px}section{padding:16px}form{margin:16px 0;display:block}}');}
 if(req.method==='GET'&&url.pathname==='/'){
  if(expired)return expirePage(res,sessions.get(sessionId)?.status);
  if(!session)return await login(req,res,'home');
  if(session.tokenDeadline<=clock())return await login(req,res,'home',true);
  await active(apiConfig,session.token,await verify(session.token));
  if(live(sessionId)!==session)return expirePage(res);
  session.last=clock();return page(res,session);
 }
 if(req.method==='GET'&&url.pathname==='/login')return await login(req,res,'home');
 if(req.method==='GET'&&url.pathname==='/signed-out')return html(res,200,'You’re signed out','<section><p>Sign in when you’re ready to return.</p><a class="button" href="/login">Sign in</a></section>');
 if(req.method==='GET'&&url.pathname==='/callback'){
  const id=cookie(req,'__Host-auth_login'),t=transactions.get(id);
  if(!t||t.consumed||t.cancelled||t.expires<=clock())return loginError(res,400);
  t.consumed=true;
  const tokens=await oidc.authorizationCodeGrant(config,url,{pkceCodeVerifier:t.verifier,expectedState:t.state,expectedNonce:t.nonce,idTokenExpected:true});
  const claims=tokens.claims(),p=await verify(tokens.access_token);
  if(!claims||claims.sub!==p.sub||p.azp!==c.browserClient)throw Error('Identity mismatch');
  await active(apiConfig,tokens.access_token,p);
  checkAuthentication(claims,{issued:t.issued,fresh:!t.renew,wallNow:now()});
  if(t.cancelled||t.expires<=clock()||transactions.get(id)!==t)throw Error('Cancelled transaction');
  if(t.parentId&&(live(t.parentId)!==t.parent||sessionId!==t.parentId))throw Error('Session changed');
  if(t.renew&&(p.sub!==t.parent.sub||claims.sid!==t.parent.issuerSession))throw Error('Renewal identity changed');
  for(const [sid,s] of sessions)if(s.status!=='active')sessions.delete(sid);
  if(sessions.size>=256&&!t.parentId)throw Error('Session capacity');
  const stamp=clock(),sid=random();
  const next={token:tokens.access_token,idToken:tokens.id_token,csrf:random(),sub:p.sub,issuerSession:claims.sid,
   status:'active',created:t.renew?t.parent.created:stamp,absolute:t.renew?t.parent.absolute:stamp+POLICY.absolute,
   last:t.renew?t.parent.last:stamp,authTime:claims.auth_time,tokenDeadline:stamp+Math.max(0,p.exp-now())};
  // Commit has no awaits: a logout, timeout or competing callback cannot revive the parent.
  cancelTransaction(id);if(t.parentId){invalidate(t.parentId,'replaced');sessions.delete(t.parentId);}
  sessions.set(sid,next);
  return redirect(res,destinations[t.destination],[setCookie('__Host-auth_session',sid,Math.max(0,next.absolute-stamp)),setCookie('__Host-auth_login','',0)]);
 }
 if(req.method==='POST'&&url.pathname==='/logout'){
  if(req.headers.origin!==c.origin||!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded')||!session)return json(res,403,{error:'Invalid logout'});
  const form=await body(req);if(form.get('csrf')!==session.csrf||[...form.keys()].some(k=>k!=='csrf'))return json(res,403,{error:'Invalid logout'});
  if(live(sessionId)!==session)return expirePage(res);
  const logoutHint=session.idToken;
  cancelTransaction(cookie(req,'__Host-auth_login'));invalidate(sessionId,'signed-out');
  res.setHeader('Set-Cookie',setCookie('__Host-auth_session','',0));
  try{await issuerReady();}catch{return html(res,503,'Signed out of this app','<section><p>Your application session has ended. The identity service is unavailable, so we could not confirm sign-out there.</p><a class="button" href="/signed-out">Continue</a></section>');}
  const target=oidc.buildEndSessionUrl(config,{id_token_hint:logoutHint,post_logout_redirect_uri:c.origin+'/signed-out'});
  return redirect(res,target.href,setCookie('__Host-auth_session','',0));
 }
 if(req.method==='GET'&&['/document','/api/document'].includes(url.pathname)){
  if(['x-authentication-evidence-ref','x-user-id','x-principal','x-roles','x-tenant'].some(h=>h in req.headers))return json(res,400,{error:'Caller authority fields rejected'});
  const api=url.pathname==='/api/document';let token,kind;
  if(api){if(sessionId||!/^Bearer [A-Za-z0-9_.-]+$/.test(req.headers.authorization||''))return json(res,401,{error:'Authentication required'});token=req.headers.authorization.slice(7);kind='service';}
  else{if(req.headers.authorization)return json(res,401,{error:'Authentication required'});if(expired)return expirePage(res,sessions.get(sessionId)?.status);if(!session)return await login(req,res,'document');if(session.tokenDeadline<=clock())return await login(req,res,'document',true);token=session.token;kind='human';}
  const p=await verify(token);
  if(p.azp!==(api?c.serviceClient:c.browserClient))throw Error('Client/profile mismatch');
  await active(apiConfig,token,p);
  if(!await authorize(p,kind)){counters.denied++;return json(res,403,{decision:'DENY'});}
  if(session){if(live(sessionId)!==session)return expirePage(res);session.last=clock();}counters.allowed++;
  return json(res,200,{decision:'ALLOW',principal_kind:kind,document:{id:'prototype-welcome',text:'Your authenticated identity has permission to read this document.'}});
 }
 return json(res,404,{error:'Not found'});
 }catch{counters.denied++;if(browserRequest)return loginError(res);return json(res,401,{error:'Authentication could not be verified'});}finally{completeEvidence('exported');inFlight--;}
}

return handler;
}
