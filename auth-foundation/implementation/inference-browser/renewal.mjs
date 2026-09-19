import {POLICY} from '../authentication-https/src/session-state.mjs';
// Trusted OIDC renewal binding. Open Questions: README.md.
export function authenticationBinding(claims){
 if(!Number.isSafeInteger(claims?.auth_time)||claims.auth_time<0||typeof claims.sid!=='string'||!claims.sid||claims.sid.length>256)throw Error('AUTHENTICATION_BINDING');
 return {authTime:claims.auth_time,issuerSession:claims.sid};
}
export function assertRenewal(previous,next){
 const a=previous.authentication,b=next.authentication;
 if(!a||!b||a.authTime!==b.authTime||a.issuerSession!==b.issuerSession||!['issuer','subject','kind','client'].every(k=>previous.identity[k]===next.identity[k])||previous.identity.jti===next.identity.jti)throw Error('RENEWAL_BINDING');
}
export function authorizationParameters({origin,state,nonce,challenge,previous}){
 return {redirect_uri:origin+'/callback',scope:'openid',state,nonce,code_challenge:challenge,code_challenge_method:'S256',max_age:previous?String(POLICY.absolute):'0',prompt:previous?'none':'login',...(previous?{login_hint:previous.identity.subject}:{})};
}
