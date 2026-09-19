import Stripe from 'stripe';
import {WebhookSignatureValidator} from 'mercadopago';
import {Client,Environment} from '@paypal/paypal-server-sdk';
import {createHash} from 'node:crypto';
import {Rejected,Unavailable} from './errors.mjs';
const reject=()=>{throw new Rejected('event-authentication-failed',403);};
const id=value=>{if(typeof value!=='string'||!value.length||value.length>256||!/^[-A-Za-z0-9_.:]+$/.test(value))reject();return value;};
const header=(headers,name)=>{const value=headers[name];if(typeof value!=='string'||!value||value.length>4096)reject();return value;};
const object=body=>{if(!Buffer.isBuffer(body)||!body.length||body.length>65536)throw new Rejected('event-body-invalid');try{const text=new TextDecoder('utf-8',{fatal:true}).decode(body),value=JSON.parse(text);if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return {text,value};}catch{throw new Rejected('event-body-invalid');}};
const normalized=(provider,account,eventId,eventType,resourceId,resourceKind)=>({provider,account,environment:'sandbox',eventId:id(eventId),eventType:id(eventType),resourceId:id(resourceId),resourceKind:id(resourceKind)});

/** Configured providers only. Output is a verified lookup hint, never payment proof. */
export function createEventVerifiers(config,{request=globalThis.fetch,clock=()=>Date.now()}={}){
  if(config.environment!=='sandbox')throw new Rejected('sandbox-required');
  const verifiers={};
  for(const provider of ['stripe','mercadopago','paypal'])if(config[provider])id(config[provider].account);
  if(config.stripe){
    const c=config.stripe;if(typeof c.secret!=='string'||!c.secret.startsWith('whsec_')||c.secret.length<=6)throw new Rejected('event-secret-required');
    const stripe=new Stripe('sk_test_signature_only');
    verifiers.stripe=async(body,headers)=>{
      object(body);const signature=header(headers,'stripe-signature');
      const timestamps=signature.split(',').map(x=>x.trim()).filter(x=>x.startsWith('t='));
      if(timestamps.length!==1||!/^t=\d{10}$/.test(timestamps[0])||Math.abs(clock()/1000-Number(timestamps[0].slice(2)))>300)reject();
      let e;try{e=stripe.webhooks.constructEvent(body,signature,c.secret,300,undefined,clock());}catch{reject();}
      if(e.object!=='event'||e.livemode!==false||(e.account!==undefined&&e.account!==c.account))reject();
      return normalized('stripe',c.account,e.id,e.type,e.data?.object?.id,e.data?.object?.object);
    };
  }
  if(config.mercadopago){
    const c=config.mercadopago;if(typeof c.secret!=='string'||c.secret.length<16)throw new Rejected('event-secret-required');
    verifiers.mercadopago=async(body,headers,url)=>{
      object(body);const signature=header(headers,'x-signature'),requestId=id(header(headers,'x-request-id'));
      const u=new URL(url,'https://keld.invalid');const ids=u.searchParams.getAll('data.id');
      const isOrder=c.api==='orders-v1'&&/^ORD[A-Z0-9]{26}$/.test(ids[0]);
      if(ids.length!==1||(!isOrder&&!/^\d{1,32}$/.test(ids[0])))reject();
      const parts=signature.split(',').map(p=>p.trim());
      if(parts.length!==2||parts.filter(p=>/^ts=(?:\d{10}|\d{13})$/.test(p)).length!==1||parts.filter(p=>/^v1=[a-f0-9]{64}$/.test(p)).length!==1)reject();
      const ts=parts.find(p=>p.startsWith('ts=')).slice(3);
      if(Math.abs(clock()-Number(ts)*(ts.length===10?1000:1))>300000)reject();
      // SDK 3.6.1 freshness assumes seconds; authenticate the unchanged timestamp
      // with the SDK and enforce both documented units above. No signature fallback.
      try{WebhookSignatureValidator.validate({xSignature:signature,xRequestId:requestId,dataId:ids[0],secret:c.secret});}catch{reject();}
      const eventId=createHash('sha256').update(JSON.stringify([ids[0],requestId,ts])).digest('hex');
      // Neither the body ID/type/status nor user_id/livemode is signed by this MAC.
      return normalized('mercadopago',c.account,eventId,isOrder?'order.notification':'payment.notification',ids[0],isOrder?'order':'payment');
    };
  }
  if(config.paypal){
    const c=config.paypal;id(c.webhookId);
    if(typeof c.clientId!=='string'||!c.clientId||typeof c.secret!=='string'||!c.secret)throw new Rejected('event-secret-required');
    const client=new Client({environment:Environment.Sandbox,timeout:10000,clientCredentialsAuthCredentials:{oAuthClientId:c.clientId,oAuthClientSecret:c.secret},httpClientOptions:{retryConfig:{maxNumberOfRetries:0}}});
    let token;
    verifiers.paypal=async(body,headers)=>{
      const {text,value:e}=object(body);
      const fields={transmission_id:id(header(headers,'paypal-transmission-id')),transmission_time:header(headers,'paypal-transmission-time'),cert_url:header(headers,'paypal-cert-url'),auth_algo:header(headers,'paypal-auth-algo'),transmission_sig:header(headers,'paypal-transmission-sig'),webhook_id:c.webhookId};
      let cert;try{cert=new URL(fields.cert_url);}catch{reject();}
      if(fields.auth_algo!=='SHA256withRSA'||!Number.isFinite(Date.parse(fields.transmission_time))||cert.protocol!=='https:'||!['api.sandbox.paypal.com','api-m.sandbox.paypal.com'].includes(cert.hostname)||cert.port||cert.username||cert.password||cert.search||cert.hash||!/^\/v1\/notifications\/certs\/CERT-[A-Za-z0-9-]+$/.test(cert.pathname))reject();
      // Preserve the exact event JSON in the postback wrapper; do not reserialize it.
      const payload=JSON.stringify(fields).slice(0,-1)+',"webhook_event":'+text+'}';
      let verification;
      try{
        token=await client.clientCredentialsAuthManager.updateToken(token);
        const response=await request('https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature',{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{authorization:'Bearer '+token.accessToken,'content-type':'application/json'},body:payload});
        if(!response.ok)throw Error();
        const reader=response.body.getReader();let size=0;const chunks=[];
        for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();throw Error();}chunks.push(Buffer.from(value));}
        verification=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      }catch{throw new Unavailable('event-verification-unavailable');}
      if(verification.verification_status!=='SUCCESS')reject();
      if(e.resource?.payee?.merchant_id!==undefined&&e.resource.payee.merchant_id!==c.account)reject();
      return normalized('paypal',c.account,e.id,e.event_type,e.resource?.id,e.resource_type);
    };
  }
  return verifiers;
}
export function createEventInbox({verifiers,repository,clock=()=>Math.floor(Date.now()/1000),admissionPerMinute=120}){
  if(!Number.isSafeInteger(admissionPerMinute)||admissionPerMinute<1||admissionPerMinute>10000)throw new Rejected('event-admission-invalid');
  return {async receive(provider,body,headers,url){
    if(!Object.hasOwn(verifiers,provider))throw new Rejected('event-provider-disabled',404);
    const now=clock();
    await repository('event-admit',{provider,now,limit:admissionPerMinute});
    const event=await verifiers[provider](body,headers,url);
    return repository('event-receive',{event,now});
  }};
}
