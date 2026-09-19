import {mkdir,writeFile,readFile,access} from 'node:fs/promises';
import {randomBytes,createPublicKey} from 'node:crypto';
import {generateKeyPair,exportJWK,exportPKCS8,exportSPKI} from 'jose';
import {execFileSync} from 'node:child_process';
process.chdir(new URL('..',import.meta.url).pathname);
await mkdir('.runtime',{recursive:true,mode:0o700});
const secret=()=>randomBytes(32).toString('base64url');
try { await access('.runtime/config.json'); }
catch {
 const keys=await generateKeyPair('RS256',{extractable:true});
 const publicKey=await exportJWK(keys.publicKey); Object.assign(publicKey,{kid:'prototype-service-1',alg:'RS256',use:'sig'});
 const config={issuer:'http://localhost:18080/realms/auth-prototype',origin:'http://localhost:13000',browserClient:'prototype-browser',browserSecret:secret(),serviceClient:'prototype-service',adminPassword:secret(),userPassword:secret(),dbPassword:secret(),humanSub:'144d06f2-c6dd-4b8d-a68f-f6fc3b1eb5a2'};
 const audience={name:'prototype-api-audience',protocol:'openid-connect',protocolMapper:'oidc-audience-mapper',config:{'included.custom.audience':'prototype-api','id.token.claim':'false','access.token.claim':'true'}};
 const realm={realm:'auth-prototype',loginTheme:'auth-foundation',displayName:'Auth Foundation',enabled:true,sslRequired:'external',registrationAllowed:false,resetPasswordAllowed:false,rememberMe:false,loginWithEmailAllowed:false,duplicateEmailsAllowed:false,bruteForceProtected:true,permanentLockout:false,failureFactor:5,waitIncrementSeconds:30,maxFailureWaitSeconds:300,accessTokenLifespan:300,ssoSessionIdleTimeout:900,ssoSessionMaxLifespan:28800,revokeRefreshToken:true,refreshTokenMaxReuse:0,passwordPolicy:'length(15) and hashAlgorithm(argon2)',eventsEnabled:true,adminEventsEnabled:true,adminEventsDetailsEnabled:false,webAuthnPolicyRpEntityName:'Auth Foundation prototype',webAuthnPolicyRpId:'localhost',webAuthnPolicyUserVerificationRequirement:'required',webAuthnPolicyPasswordlessRpEntityName:'Auth Foundation prototype',webAuthnPolicyPasswordlessRpId:'localhost',webAuthnPolicyPasswordlessUserVerificationRequirement:'required',clients:[
 {clientId:config.browserClient,enabled:true,protocol:'openid-connect',publicClient:false,secret:config.browserSecret,standardFlowEnabled:true,directAccessGrantsEnabled:false,implicitFlowEnabled:false,serviceAccountsEnabled:false,redirectUris:[config.origin+'/callback'],webOrigins:[config.origin],attributes:{'pkce.code.challenge.method':'S256','post.logout.redirect.uris':config.origin+'/signed-out'},protocolMappers:[audience]},
 {clientId:config.serviceClient,enabled:true,protocol:'openid-connect',publicClient:false,clientAuthenticatorType:'client-jwt',serviceAccountsEnabled:true,standardFlowEnabled:false,directAccessGrantsEnabled:false,implicitFlowEnabled:false,attributes:{'use.jwks.url':'false','jwt.credential.public.key':await exportSPKI(keys.publicKey),'token.endpoint.auth.signing.alg':'RS256'},protocolMappers:[audience]}],users:[{id:config.humanSub,username:'alice',enabled:true,emailVerified:true,firstName:'Alice',lastName:'Prototype',email:'alice@example.invalid',credentials:[{type:'password',value:config.userPassword,temporary:false}]}]};
 for (const [file,value] of Object.entries({'config.json':JSON.stringify(config,null,2),'realm.json':JSON.stringify(realm,null,2),'service-private.pem':await exportPKCS8(keys.privateKey),'compose.env':`AUTH_PROTO_DB_PASSWORD=${config.dbPassword}\nAUTH_PROTO_ADMIN_PASSWORD=${config.adminPassword}\n`})) await writeFile('.runtime/'+file,value,{mode:0o600});
}
execFileSync('docker',['compose','--env-file','.runtime/compose.env','up','-d'],{stdio:'inherit'});
const c=JSON.parse(await readFile('.runtime/config.json'));
for(let i=0;i<240;i++) { try {if((await fetch(c.issuer+'/.well-known/openid-configuration',{signal:AbortSignal.timeout(2000)})).ok)break;}catch{} if(i===239)throw Error('Keycloak not ready');await new Promise(r=>setTimeout(r,1000)); }
const admin=await fetch('http://localhost:18080/realms/master/protocol/openid-connect/token',{method:'POST',body:new URLSearchParams({grant_type:'password',client_id:'admin-cli',username:'prototype-admin',password:c.adminPassword})});
if(!admin.ok)throw Error('Local bootstrap authentication failed');
const {access_token}=await admin.json();
const headers={Authorization:`Bearer ${access_token}`};
if(!c.apiSecret){c.apiSecret=secret();await writeFile('.runtime/config.json',JSON.stringify(c,null,2),{mode:0o600});}
const apiClients=await (await fetch('http://localhost:18080/admin/realms/auth-prototype/clients?clientId=prototype-api',{headers})).json();
if(apiClients.length===0){const r=await fetch('http://localhost:18080/admin/realms/auth-prototype/clients',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({clientId:'prototype-api',enabled:true,protocol:'openid-connect',publicClient:false,secret:c.apiSecret,standardFlowEnabled:false,directAccessGrantsEnabled:false,serviceAccountsEnabled:false})});if(!r.ok)throw Error('API client registration failed');}
const clients=await (await fetch('http://localhost:18080/admin/realms/auth-prototype/clients?clientId=prototype-service',{headers})).json();
if(clients.length!==1)throw Error('Ambiguous service client');
const pub=createPublicKey(await readFile('.runtime/service-private.pem')).export({type:'spki',format:'pem'});
const updated={...clients[0],attributes:{...clients[0].attributes,'jwt.credential.public.key':pub,'use.jwks.url':'false'}};
delete updated.attributes['jwks.string'];
const update=await fetch(`http://localhost:18080/admin/realms/auth-prototype/clients/${clients[0].id}`,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(updated)});
if(!update.ok)throw Error('Public-key registration failed');
const account=await (await fetch(`http://localhost:18080/admin/realms/auth-prototype/clients/${clients[0].id}/service-account-user`,{headers})).json();
if(!account.id)throw Error('Missing machine subject');
try {await access('.runtime/policy.json');}catch {await writeFile('.runtime/policy.json',JSON.stringify({revision:1,principals:[{issuer:c.issuer,subject:c.humanSub,kind:'human',client:c.browserClient,id:'human:alice',enabled:true,read:true},{issuer:c.issuer,subject:account.id,kind:'service',client:c.serviceClient,id:'service:prototype',enabled:true,read:true}]},null,2),{mode:0o600});}
console.log('Local identity provider ready. Test credentials: .runtime/config.json (private).');

// Realm imports do not update an existing database: apply only the approved UX fields.
const adminBase='http://localhost:18080/admin/realms/auth-prototype';
const realmUpdate=await fetch(adminBase,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({loginTheme:'auth-foundation',displayName:'Auth Foundation'})});
if(!realmUpdate.ok)throw Error('Login theme update failed');
const browserListResponse=await fetch(adminBase+'/clients?clientId='+c.browserClient,{headers});
if(!browserListResponse.ok)throw Error('Browser client lookup failed');
const browserClients=await browserListResponse.json();
if(browserClients.length!==1)throw Error('Ambiguous browser client');
const browserClient=browserClients[0];
const browserUpdate=await fetch(adminBase+'/clients/'+browserClient.id,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({...browserClient,attributes:{...browserClient.attributes,'post.logout.redirect.uris':c.origin+'/signed-out'}})});
if(!browserUpdate.ok)throw Error('Signed-out destination update failed');
console.log('Branded login ready; existing identities and policy preserved.');
