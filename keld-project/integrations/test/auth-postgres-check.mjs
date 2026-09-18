import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:https';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import postgres from 'postgres';
import {setTimeout as delay} from 'node:timers/promises';
import {createKeldAuth} from '../src/auth.mjs';
const databaseUrl=process.env.KELD_TEST_DATABASE_URL;
if(!databaseUrl||!process.env.KELD_TEST_CERT||!process.env.KELD_TEST_KEY)throw Error('Use the isolated auth test runner');
const {privateKey,publicKey}=await generateKeyPair('RS256'),jwk={...await exportJWK(publicKey),kid:'fixture-key',alg:'RS256',use:'sig'};
const client='keld-test',secret=randomBytes(32).toString('hex'),key=randomBytes(32).toString('base64url'),tokens=new Map(),codes=new Map(),calls={discovery:0,jwks:0,introspection:0,authorize:0,exchange:0};let issuer,tokenLifetime=240;
const server=createServer({cert:await readFile(process.env.KELD_TEST_CERT),key:await readFile(process.env.KELD_TEST_KEY)},async(req,res)=>{
 const json=(body,status=200)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body));};
 try{
  const path=new URL(req.url,issuer).pathname;
  if(path.endsWith('/.well-known/openid-configuration')){calls.discovery++;return json({issuer,authorization_endpoint:issuer+'/authorize',token_endpoint:issuer+'/token',jwks_uri:issuer+'/protocol/openid-connect/certs',introspection_endpoint:issuer+'/introspect',response_types_supported:['code'],subject_types_supported:['public'],id_token_signing_alg_values_supported:['RS256'],token_endpoint_auth_methods_supported:['client_secret_post','client_secret_basic'],introspection_endpoint_auth_methods_supported:['client_secret_post','client_secret_basic']});}
  if(path.endsWith('/authorize')){
   calls.authorize++;const q=new URL(req.url,issuer).searchParams;
   if(q.get('client_id')!==client||q.get('redirect_uri')!==profile.origin+profile.callback||q.get('code_challenge_method')!=='S256'||!q.get('code_challenge')||!q.get('nonce'))return json({},400);
   const code=randomUUID();codes.set(code,{challenge:q.get('code_challenge'),nonce:q.has('fixture_bad_nonce')?'wrong-nonce':q.get('nonce'),redirect:q.get('redirect_uri')});
   const callback=new URL(q.get('redirect_uri'));callback.searchParams.set('code',code);callback.searchParams.set('state',q.get('state'));
   res.writeHead(303,{location:callback.href});return res.end();
  }
  if(path.endsWith('/token')){
   calls.exchange++;let body='';for await(const chunk of req){body+=chunk;if(body.length>16384)return json({},400);}const p=new URLSearchParams(body);
   if(req.headers.authorization!=='Basic '+Buffer.from(client+':'+secret).toString('base64')&&!(p.get('client_id')===client&&p.get('client_secret')===secret))return json({error:'invalid_client'},401);
   const record=codes.get(p.get('code'));codes.delete(p.get('code'));
   if(!record||p.get('grant_type')!=='authorization_code'||p.get('redirect_uri')!==record.redirect||createHash('sha256').update(p.get('code_verifier')??'').digest('base64url')!==record.challenge)return json({error:'invalid_grant'},400);
   const now=Math.floor(Date.now()/1000),exp=now+tokenLifetime;
   const signed=payload=>new SignJWT(payload).setSubject('test-alice').setIssuer(issuer).setAudience(client).setIssuedAt(now).setExpirationTime(exp).setProtectedHeader({alg:'RS256',kid:'fixture-key'}).sign(privateKey);
   const access=await signed({typ:'Bearer',azp:client,jti:randomUUID()});tokens.set(access,{active:true,sub:'test-alice',client_id:client,exp});
   return json({access_token:access,id_token:await signed({nonce:record.nonce,sid:'fixture-grant-session',auth_time:now}),token_type:'Bearer',expires_in:tokenLifetime,'not-before-policy':0});
  }
  if(path.endsWith('/certs')){calls.jwks++;return json({keys:[jwk]});}
  if(path.endsWith('/introspect')){calls.introspection++;let body='';for await(const chunk of req){body+=chunk;if(body.length>16384)return json({},400);}const p=new URLSearchParams(body);
   if(req.headers.authorization!=='Basic '+Buffer.from(client+':'+secret).toString('base64')&&!(p.get('client_id')===client&&p.get('client_secret')===secret))return json({error:'invalid_client'},401);
   const record=tokens.get(p.get('token'));return json(record??{active:false});}
  return json({},404);
 }catch{return json({},500);}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));issuer=`https://127.0.0.1:${server.address().port}/realms/keld-test`;
const profile={issuer,origin:'https://keld.localhost:17443',callback:'/auth/callback',client,audience:'keld-test',secret};
const sql=postgres(databaseUrl,{onnotice:()=>{}}),apps=[];const make=async(extra={})=>{const app=await createKeldAuth({profile,databaseUrl,key,...extra});apps.push(app);return app;};
const passed=[];
try{
 const app=await make();await app.store.migrate();
 const seed=async(overrides={})=>{const now=Math.floor(Date.now()/1000),exp=now+240;const token=await new SignJWT({typ:'Bearer',azp:client,jti:randomUUID(),...overrides}).setSubject('test-alice').setIssuer(issuer).setAudience(overrides.aud??profile.audience).setIssuedAt(now).setExpirationTime(exp).setProtectedHeader({alg:'RS256',kid:'fixture-key'}).sign(privateKey);tokens.set(token,{active:true,sub:'test-alice',client_id:client,exp});
  const transaction=await app.store.begin({data:{state:randomUUID(),nonce:randomUUID(),verifier:randomUUID(),issued:now}});
  const s=await app.store.complete({transaction:await app.store.claim(transaction.id),identity:{subject:'test-alice',issuerSession:'fixture-issuer-session',accessToken:token,idToken:'synthetic-id-token',tokenDeadline:exp,issuer},provision:async()=>({csrf:randomUUID()})});return {...s,token};};
 const session=await seed(),request=(csrf=session.csrf)=>({headers:{cookie:'__Host-keld_session='+session.id,origin:profile.origin,'x-csrf-token':csrf}});
 const identity=await app.identity(request(),{mutation:true});assert.match(identity.customer,/^oidc:[a-f0-9]{64}$/);assert.equal(identity.csrf,session.csrf);assert.ok(calls.jwks&&calls.discovery&&calls.introspection);passed.push('real SQL session + signed RS256 token + authenticated HTTPS introspection');
 const before=(await sql`select last_activity from af_session_families where namespace='keld' and id=${session.family}`)[0].last_activity;
 await assert.rejects(()=>app.identity(request('wrong'),{mutation:true}),{code:'csrf-rejected'});
 assert.equal((await sql`select last_activity from af_session_families where namespace='keld' and id=${session.family}`)[0].last_activity,before);passed.push('CSRF rejection does not refresh real stored activity');
 const rows=JSON.stringify(await sql`select * from af_session_families where namespace='keld'`);for(const value of [session.id,session.token,'synthetic-id-token',session.csrf])assert.equal(rows.includes(value),false);passed.push('session custody encrypted in PostgreSQL');
 const wrongAudience=await seed({aud:'other-consumer'});await assert.rejects(()=>app.identity({headers:{cookie:'__Host-keld_session='+wrongAudience.id}}),{code:'ERR_JWT_CLAIM_VALIDATION_FAILED'});
 const wrongType=await seed({typ:'ID'});await assert.rejects(()=>app.identity({headers:{cookie:'__Host-keld_session='+wrongType.id}}),{code:'token_profile'});passed.push('signed wrong-audience and wrong-token-profile credentials rejected');
 const reopened=await make();await app.store.close();assert.equal((await reopened.identity(request())).customer,identity.customer);passed.push('consumer restart preserves session and customer identity');
 tokens.get(session.token).active=false;await assert.rejects(()=>reopened.identity(request()),{code:'inactive_identity'});tokens.get(session.token).active=true;passed.push('issuer-side revocation rejected by online introspection');
 const wrongKey=await make({key:randomBytes(32).toString('base64url')});await assert.rejects(()=>wrongKey.identity(request()));passed.push('wrong custody key fails closed');
 let status,headers;await reopened.handle({...request(),method:'POST',url:'/auth/logout'},{writeHead(code,h){status=code;headers=h;},end(){}});assert.equal(status,303);assert.ok(headers['set-cookie'].every(c=>c.includes('Max-Age=0')));
 const another=await make();await assert.rejects(()=>another.identity(request()),{code:'session_expired'});passed.push('logout persists revocation across consumer instances');
 // Exercise the real KELD route adapter and shared authorization-code flow.
 const route=async(url,cookie='',extra={})=>{
  const result={headers:{}};const res={writeHead(status,h){result.status=status;Object.assign(result.headers,h);},setHeader(k,v){result.headers[k]=v;},end(){}};
  try{await another.handle({url,method:'GET',headers:{cookie},...extra},res);}catch(error){result.error=error;}
  return result;
 };
 const cookiePart=(result,name)=>result.headers['set-cookie'].find(c=>c.startsWith(name+'=')).split(';')[0];
 const start=async cookie=>{const result=await route('/auth/login',cookie);assert.equal(result.status,303);const url=new URL(result.headers.location);assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.ok(url.searchParams.get('nonce'));return {result,url,login:cookiePart(result,'__Host-keld_login')};};
 const authorize=async url=>{const result=await fetch(url,{redirect:'manual'});assert.equal(result.status,303);return new URL(result.headers.get('location'));};
 tokenLifetime=5;
 const initial=await start('');assert.equal(initial.url.searchParams.get('prompt'),'login');
 const callback=await authorize(initial.url),completed=await route(callback.href,initial.login);assert.ifError(completed.error);assert.equal(completed.status,303);
 const sessionCookie=cookiePart(completed,'__Host-keld_session'),handle=sessionCookie.split('=')[1];
 const loggedIn=await another.identity({headers:{cookie:sessionCookie}}),original=await another.store.current(handle);
 assert.equal(loggedIn.customer,identity.customer);passed.push('login callback exchanges code with PKCE, nonce, signed ID/access tokens and secure cookie');
 const replay=await route(callback.href,initial.login);assert.equal(replay.error?.code,'invalid_login');assert.ok(replay.headers['set-cookie'].every(c=>c.includes('Max-Age=0')));passed.push('callback replay rejected and browser cookies cleared');
 tokenLifetime=240;
 const badState=await start(''),badCallback=await authorize(badState.url);badCallback.searchParams.set('state','wrong-state');const exchanges=calls.exchange;
 const deniedState=await route(badCallback.href,badState.login);assert.ok(deniedState.error);assert.equal(calls.exchange,exchanges);assert.ok(deniedState.headers['set-cookie'].every(c=>c.includes('Max-Age=0')));
 const badNonce=await start('');badNonce.url.searchParams.set('fixture_bad_nonce','1');const deniedNonce=await route((await authorize(badNonce.url)).href,badNonce.login);assert.ok(deniedNonce.error);assert.ok(deniedNonce.headers['set-cookie'].every(c=>c.includes('Max-Age=0')));passed.push('wrong state and signed wrong nonce rejected without issuing a session');
 await delay(Math.max(0,original.tokenDeadline*1000-Date.now()+100));
 await assert.rejects(()=>another.identity({headers:{cookie:sessionCookie}}),{code:'session_renewal_required'});
 const renewal=await start(sessionCookie);assert.equal(renewal.url.searchParams.get('prompt'),'none');assert.ok(renewal.url.searchParams.get('id_token_hint'));
 const renewed=await route((await authorize(renewal.url)).href,sessionCookie+'; '+renewal.login);assert.ifError(renewed.error);
 const renewedCookie=cookiePart(renewed,'__Host-keld_session'),renewedHandle=renewedCookie.split('=')[1],rotated=await another.store.current(renewedHandle);
 assert.notEqual(renewedHandle,handle);assert.equal(rotated.absolute,original.absolute);assert.equal(rotated.generation,original.generation+1);assert.equal((await another.identity({headers:{cookie:renewedCookie}})).customer,loggedIn.customer);
 await assert.rejects(()=>another.identity({headers:{cookie:sessionCookie}}),{code:'session_expired'});passed.push('expired-token renewal rotates handle and preserves customer and absolute deadline');
 const racedLogout=await route('/auth/logout','',{method:'POST',headers:{cookie:sessionCookie,origin:profile.origin,'x-csrf-token':loggedIn.csrf}});assert.ifError(racedLogout.error);assert.equal(racedLogout.status,303);
 await assert.rejects(()=>another.identity({headers:{cookie:renewedCookie}}),{code:'session_expired'});passed.push('logout using old handle and its CSRF revokes the renewed session');
 console.log(JSON.stringify({ok:true,database:(await sql`select version()`)[0].version,issuer:'local protocol fixture; real shared authorization-code flow, not real Keycloak',passed,calls}));
}finally{for(const app of apps)await app.store.close();await sql.end();await new Promise(resolve=>server.close(resolve));}
