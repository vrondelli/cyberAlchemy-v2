import {childEnvironment} from './child-environment.mjs';
import {spawn} from 'node:child_process';
import {Readable} from 'node:stream';
import {createHash} from 'node:crypto';
import {Rejected,Unavailable} from './errors.mjs';

/** Private JSON-header/binary-body bridge; no caller-controlled file path. */
export async function openDownload({python,script,payload,signal}){
  if(signal?.aborted)throw new Unavailable('download-interrupted');
  const child=spawn(python,[script],{stdio:['pipe','pipe','pipe'],env:childEnvironment()});
  let failure,finished=false,timer;
  const stop=code=>{
    failure??=new Unavailable(code);
    child.kill();
    child.stdout.destroy(failure);
  };
  const abort=()=>stop('download-interrupted');
  const closed=new Promise(resolve=>{
    child.once('error',()=>{failure??=new Unavailable('ledger-unavailable');resolve(-1);});
    child.once('close',code=>{
      finished=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);resolve(code);
    });
  });
  child.stderr.resume();
  const iterator=child.stdout[Symbol.asyncIterator]();
  child.stdin.on('error',()=>stop('ledger-unavailable'));
  signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>stop('ledger-timeout'),15000);
  child.stdin.end(JSON.stringify(payload));
  try{
    let header=Buffer.alloc(0),rest,metadata;
    while(true){
      const item=await iterator.next();
      if(item.done)throw failure??new Unavailable('ledger-protocol');
      const index=item.value.indexOf(10);
      const prefix=index<0?item.value:item.value.subarray(0,index);
      if(header.length+prefix.length>4096)throw new Unavailable('ledger-protocol');
      header=Buffer.concat([header,prefix]);
      if(index<0)continue;
      let result;try{result=JSON.parse(header);}catch{throw new Unavailable('ledger-protocol');}
      if(result.ok!==true){
        if(typeof result.error==='string'&&/^[a-z-]{1,80}$/.test(result.error)&&[400,403,404,409,503].includes(result.status))throw new Rejected(result.error,result.status);
        throw new Unavailable('ledger-protocol');
      }
      metadata=result.value;
      if(!Number.isSafeInteger(metadata?.bytes)||metadata.bytes<1||metadata.bytes>256*1024*1024||metadata.sha256!==payload.releaseDigest)throw new Unavailable('ledger-protocol');
      rest=item.value.subarray(index+1);break;
    }
    clearTimeout(timer);
    if(!finished)timer=setTimeout(()=>stop('download-timeout'),120000);
    const stream=Readable.from((async function*(){
      let size=0;const hash=createHash('sha256');
      try{
        let chunk=rest;
        while(true){
          if(failure)throw failure;
          if(chunk.length){
            size+=chunk.length;
            if(size>metadata.bytes)throw new Unavailable('download-integrity-failed');
            hash.update(chunk);yield chunk;
          }
          const next=await iterator.next();if(next.done)break;chunk=next.value;
        }
        const code=await closed;
        if(failure)throw failure;
        if(code!==0||size!==metadata.bytes||hash.digest('hex')!==metadata.sha256)throw new Unavailable('download-integrity-failed');
      }finally{
        if(!finished)child.kill();
        clearTimeout(timer);signal?.removeEventListener('abort',abort);
        await iterator.return?.();
      }
    })());
    return {...metadata,stream};
  }catch(error){
    child.kill();clearTimeout(timer);signal?.removeEventListener('abort',abort);
    await iterator.return?.().catch(()=>{});
    throw error;
  }
}
