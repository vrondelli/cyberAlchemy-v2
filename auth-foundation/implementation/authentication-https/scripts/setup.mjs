import {mkdir,writeFile,readFile,access,chmod} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {generateKeyPair,exportPKCS8,exportSPKI} from 'jose';
import {execFileSync} from 'node:child_process';
import https from 'node:https';
import {certificates} from './certificates.mjs';
import {operatorRequest,operatorHeaders} from './operator.mjs';
import {selectedProfile,applyProfile} from '../src/profiles.mjs';
process.chdir(new URL('..',import.meta.url).pathname);process.umask(0o077);
const profile=selectedProfile();
await mkdir('.runtime',{recursive:true,mode:0o700});await mkdir('.runtime/socket',{recursive:true,mode:0o700});await mkdir('.runtime/proxy',{recursive:true,mode:0o700});await chmod('.runtime/proxy',0o750);
await certificates();
const save=(name,value)=>writeFile('.runtime/'+name,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{mode:0o600});
const secret=()=>randomBytes(32).toString('base64url');
try{await access('.runtime/config.json')}catch{
 const keys=await generateKeyPair('RS256',{extractable:true});
 const c={...profile,browserSecret:secret(),apiSecret:secret(),provisionerSecret:secret(),userPassword:secret(),dbPassword:secret(),humanSub:'95d9124c-39ec-49cc-b1a7-1f62702db44a'};
 const audience={name:'prototype-api-audience',protocol:'openid-connect',protocolMapper:'oidc-audience-mapper',config:{'included.custom.audience':'prototype-api','id.token.claim':'false','access.token.claim':'true'}};
 const client=(id,extra)=>({clientId:id,enabled:true,protocol:'openid-connect',publicClient:false,standardFlowEnabled:false,directAccessGrantsEnabled:false,implicitFlowEnabled:false,serviceAccountsEnabled:false,...extra});
 const realm={realm:'auth-https',enabled:true,sslRequired:'all',displayName:'Auth Foundation',loginTheme:'auth-foundation',registrationAllowed:false,resetPasswordAllowed:false,rememberMe:false,loginWithEmailAllowed:false,duplicateEmailsAllowed:false,bruteForceProtected:true,permanentLockout:false,failureFactor:5,waitIncrementSeconds:30,maxFailureWaitSeconds:300,accessTokenLifespan:300,ssoSessionIdleTimeout:1800,ssoSessionMaxLifespan:28800,revokeRefreshToken:true,refreshTokenMaxReuse:0,passwordPolicy:'length(15) and hashAlgorithm(argon2)',eventsEnabled:true,adminEventsEnabled:true,adminEventsDetailsEnabled:false,clients:[
 client(c.browserClient,{secret:c.browserSecret,standardFlowEnabled:true,redirectUris:[c.origin+'/callback'],webOrigins:[c.origin],attributes:{'pkce.code.challenge.method':'S256','post.logout.redirect.uris':c.origin+'/signed-out'},protocolMappers:[audience]}),
 client(c.serviceClient,{clientAuthenticatorType:'client-jwt',serviceAccountsEnabled:true,attributes:{'use.jwks.url':'false','jwt.credential.public.key':await exportSPKI(keys.publicKey),'token.endpoint.auth.signing.alg':'RS256'},protocolMappers:[audience]}),
 client('prototype-api',{secret:c.apiSecret}),client('https-provisioner',{secret:c.provisionerSecret,serviceAccountsEnabled:true})
 ],users:[{id:c.humanSub,username:'alice',enabled:true,emailVerified:true,firstName:'Alice',lastName:'HTTPS Test',email:'alice@example.invalid',credentials:[{type:'password',value:c.userPassword,temporary:false}]},{username:'service-account-https-provisioner',enabled:true,serviceAccountClientId:'https-provisioner',clientRoles:{'realm-management':['realm-admin']}}]};
 await save('service-private.pem',await exportPKCS8(keys.privateKey));await save('realm.json',realm);await save('config.json',c);
}
const c=applyProfile(JSON.parse(await readFile('.runtime/config.json')),profile);
await save('config.json',c);
const render=async(name,replacements)=>{
 let source=await readFile('proxy/'+name,'utf8');
 for(const [placeholder,value] of Object.entries(replacements))source=source.replaceAll(`__${placeholder}__`,String(value));
 if(/__[A-Z_]+__/.test(source))throw Error('Unresolved proxy configuration placeholder');
 const target='.runtime/proxy/'+name;
 await writeFile(target,source,{mode:0o600});
 await chmod(target,0o640);
};
await render('nginx.conf',{APP_PORT:c.appPort,ISSUER_PORT:c.issuerPort,OPERATOR_PORT:c.operatorPort});
await render('upstream.conf',{ISSUER_PORT:c.issuerPort});
// Mounted private material is readable only by the owning service UID/GID.
// This keeps the local UID-1000 profile and a dedicated VPS UID-1000 service
// portable without granting world access or running the proxy as root.
for(const name of ['realm.json','tls/frontend.key','tls/keycloak.key','tls/operator.key'])await chmod('.runtime/'+name,0o640);
for(const name of ['tls/ca.crt','tls/frontend.crt','tls/keycloak.crt','tls/operator.crt'])await chmod('.runtime/'+name,0o644);
try{await access('.runtime/network.json')}catch{
 const ids=execFileSync('docker',['network','ls','-q'],{encoding:'utf8'}).trim().split(/\s+/).filter(Boolean);
 const networks=ids.length?JSON.parse(execFileSync('docker',['network','inspect',...ids],{encoding:'utf8'})):[];
 const occupied=networks.flatMap(n=>n.IPAM.Config||[]).map(x=>x.Subnet||'');
 // Reject overlapping Docker allocations, including broad /16s, before choosing a /24.
 const numeric=ip=>ip.split('.').reduce((n,x)=>(n*256+Number(x))>>>0,0);
 const ranges=occupied.filter(x=>x.includes('.')&&x.includes('/')).map(x=>{const [ip,bits]=x.split('/'),mask=(0xffffffff<<(32-Number(bits)))>>>0;return [numeric(ip)&mask,Number(bits)]});
 let subnet;
 for(let i=200;i<250;i++){const candidate=`172.30.${i}.0`;if(!ranges.some(([n,b])=>(numeric(candidate)&((0xffffffff<<(32-b))>>>0))===n)){subnet=candidate+'/24';break}}
 if(!subnet)throw Error('No unused test Docker subnet found');await save('network.json',{subnet,proxy:subnet.replace('.0/24','.10')});
}
const network=JSON.parse(await readFile('.runtime/network.json'));
await save('compose.env',`AUTH_DB_PASSWORD=${c.dbPassword}\nAUTH_LOCAL_UID=${process.getuid()}\nAUTH_LOCAL_GID=${process.getgid()}\nAUTH_SUBNET=${network.subnet}\nAUTH_PROXY_IP=${network.proxy}\nAUTH_COMPOSE_PROJECT=${c.composeProject}\nAUTH_ISSUER_ORIGIN=${new URL(c.issuer).origin}\nAUTH_APP_PORT=${c.appPort}\nAUTH_ISSUER_PORT=${c.issuerPort}\nAUTH_OPERATOR_PORT=${c.operatorPort}\n`);
execFileSync('docker',['compose','--env-file','.runtime/compose.env','up','-d'],{stdio:'inherit'});
const ca=await readFile('.runtime/tls/ca.crt');
const ready=()=>new Promise(resolve=>{const req=https.get(c.issuer+'/.well-known/openid-configuration',{ca,timeout:2000},r=>{r.resume();resolve(r.statusCode===200)});req.on('timeout',()=>req.destroy());req.on('error',()=>resolve(false))});
for(let i=0;i<240;i++){if(await ready())break;if(i===239)throw Error('HTTPS issuer not ready');await new Promise(r=>setTimeout(r,1000))}
const headers=await operatorHeaders(c),base='/admin/realms/auth-https';
const realmUpdate=await operatorRequest(base,{origin:c.operatorOrigin,method:'PUT',headers,body:JSON.stringify({loginTheme:'auth-foundation',displayName:'Auth Foundation',sslRequired:'all',ssoSessionIdleTimeout:1800,ssoSessionMaxLifespan:28800})});if(!realmUpdate.ok)throw Error('Realm HTTPS policy update failed');
const response=await operatorRequest(base+'/clients?clientId=prototype-service',{origin:c.operatorOrigin,headers});if(!response.ok)throw Error('Service client lookup failed');const clients=await response.json();if(clients.length!==1)throw Error('Ambiguous service client');
const account=await (await operatorRequest(base+'/clients/'+clients[0].id+'/service-account-user',{origin:c.operatorOrigin,headers})).json();if(!account.id)throw Error('Missing machine identity');
try{await access('.runtime/policy.json')}catch{await save('policy.json',{revision:1,principals:[{issuer:c.issuer,subject:c.humanSub,kind:'human',client:c.browserClient,id:'human:alice',enabled:true,read:true},{issuer:c.issuer,subject:account.id,kind:'service',client:c.serviceClient,id:'service:prototype',enabled:true,read:true}]})}
// Only public CA trust is placed in a separate browser HOME. No normal trust store is modified.
const home=new URL('../.runtime/browser-home/',import.meta.url).pathname;
const db=home+'.pki/nssdb';await mkdir(db,{recursive:true,mode:0o700});
const nssEnv={...process.env,LD_LIBRARY_PATH:new URL('../.runtime/browser-libs/root/usr/lib/x86_64-linux-gnu',import.meta.url).pathname};
const certutil=new URL('../.runtime/tools/root/usr/bin/certutil',import.meta.url).pathname;
try{await access(db+'/cert9.db')}catch{execFileSync(certutil,['-N','-d','sql:'+db,'--empty-password'],{stdio:'pipe',env:nssEnv})}
execFileSync(certutil,['-A','-d','sql:'+db,'-n','Auth Foundation disposable HTTPS CA','-t','C,,','-i',new URL('../.runtime/tls/ca.crt',import.meta.url).pathname],{stdio:'pipe',env:nssEnv});
console.log(`HTTPS ${c.profile} setup ready: ${c.origin}. Run npm start, then npm run open. Test credentials stay in private .runtime/config.json.`);
