// Existing imported humans can lack the default self-service account roles.
// Open questions: ../../../development/authentication-v1/MFA-RECOVERY-PLAN.md
export async function ensureAccountAccess({get,request,userId}) {
 const userPath='/users/'+encodeURIComponent(userId),user=await get(userPath);
 if(!user.enabled||user.serviceAccountClientId)throw Error('Account access requires an enabled human user');
 const clients=await get('/clients?clientId=account');
 if(clients.length!==1)throw Error('Expected the built-in account client');
 const client=clients[0],path=userPath+'/role-mappings/clients/'+client.id;
 const existing=await get(path+'/composite'),missing=[];
 for(const name of ['view-profile','manage-account']) {
  const role=await get('/clients/'+client.id+'/roles/'+name);
  if(!existing.some(r=>r.id===role.id))missing.push(role);
 }
 if(missing.length)await request(path,'POST',missing);
 return {client:'account',added_roles:missing.map(r=>r.name)};
}
