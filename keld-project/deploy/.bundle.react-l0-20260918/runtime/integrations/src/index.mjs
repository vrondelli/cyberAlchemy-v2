import {createKeldAuth,Rejected,SessionError} from './auth.mjs';
import {createPaymentAdapters} from './payments.mjs';
import {createRepository} from './repository.mjs';
import {createCheckoutService} from './checkout.mjs';
import {createEventVerifiers,createEventInbox} from './events.mjs';
import {pipeline} from 'node:stream/promises';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const publicFiles=new Map([['/buyer.css',['buyer.css','text/css']],['/buyer.mjs',['buyer.mjs','text/javascript']],['/buyer-client.mjs',['buyer-client.mjs','text/javascript']]]);
const buyerPages=new Set(['/','/purchase/return','/purchase/cancel','/signed-out']);
const reactPreviewPages=new Set(['/react-preview','/react-preview/','/purchase/return','/purchase/cancel','/signed-out']);

export async function loadAppBundle(base=new URL('../public-app/',import.meta.url)) {
  let manifest;
  try {manifest=JSON.parse(await readFile(new URL('asset-manifest.json',base),'utf8'));}
  catch(error){if(error?.code==='ENOENT')return null;throw error;}
  if(manifest?.schema!=='keld-web-assets/v1'||manifest.index!=='index.html'||!manifest.assets||typeof manifest.assets!=='object')throw new Error('Invalid KELD web asset manifest');
  const index=await readFile(new URL(manifest.index,base));
  const assets=new Map();
  for(const [route,entry] of Object.entries(manifest.assets)){
    if(!/^\/assets\/[A-Za-z0-9._/-]+$/.test(route)||route.includes('..')||!entry||typeof entry!=='object'||entry.file!==route.slice(1)||typeof entry.type!=='string')throw new Error('Invalid KELD web asset entry');
    assets.set(route,{content:await readFile(new URL(entry.file,base)),type:entry.type,immutable:entry.immutable===true});
  }
  return {index,assets};
}

export async function createKeldIntegrations({auth: authConfig,payments,ledger,quoteBrl,diagnostic,events}) {
  const adapters=createPaymentAdapters(payments);
  const verifiers=events?createEventVerifiers(events):undefined;
  const repository=createRepository(ledger);
  const inbox=verifiers?createEventInbox({verifiers,repository}):undefined;
  const auth=await createKeldAuth(authConfig);
  const checkout=createCheckoutService({auth,adapters,repository,origin:authConfig.profile.origin,quoteBrl});
  const app=await loadAppBundle();
  return {auth,checkout,handler:createHandler({auth,checkout,origin:authConfig.profile.origin,diagnostic,inbox,app}),
    initialize:()=>auth.store.migrate(),close:()=>auth.store.close()};
}

/** Mount behind KELD's trusted HTTPS listener. No provider-supplied redirect proves payment. */
export function createHandler({auth,checkout,origin,inbox,app=null,diagnostic=event=>console.error(JSON.stringify(event))}) {
  const host=new URL(origin).host;let activeDownloads=0;
  return async(req,res)=>{
    const json=(status,value)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(value));};
    const page=(content,type='text/html',cache='no-store')=>{res.writeHead(200,{'content-type':type+'; charset=utf-8','cache-control':cache,'x-content-type-options':'nosniff',
      'referrer-policy':'no-referrer','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"});res.end(content);};
    try {
      if(req.headers.host!==host)throw new Rejected('host-rejected');
      const url=new URL(req.url,origin);
      if(url.pathname.startsWith('/events/')){
        const provider=url.pathname.slice('/events/'.length);
        if(!inbox||req.method!=='POST'||!['stripe','mercadopago','paypal'].includes(provider))return json(404,{error:'not-found'});
        if(req.headers['content-type']?.split(';')[0]!=='application/json')throw new Rejected('json-required');
        const guarded=new Set(['stripe-signature','x-signature','x-request-id','paypal-transmission-id','paypal-transmission-time','paypal-cert-url','paypal-auth-algo','paypal-transmission-sig']);
        const seen=new Set();for(let i=0;i<(req.rawHeaders?.length??0);i+=2){const name=req.rawHeaders[i].toLowerCase();if(guarded.has(name)){if(seen.has(name))throw new Rejected('event-authentication-failed',403);seen.add(name);}}
        const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>65536)throw new Rejected('event-body-invalid');chunks.push(chunk);}
        return json(202,await inbox.receive(provider,Buffer.concat(chunks),req.headers,req.url));
      }
      if(await auth.handle(req,res))return;
      if(req.method==='GET'&&app&&reactPreviewPages.has(url.pathname))return page(app.index);
      if(req.method==='GET'&&app?.assets.has(url.pathname)){
        const asset=app.assets.get(url.pathname);
        return page(asset.content,asset.type,asset.immutable?'public, max-age=31536000, immutable':'no-cache');
      }
      if(req.method==='GET'&&(buyerPages.has(url.pathname)||publicFiles.has(url.pathname))){
        const [file,type]=publicFiles.get(url.pathname)??['buyer.html','text/html'];
        const content=await readFile(new URL('../public/'+file,import.meta.url));
        return page(content,type);
      }
      if(req.method==='GET'&&url.pathname==='/api/orders'){
        if([...url.searchParams.keys()].some(k=>k!=='before')||url.searchParams.getAll('before').length>1)throw new Rejected('query-rejected');
        return json(200,await checkout.list(req,url.searchParams.has('before')?url.searchParams.get('before'):undefined));
      }
      if(url.search)throw new Rejected('query-rejected');
      if(req.method==='GET'&&url.pathname==='/api/session'){
        const identity=await auth.identity(req);return json(200,{authenticated:true,csrf:identity.csrf});
      }
      if(req.method!=='POST')return json(404,{error:'not-found'});
      if(req.headers['content-type']?.split(';')[0]!=='application/json')throw new Rejected('json-required');
      const chunks=[];let size=0;
      for await(const chunk of req){size+=chunk.length;if(size>16384)throw new Rejected('body-too-large');chunks.push(chunk);}
      let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new Rejected('json-invalid');}
      if(url.pathname==='/api/checkout')return json(200,await checkout.create(req,body));
      if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==1||typeof body.orderId!=='string')throw new Rejected('order-fields');
      if(url.pathname==='/api/restore')return json(200,await checkout.restore(req,body.orderId));
      if(url.pathname==='/api/confirm')return json(200,await checkout.confirm(req,body.orderId));
      if(url.pathname==='/api/download'){
        if(activeDownloads>=2)throw new Rejected('download-capacity',503);
        activeDownloads++;
        const controller=new AbortController();
        const abort=()=>{if(!res.writableFinished)controller.abort();};res.once('close',abort);
        try{
          const result=await checkout.downloadStream(req,body.orderId,{signal:controller.signal});
          res.writeHead(200,{'content-type':'application/octet-stream','content-disposition':'attachment; filename="are-sandbox-fixture.bin"','cache-control':'no-store','x-content-type-options':'nosniff'});
          await pipeline(result.stream,res,{signal:controller.signal});
          return;
        }finally{res.removeListener('close',abort);controller.abort();activeDownloads--;}
      }
      return json(404,{error:'not-found'});
    }catch(error){
      if(res.headersSent||res.destroyed)return res.destroy();
      const status=error instanceof Rejected||error instanceof SessionError?error.status:503;
      const code=(error instanceof Rejected||error instanceof SessionError)&&/^[a-z_-]{1,80}$/.test(error.code)?error.code:'service-unavailable';
      const requestId=randomUUID();
      // Never log raw errors, headers, URLs, payloads, credentials or customer IDs.
      try {diagnostic({event:'keld-request-failed',requestId,status,code});}catch{}
      return json(status,{error:code,requestId});
    }
  };
}
