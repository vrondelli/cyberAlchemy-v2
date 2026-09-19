import {authenticationBinding,assertRenewal,authorizationParameters} from './renewal.mjs';
import * as oidc from '../authentication-https/node_modules/openid-client/build/index.js';
import {configuration,verifier,active,now} from '../authentication-https/src/identity.mjs';
import {checkAuthentication} from '../authentication-https/src/session-state.mjs';
// OIDC is owned by Auth Foundation. Open Questions: README.md.
export async function createBrowserOAuth(profile,{origin=profile.origin}={}){
 if(new URL(origin).origin!==origin||new URL(origin).protocol!=='https:')throw Error('BROWSER_ORIGIN');
 profile=structuredClone(profile);const config=await configuration(profile),api=await configuration(profile,true),verify=verifier(profile);
 return {
  async validate(token){const p=await verify(token);await active(api,token,p);return p;},
  async begin(previous){const state=oidc.randomState(),nonce=oidc.randomNonce(),pkce=oidc.randomPKCECodeVerifier(),issued=now();
   const url=oidc.buildAuthorizationUrl(config,authorizationParameters({origin,state,nonce,challenge:await oidc.calculatePKCECodeChallenge(pkce),previous}));
   return {url:url.href,transaction:{state,nonce,pkce,issued,previous:previous?{identity:structuredClone(previous.identity),authentication:structuredClone(previous.authentication)}:undefined}};
  },
  async finish(url,t){
   const tokens=await oidc.authorizationCodeGrant(config,new URL(url),{pkceCodeVerifier:t.pkce,expectedState:t.state,expectedNonce:t.nonce,idTokenExpected:true});
   const claims=tokens.claims(),p=await verify(tokens.access_token);
   if(!claims||claims.sub!==p.sub||p.azp!==profile.browserClient)throw Error('AUTHENTICATION_FAILED');
   await active(api,tokens.access_token,p);checkAuthentication(claims,{issued:t.issued,fresh:!t.previous,wallNow:now()});
   const authenticated={authentication:authenticationBinding(claims),token:tokens.access_token,identity:{issuer:p.iss,subject:p.sub,kind:'human',client:p.azp,jti:p.jti,expires_at:p.exp}};
   if(t.previous)assertRenewal(t.previous,authenticated);return authenticated;
  }
 };
}
