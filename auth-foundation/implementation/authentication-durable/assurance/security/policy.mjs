export const securityActions=Object.freeze({CONFIGURE_TOTP:'Set up an authenticator',CONFIGURE_RECOVERY_AUTHN_CODES:'Create new recovery codes',UPDATE_PASSWORD:'Change password'});
export function securityAction(action){if(typeof action!=='string'||!Object.hasOwn(securityActions,action))throw Error('Unsupported security action');return action;}
export function securityRequestAllowed({origin,expectedOrigin,csrf,expectedCsrf,action}){return origin===expectedOrigin&&typeof csrf==='string'&&csrf.length>=32&&csrf===expectedCsrf&&typeof action==='string'&&Object.hasOwn(securityActions,action);}

export function authenticationAfterRevocation(authTime,notBefore){return Number.isSafeInteger(authTime)&&Number.isSafeInteger(notBefore)&&notBefore>=0&&authTime>=notBefore;}
