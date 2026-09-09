// JSONL framing and correlation only. The caller owns process startup and authorization.
export function createRpcClient(child,{timeoutMs=10000,maxFrameBytes=1048576,onNotification=()=>{}}={}){
 let buffer=Buffer.alloc(0),ended=false;const pending=new Map();
 const fail=error=>{ended=true;for(const p of pending.values()){clearTimeout(p.timer);p.reject(error);}pending.clear();};
 child.stdout.on('data',chunk=>{
  if(ended)return;
  buffer=Buffer.concat([buffer,Buffer.from(chunk)]);
  for(;;){
   const index=buffer.indexOf(10);
   if(index<0){if(buffer.length>maxFrameBytes)fail(Error('rpc-frame-overflow'));break;}
   if(index>maxFrameBytes){fail(Error('rpc-frame-overflow'));break;}
   const line=buffer.subarray(0,index).toString('utf8');buffer=buffer.subarray(index+1);
   if(!line.trim())continue;
   let message;try{message=JSON.parse(line);}catch{fail(Error('malformed-rpc-frame'));break;}
   if(!message||typeof message!=='object'||Array.isArray(message)){fail(Error('invalid-rpc-message'));break;}
   if(Object.hasOwn(message,'id')&&!Object.hasOwn(message,'method')){
    const p=pending.get(message.id);if(!p){fail(Error('uncorrelated-rpc-response'));break;}
    clearTimeout(p.timer);pending.delete(message.id);p.resolve(message);
   }else{try{onNotification(message);}catch(error){fail(error);break;}}
  }
 });
 child.on('exit',()=>fail(Error('rpc-connection-ended-delivery-unknown')));
 child.on('error',fail);child.stdin.on('error',fail);
 return {
  request(request){
   if(ended)return Promise.reject(Error('rpc-connection-ended'));
   if(pending.has(request.id))return Promise.reject(Error('duplicate-pending-rpc-id'));
   return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{fail(Error('rpc-timeout-delivery-unknown'));},timeoutMs);
    pending.set(request.id,{resolve,reject,timer});
    try{child.stdin.write(JSON.stringify(request)+'\n');}catch(error){fail(error);}
   });
  },
  notify(message){if(ended)throw Error('rpc-connection-ended');child.stdin.write(JSON.stringify(message)+'\n');},
  close(){fail(Error('rpc-client-closed'));}
 };
}
// Record before writing; record the response before applying the bridge transition.
export async function exchange(transport,client){
 let response;
 await transport.send(async line=>{response=await client.request(JSON.parse(line));});
 transport.receive(response);return transport.applyResponse();
}
