import {createStore,createOidc,createSecurityHandler,SessionError,policy} from '@auth-foundation/session-core';
import {authorize} from '../../authentication-https/src/bridge.mjs';
export const cookie=(name,value,age)=>`${name}=${value}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.max(0,Math.floor(age))}`;
export function cookies(req){const result={};for(const part of (req.headers.cookie??'').split(';')){const i=part.indexOf('=');if(i<0)continue;const key=part.slice(0,i).trim();if(Object.hasOwn(result,key))throw new SessionError('duplicate_cookie',400);result[key]=part.slice(i+1);}return result;}
export function createFoundation(c,a,root){
 const store=createStore({databaseUrl:databaseUrl(a),namespace:a.namespace,key:a.key}),core=createOidc({profile:{issuer:c.issuer,origin:a.origin,client:a.client,audience:a.audience,callback:a.callback,securityPath:'/security',secret:a.clientSecret},store});
 const security=createSecurityHandler({core,path:'/security',sessionCookie:'__Host-auth_session',loginCookie:'__Host-auth_login',cookies});
 const json=(res,status,value)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(value));};
 const redirect=(res,url,set=[])=>{res.writeHead(303,{location:url,'set-cookie':set});res.end();};
 const html=(res,status,title,body)=>{res.writeHead(status,{'content-type':'text/html; charset=utf-8'});res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Auth Foundation · durable sessions</title><link rel="stylesheet" href="/style.css"><main><p>AUTH FOUNDATION · DURABLE SESSION PROTOTYPE</p><h1>${title}</h1>${body}</main></html>`)};
 const start=async(req,res,fresh=false)=>{const cs=cookies(req),t=await core.start(cs['__Host-auth_session'],cs['__Host-auth_login'],{fresh});redirect(res,t.url,[cookie('__Host-auth_login',t.login,policy.transaction)]);};
 return {store,async handler(req,res){try{
  const url=new URL(req.url,a.origin),cs=cookies(req),handle=cs['__Host-auth_session'];
  if(url.pathname==='/security')return security(req,res);
  if(req.method==='GET'&&url.pathname==='/health')return json(res,200,{status:'durable-prototype'});
  if(req.method==='GET'&&url.pathname==='/style.css'){res.writeHead(200,{'content-type':'text/css'});return res.end('body{background:#111b22;color:#e9eee8;font:18px/1.6 system-ui}main{max-width:760px;margin:8vh auto;padding:24px}a,button{display:inline-block;background:#c2e2b3;color:#152018;padding:12px 20px;border:0;border-radius:6px;text-decoration:none;font:inherit}section{padding:24px;border:1px solid #42524c;border-radius:12px}form{margin-top:20px}');}
  if(url.pathname!=='/callback'&&url.search)return json(res,400,{error:'unexpected_parameters'});
  if(req.method==='GET'&&url.pathname==='/login')return start(req,res,true);
  if(req.method==='GET'&&url.pathname==='/signed-out')return html(res,200,'Signed out','<a href="/login">Sign in</a>');
  if(req.method==='GET'&&url.pathname==='/callback'){const s=await core.complete(url,handle,cs['__Host-auth_login']);return redirect(res,s.returnTo??'/',[cookie('__Host-auth_session',s.id,s.absolute-s.now),cookie('__Host-auth_login','',0)]);}
  if(req.method==='POST'&&url.pathname==='/logout'){
   if(req.headers.origin!==a.origin||!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded'))throw new SessionError('origin_not_allowed',403);
   let body='';for await(const chunk of req){body+=chunk;if(body.length>1024)throw new SessionError('body_limit',413);}const form=new URLSearchParams(body);if([...form.keys()].some(k=>k!=='csrf')||form.getAll('csrf').length!==1)throw new SessionError('csrf_required',403);
   await core.checkLogout(handle,form.get('csrf'));await core.logout(handle,cs['__Host-auth_login']);return redirect(res,'/signed-out',[cookie('__Host-auth_session','',0),cookie('__Host-auth_login','',0)]);
  }
  if(req.method==='GET'&&['/','/document','/status'].includes(url.pathname)){
   if(!handle&&url.pathname==='/')return start(req,res);
   let s;try{s=await core.authenticate(handle);}catch(error){if(error.code==='session_renewal_required'&&url.pathname!=='/status')return start(req,res);throw error;}
   if(url.pathname==='/status')return json(res,200,{authenticated:true,session_generation:s.generation});
   if(url.pathname==='/document'){if(req.headers.authorization||['x-user-id','x-principal','x-roles','x-tenant','x-authentication-evidence-ref'].some(h=>h in req.headers))throw new SessionError('caller_authority_rejected',400);if(!await authorize({iss:c.issuer,sub:s.subject,azp:a.client,exp:s.tokenDeadline},'human',root+'/.runtime/foundation/policy.json'))return json(res,403,{decision:'DENY'});await core.store.current(handle);await core.touch(handle);return json(res,200,{decision:'ALLOW',principal_kind:'human',document:{id:'prototype-welcome',text:'This session is shared safely between two instances.'}});}
   await core.touch(handle);return html(res,200,'You’re signed in','<section><p>Your session survives restarts and is checked against shared PostgreSQL state.</p><a href="/document">Open protected document</a> <a href="/security">Account security</a><form method="post" action="/logout"><input type="hidden" name="csrf" value="'+s.csrf+'"><button>Sign out</button></form></section>');
  }
  return json(res,404,{error:'not_found'});
 }catch(error){if(req.url.startsWith('/callback')){console.warn('Auth callback rejected:',error instanceof SessionError?error.code:'identity_unavailable');const cs=cookies(req);if(error.code==='renewal_login_required'){const t=await core.start(undefined,cs['__Host-auth_login'],{fresh:true});return redirect(res,t.url,[cookie('__Host-auth_session','',0),cookie('__Host-auth_login',t.login,policy.transaction)]);}if(error.code==='invalid_login'){try{await core.authenticate(cs['__Host-auth_session']);return redirect(res,'/');}catch{}}res.setHeader('set-cookie',[cookie('__Host-auth_session','',0),cookie('__Host-auth_login','',0)]);}if(error.code==='security_action_finished')return html(res,200,'Sign in to continue','<p>The security action has finished. Sign in again to continue.</p><a href="/login">Sign in</a>');const status=error instanceof SessionError?error.status:503;const code=error instanceof SessionError?error.code:'identity_unavailable';if(req.url.startsWith('/status')||req.url.startsWith('/api/'))return json(res,status,{authenticated:false,error:code});return html(res,status,'Sign in required','<p>Your session expired or could not be verified.</p><a href="/login">Sign in again</a>');}}
 };
}
export const databaseUrl=a=>'postgres://'+a.db+':'+a.password+'@127.0.0.1:55493/'+a.db;
