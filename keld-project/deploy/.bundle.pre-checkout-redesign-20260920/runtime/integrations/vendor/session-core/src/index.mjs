export {createSecurityHandler} from './security.mjs';
import {securityAction,authenticationAfterRevocation} from './security-policy.mjs';
import {authenticationIsCurrent} from './policy.mjs';
import * as oidc from 'openid-client';
import {createRemoteJWKSet,jwtVerify} from 'jose';
import {SessionError,random,policy} from './store.mjs';
export {createStore,SessionError,policy} from './store.mjs';
export const wall=()=>Math.floor(Date.now()/1000);
export function checkAuthentication(authTime,{issued,fresh,now=wall()}){if(!authenticationIsCurrent(authTime,{issued,fresh,now}))throw new SessionError('authentication_freshness');}
export function createOidc({profile,store,provision=async()=>({csrf:random()})}){
 for(const name of ['issuer','origin']){const url=new URL(profile[name]);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('HTTPS profile required');}
 if(!profile.callback.startsWith('/')||profile.callback.startsWith('//')||!profile.client||!profile.audience||profile.secret.length<32)throw Error('Invalid client profile');
 let configuration;
 const config=()=>configuration??=oidc.discovery(new URL(profile.issuer),profile.client,profile.secret,undefined,{timeout:3}).catch(e=>{configuration=undefined;throw e});
 const jwks=createRemoteJWKSet(new URL(profile.issuer+'/protocol/openid-connect/certs'),{timeoutDuration:3000});
 async function verify(token){const {payload:p}=await jwtVerify(token,jwks,{issuer:profile.issuer,audience:profile.audience,algorithms:['RS256'],requiredClaims:['iss','sub','aud','iat','exp','jti']});if(p.typ!=='Bearer'||p.azp!==profile.client||!Number.isInteger(p.iat)||!Number.isInteger(p.exp)||p.iat>wall()||p.exp-p.iat>300)throw new SessionError('token_profile');const r=await oidc.tokenIntrospection(await config(),token);if(r.active!==true||r.sub!==p.sub||r.client_id!==p.azp||r.exp!==p.exp)throw new SessionError('inactive_identity');return p;}
 return {
  store,profile,
  async start(handle,previousLogin,{action,fresh=false,returnTo}={}){if(action){securityAction(action);await this.authenticate(handle);}const conf=await config(),t=await store.begin({handle,previousLogin,data:{state:oidc.randomState(),nonce:oidc.randomNonce(),verifier:oidc.randomPKCECodeVerifier(),issued:wall(),fresh,...(returnTo===profile.securityPath?{returnTo}:{}),...(action?{action}:{})}});const url=oidc.buildAuthorizationUrl(conf,{redirect_uri:profile.origin+profile.callback,scope:'openid',state:t.state,nonce:t.nonce,code_challenge:await oidc.calculatePKCECodeChallenge(t.verifier),code_challenge_method:'S256',prompt:t.renew?'none':'login',max_age:t.renew?String(policy.absolute):'0',...(t.renew?{id_token_hint:t.parent.idToken}:{}),...(action?{kc_action:action}:{})});return {url:url.href,login:t.id,renew:t.renew};},
  async complete(url,handle,login){const t=await store.claim(login);try{const tokens=await oidc.authorizationCodeGrant(await config(),url,{expectedState:t.state,expectedNonce:t.nonce,pkceCodeVerifier:t.verifier,idTokenExpected:true}),claims=tokens.claims(),p=await verify(tokens.access_token);if(!claims||p.sub!==claims.sub||typeof claims.sid!=='string')throw new SessionError('identity_mismatch');checkAuthentication(claims.auth_time,{issued:t.issued,fresh:!t.renew});if(!authenticationAfterRevocation(claims.auth_time,tokens['not-before-policy']))throw new SessionError('authentication_revoked');
   if(t.action)throw new SessionError('security_action_finished');
   // Token deadline uses issuer wall time, while idle/absolute use the database clock.
   const result=await store.complete({transaction:t,handle,identity:{subject:p.sub,issuerSession:claims.sid,accessToken:tokens.access_token,idToken:tokens.id_token,tokenDeadline:p.exp,issuer:profile.issuer},provision:ttl=>provision({issuer:profile.issuer,subject:p.sub,payload:p},ttl)});return {...result,returnTo:t.returnTo};
   }catch(error){if(t.action){await store.revoke(handle,login);throw new SessionError('security_action_finished');}if(t.renew){await store.revoke(handle,login);if(error instanceof SessionError||['login_required','interaction_required','consent_required','account_selection_required'].includes(error.error))throw new SessionError('renewal_login_required');}throw error;}
  },
  async authenticate(handle,{allowExpiredToken=false}={}){const s=await store.current(handle);if(!allowExpiredToken){if(s.tokenDeadline<=wall())throw new SessionError('session_renewal_required');await verify(s.accessToken);}const current=await store.current(handle);if(current.generation!==s.generation||current.family!==s.family)throw new SessionError('session_expired');return current;},
  checkLogout:(handle,csrf)=>store.checkLogout(handle,csrf),
  logout:(handle,login)=>store.revoke(handle,login),
  touch:handle=>store.touch(handle),
  withSession:(handle,work)=>store.withSession(handle,work),
 };
}
