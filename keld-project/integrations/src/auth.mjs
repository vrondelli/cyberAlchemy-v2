import {createHash, timingSafeEqual} from 'node:crypto';
import {createStore, createOidc, SessionError, policy} from '@auth-foundation/session-core';

import {Rejected} from './errors.mjs';
export {Rejected} from './errors.mjs';
const sessionCookie='__Host-keld_session', loginCookie='__Host-keld_login';
export function cookies(req) {
  const result=Object.create(null);
  for(const part of (req.headers.cookie??'').split(';')) {
    if(!part.trim()) continue;
    const i=part.indexOf('='); if(i<1) throw new Rejected('invalid-cookie');
    const key=part.slice(0,i).trim(); if(Object.hasOwn(result,key)) throw new Rejected('duplicate-cookie');
    result[key]=part.slice(i+1);
  }
  return result;
}
const cookie=(name,value,age)=>`${name}=${value}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.max(0,Math.floor(age))}`;
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length>0&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));

/** Uses the real shared session package; creates no second identity/session store. */
export async function createKeldAuth({profile,databaseUrl,key,namespace='keld',store: suppliedStore}) {
  if(namespace!=='keld') throw new Rejected('keld-namespace-required');
  const store=suppliedStore??createStore({databaseUrl,key,namespace});
  const core=createOidc({profile,store});
  // Migrations are explicit at controlled startup; construction does not change DBs.
  return {store,core,...bindKeldAuth(core,profile)};
}

export function bindKeldAuth(core,profile) {
  const origin=new URL(profile.origin).origin;
  if(!origin.startsWith('https://')||profile.origin!==origin) throw new Rejected('https-origin-required');
  return {
    async identity(req,{mutation=false}={}) {
      if(req.headers.authorization||['x-user-id','x-customer','x-principal','x-roles','x-tenant'].some(h=>h in req.headers)) throw new Rejected('caller-identity-rejected');
      const handle=cookies(req)[sessionCookie];
      if(!handle) throw new Rejected('authentication-required',401);
      const session=await core.authenticate(handle);
      if(mutation&&(req.headers.origin!==origin||!equal(req.headers['x-csrf-token'],session.csrf))) throw new Rejected('csrf-rejected',403);
      if(typeof session.subject!=='string'||!session.subject) throw new Rejected('identity-invalid');
      // Issuer+subject is durable and independent of email changes or session rotation.
      const customer='oidc:'+createHash('sha256').update(JSON.stringify([profile.issuer,session.subject])).digest('hex');
      await core.touch(handle);
      return {customer,csrf:session.csrf,handle};
    },
    async handle(req,res) {
      const url=new URL(req.url,origin);
      const cs=cookies(req),handle=cs[sessionCookie],login=cs[loginCookie];
      const redirect=(location,values)=>{res.writeHead(303,{'location':location,'set-cookie':values,'cache-control':'no-store'});res.end();};
      if(req.method==='GET'&&['/auth/login','/auth/register'].includes(url.pathname)) {
        const t=await core.start(handle,login);
        const target=new URL(t.url);
        if(url.pathname==='/auth/register')target.searchParams.set('prompt','create');
        redirect(target.href,[cookie(loginCookie,t.login,policy.transaction)]);return true;
      }
      if(req.method==='GET'&&url.pathname===profile.callback) {
        try {const s=await core.complete(url,handle,login);redirect('/',[cookie(sessionCookie,s.id,s.absolute-s.now),cookie(loginCookie,'',0)]);}
        catch(error) {res.setHeader('set-cookie',[cookie(sessionCookie,'',0),cookie(loginCookie,'',0)]);throw error;}
        return true;
      }
      if(req.method==='POST'&&url.pathname==='/auth/logout') {
        if(req.headers.origin!==origin) throw new Rejected('csrf-rejected',403);
        // Shared core handles logout racing a cookie renewal.
        await core.checkLogout(handle,req.headers['x-csrf-token']);
        await core.logout(handle,login);
        redirect('/signed-out',[cookie(sessionCookie,'',0),cookie(loginCookie,'',0)]);return true;
      }
      return false;
    }
  };
}
export {SessionError};
