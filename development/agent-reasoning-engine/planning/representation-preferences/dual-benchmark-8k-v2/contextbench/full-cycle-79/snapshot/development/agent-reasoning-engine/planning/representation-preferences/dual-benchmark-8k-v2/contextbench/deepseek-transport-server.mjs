// Private container entry. Open questions: DEEPSEEK-DURABLE-TRANSPORT.md.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createDurableTransport,providerPost} from './deepseek-durable-transport.mjs';
export function serveTransport({transport,host='0.0.0.0',port=8080}){
 const reply=(res,status,value)=>{if(res.destroyed)return;res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(value));};
 let stopping=false,busy=false;
 const server=createServer({requestTimeout:150000,headersTimeout:10000,keepAliveTimeout:1000},async(req,res)=>{
  if(req.method==='GET'&&req.url==='/healthz')return reply(res,200,transport.state());
  if(req.method!=='POST'||req.url!=='/v1/chat/completions')return reply(res,404,{error:'route'});
  if(stopping||busy||transport.state().poisoned)return reply(res,429,{error:'transport-unavailable'});
  busy=true;const abort=new AbortController();res.once('close',()=>{if(!res.writableEnded)abort.abort();});
  try{
   const chunks=[];let bytes=0;for await(const part of req){bytes+=part.length;if(bytes>(transport.state().maximum_request_bytes??2*1024**2))throw Error('request-size');chunks.push(part);}
   const body=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));
   const result=await transport.process(body,{signal:abort.signal});
   if(!res.destroyed){res.writeHead(result.status,{'content-type':'text/event-stream'});res.end(result.bytes);}
  }catch(error){if(error.recoverableWindow){reply(res,400,{error:{code:'context_length_exceeded',type:'invalid_request_error',message:`Maximum context length is ${transport.state().window??8000} tokens including the output reservation. Compact the context before trying again.`}});}else reply(res,502,{error:{message:'benchmark transport stopped; inspect retained evidence',type:'benchmark_transport_error'}});}
  finally{busy=false;}
 });
 server.listen(port,host);
 return {server,async close(){if(stopping)throw Error('server-already-stopping');stopping=true;const closed=new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));const seal=await transport.close({cancel:true});server.closeAllConnections();await closed;return seal;}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const transport=createDurableTransport({root:process.env.EVIDENCE_ROOT??'/evidence',post:providerPost({key:readFileSync('/run/secrets/model_api_key','utf8')}),window:Number(process.env.CONTEXT_WINDOW??8000),maximum_request_bytes:Number(process.env.MAX_REQUEST_BYTES??2*1024**2),maximum_stage_bytes:Number(process.env.MAX_STAGE_BYTES??32*1024**2),output_cap:Number(process.env.OUTPUT_CAP??2048),token_budget:Number(process.env.TOKEN_BUDGET??96000),max_calls:Number(process.env.MAX_CALLS??96)});
 const running=serveTransport({transport});let closing=false;
 const stop=async()=>{if(closing)return;closing=true;try{await running.close();process.exitCode=0;}catch{process.exitCode=1;running.server.closeAllConnections();running.server.close();}};
 process.once('SIGTERM',stop);process.once('SIGINT',stop);
}
