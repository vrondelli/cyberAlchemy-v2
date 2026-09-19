import {createMemoryState} from './state.mjs';
// Trusted verified-identity port. Open Questions: README.md.
const fail=()=>{throw Object.assign(Error('FORBIDDEN'),{code:'FORBIDDEN'});};
const key=i=>JSON.stringify([i.issuer,i.subject,i.kind,i.client,i.jti]);
export function createEnrollment({readPolicy,decide,clock=()=>Math.floor(Date.now()/1000),capacity=256,state=createMemoryState()}){
 if(![readPolicy,decide,clock].every(f=>typeof f==='function')||!Number.isSafeInteger(capacity)||capacity<1||capacity>4096)throw Error('ENROLLMENT_BINDING');
 const records=state.records;
 function sweep(){for(const [k,v]of records)if(v.expires<=clock())records.delete(k);}
 async function current(identity){
  if(!identity||!['human','service'].includes(identity.kind)||!['issuer','subject','client','jti'].every(k=>typeof identity[k]==='string'&&identity[k].length>0&&identity[k].length<=256)||!Number.isSafeInteger(identity.expires_at)||identity.expires_at<=clock()||identity.expires_at>clock()+300)fail();
  const policy=structuredClone(await readPolicy());
  if(!policy||!Number.isSafeInteger(policy.revision)||policy.revision<1||!Array.isArray(policy.principals)||!Array.isArray(policy.roles))fail();
  const candidates=policy.principals.filter(p=>p.issuer===identity.issuer&&p.subject===identity.subject&&p.kind===identity.kind);
  if(candidates.length!==1)fail();const principal=candidates[0];
  if(!principal.enabled||principal.client!==identity.client||!Array.isArray(principal.enrollment_roles)||principal.enrollment_roles.length>100||new Set(principal.enrollment_roles).size!==principal.enrollment_roles.length||principal.enrollment_roles.some(id=>policy.roles.filter(r=>r.id===id).length!==1)||!Array.isArray(principal.memberships))fail();
  return {policy,principal};
 }
 function register(identity){return state.transaction(()=>{
  sweep();const k=key(identity),existing=records.get(k);
  if(existing){if(existing.revoked||existing.expires!==identity.expires_at)fail();return existing;}
  if(records.size>=capacity)fail();const entry={expires:identity.expires_at,revoked:false};records.set(k,entry);return entry;
 });}
 async function enroll(identity){const {principal}=await current(identity);register(identity);return principal.memberships.filter(x=>x.enabled).map(x=>x.tenant);}
 async function authorize(identity,tenant,permissions){
  try{
   const {policy,principal}=await current(identity),entry=register(identity);
   const members=principal.memberships.filter(x=>x.tenant===tenant);if(members.length!==1||!members[0].enabled)fail();
   // Only operator-selected roles become active; token/caller role claims are absent.
   principal.sessions=[{jti:identity.jti,enabled:true,active_roles:[...principal.enrollment_roles]}];
   for(const p of policy.principals)delete p.enrollment_roles;
   const result=await decide(policy,identity,tenant,permissions);
   const latest=records.get(key(identity));if(!latest||latest.revoked||latest.expires!==entry.expires||entry.expires<=clock())fail();
   if(!Array.isArray(result)||result.length!==permissions.length||result.some(x=>typeof x!=='boolean'))fail();return result;
  }catch{return permissions.map(()=>false);}
 }
 function revoke(identity){state.transaction(()=>{
  if(!identity||!['human','service'].includes(identity.kind)||!['issuer','subject','client','jti'].every(k=>typeof identity[k]==='string'&&identity[k].length>0&&identity[k].length<=256)||!Number.isSafeInteger(identity.expires_at)||identity.expires_at>clock()+300)fail();
  if(identity.expires_at<=clock())return;
  sweep();const k=key(identity),entry=records.get(k);if(!entry&&records.size>=capacity)fail();
  records.set(k,{expires:entry?.expires??identity.expires_at,revoked:true});
 });}
 return {enroll,authorize,revoke};
}
