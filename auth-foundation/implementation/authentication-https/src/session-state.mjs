// Versioned prototype policy. Token lifetimes remain independently issuer-enforced.
export const POLICY=Object.freeze({version:1,idle:900,absolute:28800,ssoIdle:1800,ssoMax:28800});
export function sessionState(session,time){
 if(!session)return 'unknown';
 if(session.status!=='active')return session.status;
 if(time>=session.absolute)return 'absolute-expired';
 if(time>=session.last+POLICY.idle)return 'idle-expired';
 return 'active';
}
export function checkAuthentication(claims,{issued,fresh,wallNow}){
 if(!Number.isSafeInteger(claims.auth_time)||claims.auth_time>wallNow||claims.auth_time<0)throw Error('Invalid authentication time');
 if(fresh&&claims.auth_time<issued)throw Error('Fresh authentication required');
 if(!fresh&&wallNow-claims.auth_time>POLICY.absolute)throw Error('Authentication too old');
}
