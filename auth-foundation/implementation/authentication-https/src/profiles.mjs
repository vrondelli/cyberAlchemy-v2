const COMMON=Object.freeze({browserClient:'prototype-browser',serviceClient:'prototype-service'});

export const PROFILES=Object.freeze({
 stable:Object.freeze({
  profile:'stable',
  issuer:'https://localhost:18443/realms/auth-https',
  origin:'https://localhost:13443',
  operatorOrigin:'https://localhost:19443',
  composeProject:'auth-foundation-https',
  appPort:13443,issuerPort:18443,operatorPort:19443,
  ...COMMON,
 }),
 candidate:Object.freeze({
  profile:'candidate',
  issuer:'https://localhost:28443/realms/auth-https',
  origin:'https://localhost:23443',
  operatorOrigin:'https://localhost:29443',
  composeProject:'auth-foundation-candidate',
  appPort:23443,issuerPort:28443,operatorPort:29443,
  ...COMMON,
 }),
});

export function selectedProfile(name=process.env.AUTH_PROFILE||'stable'){
 const profile=PROFILES[name];
 if(!profile)throw Error('Unapproved AUTH_PROFILE');
 return profile;
}

export function validateApprovedProfile(c){
 const profile=PROFILES[c.profile||'stable'];
 if(!profile)throw Error('Unapproved HTTPS profile');
 for(const field of ['issuer','origin','operatorOrigin','composeProject','appPort','issuerPort','operatorPort','browserClient','serviceClient']){
  if(c[field]!==profile[field])throw Error('Unapproved HTTPS profile');
 }
 return profile;
}

export function applyProfile(c,profile){
 const legacyStable=c.profile===undefined&&c.issuer===PROFILES.stable.issuer&&c.origin===PROFILES.stable.origin&&c.browserClient===COMMON.browserClient&&c.serviceClient===COMMON.serviceClient;
 if(legacyStable&&profile.profile==='stable')return {...c,...profile};
 const merged={...c,...Object.fromEntries(Object.keys(profile).map(key=>[key,c[key]??profile[key]]))};
 validateApprovedProfile(merged);
 if(merged.profile!==profile.profile)throw Error('Runtime profile does not match AUTH_PROFILE');
 return merged;
}
