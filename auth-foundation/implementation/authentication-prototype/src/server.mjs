import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import * as oidc from 'openid-client';
import {configuration,verifier,active,now} from './identity.mjs';
import {authorize} from './bridge.mjs';
process.chdir(new URL('..',import.meta.url).pathname);
const c=JSON.parse(await readFile('.runtime/config.json'));
const config=await configuration(c),apiConfig=await configuration(c,true),verify=verifier(c);
const sessions=new Map(),transactions=new Map();
const random=()=>randomBytes(32).toString('base64url');
let inFlight=0;
const counters={requests:0,allowed:0,denied:0};
function cookie(req,name){const values=(req.headers.cookie||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(name+'='));return values.length===1?values[0].slice(name.length+1):undefined;}
function setCookie(name,value,age){return `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}`;}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));}
function redirect(res,url,cookies){res.writeHead(303,{Location:url,...(cookies?{'Set-Cookie':cookies}:{})});res.end();}
function html(res,status,title,content){res.writeHead(status,{'Content-Type':'text/html; charset=utf-8'});res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Auth Foundation</title><link rel="stylesheet" href="/style.css"><main><p class="eyebrow">AUTH FOUNDATION / LOCAL PROTOTYPE</p><h1>${title}</h1>${content}<footer>Local test environment · test accounts only</footer></main></html>`);}
function page(res,session){return html(res,200,'One identity.<br>Explicit access.',`<section><h2>You’re signed in</h2><p>Your session is ready.</p><a class="button" href="/document">Open protected document</a><form method="post" action="/logout"><input type="hidden" name="csrf" value="${session.csrf}"><button>Sign out</button></form></section>`);}
function loginError(res,status=401){res.setHeader('Set-Cookie',setCookie('auth_login','',0));return html(res,status,'Sign-in could not be completed','<section><p>The sign-in attempt expired, was cancelled, or could not be verified. Please start a new attempt.</p><a class="button" href="/login">Try signing in again</a></section>');}
const destinations=Object.freeze({home:'/',document:'/document'});
async function issuerReady(){const response=await fetch(c.issuer+'/.well-known/openid-configuration',{signal:AbortSignal.timeout(3000),redirect:'error'});if(!response.ok)throw Error('Issuer unavailable');await response.body?.cancel();}
async function login(req,res,destination){
 if(!Object.hasOwn(destinations,destination))throw Error('Invalid destination');
 if(transactions.size>=256)return loginError(res,429);
 await issuerReady();
 if(transactions.size>=256)return loginError(res,429);
 // One outstanding transaction per browser; never accept a caller-supplied return URL.
 transactions.delete(cookie(req,'auth_login'));
 const id=random(),state=oidc.randomState(),nonce=oidc.randomNonce(),verifier=oidc.randomPKCECodeVerifier();
 transactions.set(id,{state,nonce,verifier,destination,expires:now()+180});
 const location=oidc.buildAuthorizationUrl(config,{redirect_uri:c.origin+'/callback',scope:'openid',state,nonce,code_challenge:await oidc.calculatePKCECodeChallenge(verifier),code_challenge_method:'S256',max_age:'900'});
 return redirect(res,location.href,setCookie('auth_login',id,180));
}
async function body(req){let value='';for await(const chunk of req){value+=chunk;if(value.length>1024)throw Error('Body limit');}return new URLSearchParams(value);}
async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin');res.setHeader('Content-Security-Policy',`default-src 'none'; style-src 'self'; form-action 'self' ${c.issuer}/protocol/openid-connect/logout; frame-ancestors 'none'; base-uri 'none'`);
 if(req.headers.host!=='localhost:13000')return json(res,400,{error:'Invalid host'});
 counters.requests++;
 if(inFlight>=32)return json(res,503,{error:'Busy'});
 inFlight++;
 let browserRequest=false;
 try {
 const url=new URL(req.url,c.origin);
 browserRequest=req.method==='GET'&&['/','/login','/callback','/document'].includes(url.pathname);
 if(url.pathname!=='/callback'&&url.search)return json(res,400,{error:'Unexpected parameters'});
 for(const [id,t] of transactions)if(t.expires<=now())transactions.delete(id);
 for(const [id,s] of sessions)if(s.expires<=now()||s.last+900<=now())sessions.delete(id);
 const sessionId=cookie(req,'auth_session'),session=sessions.get(sessionId);
 if(req.method==='GET'&&url.pathname==='/health')return json(res,200,{status:'local-prototype',...counters});
 if(req.method==='GET'&&url.pathname==='/style.css'){res.writeHead(200,{'Content-Type':'text/css'});return res.end('body{margin:0;background:#111b22;color:#e9eee8;font:18px/1.6 system-ui}main{max-width:760px;margin:8vh auto;padding:24px}.eyebrow{font-size:12px;letter-spacing:.2em;color:#acd69c}h1{font-size:clamp(40px,7vw,66px);line-height:1.1}section{padding:24px;border:1px solid #42524c;margin:24px 0;border-radius:12px}h2{font-size:23px}.button,button{display:inline-block;background:#c2e2b3;color:#152018;padding:12px 20px;border:0;border-radius:6px;text-decoration:none;font:inherit;cursor:pointer}form{display:inline-block;margin:12px}footer{font-size:13px;color:#aab5ad}code{color:#c2e2b3}*{box-sizing:border-box}:focus-visible{outline:3px solid #e9eee8;outline-offset:4px}@media(max-width:400px){main{padding:16px}section{padding:16px}form{margin:16px 0;display:block}}');}
 if(req.method==='GET'&&url.pathname==='/')return session?page(res,session):await login(req,res,'home');
 if(req.method==='GET'&&url.pathname==='/login')return await login(req,res,'home');
 if(req.method==='GET'&&url.pathname==='/signed-out')return html(res,200,'You’re signed out','<section><p>Sign in when you’re ready to return.</p><a class="button" href="/login">Sign in</a></section>');
 if(req.method==='GET'&&url.pathname==='/callback'){
  const id=cookie(req,'auth_login'),t=transactions.get(id);transactions.delete(id);
  if(!t||t.expires<=now())return loginError(res,400);
  const tokens=await oidc.authorizationCodeGrant(config,url,{pkceCodeVerifier:t.verifier,expectedState:t.state,expectedNonce:t.nonce,idTokenExpected:true});
  const claims=tokens.claims(),p=await verify(tokens.access_token);
  if(!claims||claims.sub!==p.sub||p.azp!==c.browserClient)throw Error('Identity mismatch');
  await active(apiConfig,tokens.access_token,p);
  // Never store refresh tokens in this slice: reauthenticate after access expiry.
  if(sessions.size>=256)throw Error('Session capacity');
  if(sessionId)sessions.delete(sessionId);
  const sid=random();sessions.set(sid,{token:tokens.access_token,idToken:tokens.id_token,csrf:random(),expires:Math.min(p.exp,now()+28800),last:now()});
  return redirect(res,destinations[t.destination],[setCookie('auth_session',sid,Math.max(0,p.exp-now())),setCookie('auth_login','',0)]);
 }
 if(req.method==='POST'&&url.pathname==='/logout'){
  if(req.headers.origin!==c.origin||!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded')||!session)return json(res,403,{error:'Invalid logout'});
  const form=await body(req);if(form.get('csrf')!==session.csrf||[...form.keys()].some(k=>k!=='csrf'))return json(res,403,{error:'Invalid logout'});
  sessions.delete(sessionId);
  res.setHeader('Set-Cookie',setCookie('auth_session','',0));
  try{await issuerReady();}catch{return html(res,503,'Signed out of this app','<section><p>Your application session has ended. The identity service is unavailable, so we could not confirm sign-out there.</p><a class="button" href="/signed-out">Continue</a></section>');}
  const target=oidc.buildEndSessionUrl(config,{id_token_hint:session.idToken,post_logout_redirect_uri:c.origin+'/signed-out'});
  return redirect(res,target.href,setCookie('auth_session','',0));
 }
 if(req.method==='GET'&&['/document','/api/document'].includes(url.pathname)){
  if(['x-authentication-evidence-ref','x-user-id','x-principal','x-roles','x-tenant'].some(h=>h in req.headers))return json(res,400,{error:'Caller authority fields rejected'});
  const api=url.pathname==='/api/document';let token,kind;
  if(api){if(sessionId||!/^Bearer [A-Za-z0-9_.-]+$/.test(req.headers.authorization||''))return json(res,401,{error:'Authentication required'});token=req.headers.authorization.slice(7);kind='service';}
  else{if(req.headers.authorization)return json(res,401,{error:'Authentication required'});if(!session)return await login(req,res,'document');token=session.token;kind='human';}
  const p=await verify(token);
  if(p.azp!==(api?c.serviceClient:c.browserClient))throw Error('Client/profile mismatch');
  await active(apiConfig,token,p);
  if(!await authorize(p,kind)){counters.denied++;return json(res,403,{decision:'DENY'});}
  if(session)session.last=now();counters.allowed++;
  return json(res,200,{decision:'ALLOW',principal_kind:kind,document:{id:'prototype-welcome',text:'Your authenticated identity has permission to read this document.'}});
 }
 return json(res,404,{error:'Not found'});
 }catch{counters.denied++;if(browserRequest)return loginError(res);return json(res,401,{error:'Authentication could not be verified'});}finally{inFlight--;}
}
const server=http.createServer((req,res)=>void handler(req,res));server.requestTimeout=5000;server.headersTimeout=5000;server.maxHeadersCount=40;
server.listen(13000,'127.0.0.1',()=>console.log('Auth Foundation prototype: http://localhost:13000'));
