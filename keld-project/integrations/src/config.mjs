import {resolveSecretFiles} from './secret-files.mjs';
import {createReadStream} from 'node:fs';
import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname,basename} from 'node:path';
import {createHash,X509Certificate} from 'node:crypto';
import {createSecureContext} from 'node:tls';

export class ConfigurationError extends Error {
  constructor(issues){super('configuration-invalid');this.issues=issues;}
}
/** Closed, declarative config. Diagnostics contain field paths/codes, never values. */
export function compileConfig(input,{env=process.env,baseDir=process.cwd(),now=Math.floor(Date.now()/1000),requireCurrentQuote=true,role='web'}={}){
  const issues=[];if(!['web','worker'].includes(role))throw new ConfigurationError([{path:'role',code:'role-invalid'}]);const bad=(path,code)=>issues.push({path,code});
  const record=(value,path,keys)=>{
    if(!value||typeof value!=='object'||Array.isArray(value)){bad(path,'object-required');return {};}
    for(const key of Object.keys(value))if(!keys.includes(key))bad(path,'unknown-field');
    return value;
  };
  const string=(value,path)=>{if(typeof value!=='string'||!value.trim()){bad(path,'string-required');return '';}return value;};
  const secret=(name,path)=>{if(typeof name!=='string'||!/^KELD_[A-Z0-9_]+$/.test(name)){bad(path,'environment-reference-required');return '';}
    if(typeof env[name]!=='string'||!env[name]){bad(path,'environment-value-missing');return '';}return env[name];};
  const file=(value,path)=>{const s=string(value,path);return s?resolve(baseDir,s):'';};
  const c=record(input,'config',['version','origin','auth','payments','tls','ledger','quoteBrl','webhooks','listener','checkout']);
  if(c.version!==1)bad('version','unsupported-version');
  const checkout=c.checkout===undefined?{}:record(c.checkout,'checkout',['automaticReplacement']);
  if(checkout.automaticReplacement!==undefined&&typeof checkout.automaticReplacement!=='boolean')bad('checkout.automaticReplacement','boolean-required');
  let listener;
  if(c.listener!==undefined){
    listener=record(c.listener,'listener',['mode','host','port']);
    if(listener.mode!=='proxy-http'||!['127.0.0.1','0.0.0.0'].includes(listener.host)||!Number.isInteger(listener.port)||listener.port<1024||listener.port>65535)bad('listener','private-proxy-listener-required');
    if(c.tls!==undefined)bad('tls','proxy-terminates-tls');
  }
  let origin;try{origin=new URL(c.origin);if(origin.origin!==c.origin||origin.protocol!=='https:'||origin.username||origin.password||(!listener&&(!['localhost','127.0.0.1'].includes(origin.hostname)||Number(origin.port)<1024||Number(origin.port)>65535)))throw Error();}catch{bad('origin',listener?'public-https-origin-required':'loopback-https-origin-required');}
  let profile,databaseUrl,key;
  if(role==='web'){
  const a=record(c.auth,'auth',['issuer','client','audience','secretEnv','databaseUrlEnv','keyEnv']);
  let issuer;try{issuer=new URL(a.issuer);if(issuer.protocol!=='https:'||issuer.username||issuer.password||issuer.search||issuer.hash||issuer.href.endsWith('/'))throw Error();}catch{bad('auth.issuer','https-issuer-required');}
  profile={issuer:a.issuer,origin:c.origin,callback:'/auth/callback',client:string(a.client,'auth.client'),audience:string(a.audience,'auth.audience'),secret:secret(a.secretEnv,'auth.secretEnv')};
  if(profile.secret&&profile.secret.length<32)bad('auth.secretEnv','client-secret-too-short');
  databaseUrl=secret(a.databaseUrlEnv,'auth.databaseUrlEnv');key=secret(a.keyEnv,'auth.keyEnv');
  try{if(!['postgres:','postgresql:'].includes(new URL(databaseUrl).protocol))throw Error();}catch{if(databaseUrl)bad('auth.databaseUrlEnv','postgres-url-required');}
  if(key&&(!/^[A-Za-z0-9_-]{43}$/.test(key)||Buffer.from(key,'base64url').length!==32))bad('auth.keyEnv','base64url-32-byte-key-required');
  }
  const p=record(c.payments,'payments',['stripe','mercadopago','paypal']);
  const stripe=record(p.stripe,'payments.stripe',['account','secretEnv']);
  const mp=record(p.mercadopago,'payments.mercadopago',['account','accessTokenEnv','api','applicationId']);
  const pp=record(p.paypal,'payments.paypal',['account','clientIdEnv','secretEnv','currency']);
  const payments={environment:'sandbox',stripe:{account:string(stripe.account,'payments.stripe.account'),secret:secret(stripe.secretEnv,'payments.stripe.secretEnv')},
    mercadopago:{api:mp.api??'payments-v1',...(mp.api==='orders-v1'?{applicationId:string(mp.applicationId,'payments.mercadopago.applicationId')}:{}),account:string(mp.account,'payments.mercadopago.account'),accessToken:secret(mp.accessTokenEnv,'payments.mercadopago.accessTokenEnv')},
    paypal:{account:string(pp.account,'payments.paypal.account'),clientId:secret(pp.clientIdEnv,'payments.paypal.clientIdEnv'),secret:secret(pp.secretEnv,'payments.paypal.secretEnv'),currency:string(pp.currency,'payments.paypal.currency')}};
  if(payments.stripe.secret&&!payments.stripe.secret.startsWith('sk_test_'))bad('payments.stripe.secretEnv','sandbox-key-required');
  if(!['USD','BRL'].includes(payments.paypal.currency))bad('payments.paypal.currency','unsupported-currency');
  if(mp.api==='orders-v1'&&!/^\d{1,32}$/.test(mp.applicationId??''))bad('payments.mercadopago.applicationId','application-id-required');
  if(!['payments-v1','orders-v1'].includes(payments.mercadopago.api))bad('payments.mercadopago.api','unsupported-api');
  if(payments.mercadopago.accessToken&&!payments.mercadopago.accessToken.startsWith(mp.api==='orders-v1'?'APP_USR-':'TEST-'))bad('payments.mercadopago.accessTokenEnv','sandbox-key-required');
  let tlsFiles={};if(!listener&&role==='web'){const t=record(c.tls,'tls',['certFile','keyFile']);tlsFiles={certFile:file(t.certFile,'tls.certFile'),keyFile:file(t.keyFile,'tls.keyFile')};}
  const l=record(c.ledger,'ledger',['database','fixtureFile','sha256','bytes','reservationSeconds']);
  const database=file(l.database,'ledger.database'),fixtureFile=file(l.fixtureFile,'ledger.fixtureFile');
  if(!/^[a-f0-9]{64}$/.test(l.sha256))bad('ledger.sha256','sha256-required');
  if(!Number.isInteger(l.bytes)||l.bytes<1||l.bytes>256*1024*1024)bad('ledger.bytes','fixture-size-required');
  if(!Number.isInteger(l.reservationSeconds)||l.reservationSeconds<1860||l.reservationSeconds>86400)bad('ledger.reservationSeconds','reservation-out-of-range');
  if(database&&[fixtureFile,tlsFiles.certFile,tlsFiles.keyFile].includes(database))bad('ledger.database','distinct-file-required');
  const q=record(c.quoteBrl,'quoteBrl',['numerator','denominator','reference','expiresAt']);
  for(const k of ['numerator','denominator'])if(!Number.isSafeInteger(q[k])||q[k]<1||q[k]>100000000)bad('quoteBrl.'+k,'positive-integer-required');
  string(q.reference,'quoteBrl.reference');
  const fixedQuote=q.expiresAt===null;
  if(!fixedQuote&&(!Number.isSafeInteger(q.expiresAt)||q.expiresAt<=0||(requireCurrentQuote&&q.expiresAt<=now)))bad('quoteBrl.expiresAt','future-expiry-or-null-fixed-required');
  let events;
  if(c.webhooks!==undefined&&role==='web'){
    const w=record(c.webhooks,'webhooks',['stripe','mercadopago','paypal']);events={environment:'sandbox'};
    if(w.stripe!==undefined){const v=record(w.stripe,'webhooks.stripe',['secretEnv']);const value=secret(v.secretEnv,'webhooks.stripe.secretEnv');if(value&&(!value.startsWith('whsec_')||value.length<=6))bad('webhooks.stripe.secretEnv','endpoint-secret-required');events.stripe={account:payments.stripe.account,secret:value};}
    if(w.mercadopago!==undefined){const v=record(w.mercadopago,'webhooks.mercadopago',['secretEnv']);const value=secret(v.secretEnv,'webhooks.mercadopago.secretEnv');if(value&&value.length<16)bad('webhooks.mercadopago.secretEnv','endpoint-secret-too-short');events.mercadopago={api:payments.mercadopago.api,account:payments.mercadopago.account,secret:value};}
    if(w.paypal!==undefined){const v=record(w.paypal,'webhooks.paypal',['webhookId']);const webhookId=string(v.webhookId,'webhooks.paypal.webhookId');if(webhookId&&!/^[-A-Za-z0-9_.:]{1,256}$/.test(webhookId))bad('webhooks.paypal.webhookId','webhook-id-invalid');events.paypal={account:payments.paypal.account,clientId:payments.paypal.clientId,secret:payments.paypal.secret,webhookId};}
  }
  if(issues.length)throw new ConfigurationError(issues);
  return {port:listener?.port??Number(origin.port),bindHost:listener?.host??'127.0.0.1',transport:listener?'http':'https',hostname:origin.hostname,tlsFiles,fixtureFile,
    integration:{events,auth:role==='web'?{profile,databaseUrl,key,namespace:'keld'}:undefined,payments,
      automaticReplacement:checkout.automaticReplacement===true,
      ledger:{database,releaseDigest:l.sha256,reservationSeconds:l.reservationSeconds,delivery:{root:dirname(fixtureFile),artifacts:[{sha256:l.sha256,bytes:l.bytes,relative_path:basename(fixtureFile)}]}},
      quoteBrl:async cents=>{
        if(!fixedQuote&&Math.floor(Date.now()/1000)>=q.expiresAt)throw new Error('quote-expired');
        const value=Number((BigInt(cents)*BigInt(q.numerator)+BigInt(Math.floor(q.denominator/2)))/BigInt(q.denominator));
        if(value<1||value>100000000)throw new Error('quote-out-of-range');
        return {amountCents:value,currency:'BRL',reference:q.reference};
      }}};
}
export async function loadConfig(path,options={}){
  let input;try{const info=await stat(path);if(info.size>65536)throw Error();input=JSON.parse(await readFile(path,'utf8'));}catch{throw new ConfigurationError([{path:'config',code:'readable-json-required'}]);}
  const secrets=await resolveSecretFiles(input,options);
  if(secrets.issues.length)throw new ConfigurationError(secrets.issues);
  const config=compileConfig(input,{...options,env:secrets.env,baseDir:dirname(resolve(path))});const issues=[];
  let cert,key;
  for(const [name,limit] of (config.transport==='https'&&options.role!=='worker'?[['certFile',65536],['keyFile',16384]]:[]))try{const p=config.tlsFiles[name],info=await stat(p);if(!info.isFile()||info.size>limit)throw Error();const bytes=await readFile(p);if(name==='certFile')cert=bytes;else key=bytes;}catch{issues.push({path:'tls.'+name,code:'readable-bounded-file-required'});}
  if(cert&&key)try{createSecureContext({cert,key});const x=new X509Certificate(cert);const matched=config.hostname==='localhost'?x.checkHost('localhost'):x.checkIP(config.hostname);if(!matched||Date.parse(x.validTo)<=Date.now()||Date.parse(x.validFrom)>Date.now())throw Error();}catch{issues.push({path:'tls',code:'matching-current-loopback-certificate-required'});}
  try{const info=await stat(config.fixtureFile);if(!info.isFile()||info.size!==input.ledger.bytes)throw Error();const hash=createHash('sha256');let size=0;for await(const chunk of createReadStream(config.fixtureFile)){size+=chunk.length;if(size>input.ledger.bytes)throw Error();hash.update(chunk);}if(size!==input.ledger.bytes||hash.digest('hex')!==input.ledger.sha256)throw Error();}catch{issues.push({path:'ledger.fixtureFile',code:'fixture-integrity-failed'});}
  try{if(!(await stat(dirname(config.integration.ledger.database))).isDirectory())throw Error();}catch{issues.push({path:'ledger.database',code:'parent-directory-required'});}
  if(issues.length)throw new ConfigurationError(issues);return {...config,tls:{cert,key}};
}
