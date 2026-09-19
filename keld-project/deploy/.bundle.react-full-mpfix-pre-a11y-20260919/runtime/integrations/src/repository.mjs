import {childEnvironment} from './child-environment.mjs';
import {openDownload} from './download-stream.mjs';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Rejected,Unavailable} from './errors.mjs';
const script=fileURLToPath(new URL('../../commerce/sdk_bridge.py',import.meta.url));

/** Trusted local stdio adapter to the existing Python ledger; no public RPC. */
export function createRepository({database,releaseDigest,reservationSeconds=3600,python='python3',delivery}) {
  return async (operation,input={},options={})=>{
    if(operation==='download-stream')return openDownload({python,script,payload:{database,releaseDigest,reservationSeconds,delivery,operation,input},signal:options.signal});
    return new Promise((resolve,reject)=>{
    const child=spawn(python,[script],{stdio:['pipe','pipe','pipe'],env:childEnvironment()});
    let out='',size=0,done=false;
    const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);error?reject(error):resolve(value);};
    const timer=setTimeout(()=>{child.kill();finish(new Unavailable('ledger-timeout'));},15000);
    child.on('error',()=>finish(new Unavailable('ledger-unavailable')));
    child.stderr.resume();
    child.stdout.on('data',chunk=>{size+=chunk.length;if(size>2*1024*1024){child.kill();finish(new Unavailable('ledger-response-limit'));}else out+=chunk;});
    child.on('close',code=>{
      let result;try{result=JSON.parse(out);}catch{return finish(new Unavailable('ledger-protocol'));}
      if(code===0&&result.ok===true)return finish(null,result.value);
      if(typeof result.error==='string'&&/^[a-z-]{1,80}$/.test(result.error)&&[400,403,404,409,429,503].includes(result.status))
        return finish(new Rejected(result.error,result.status));
      finish(new Unavailable('ledger-protocol'));
    });
    child.stdin.on('error',()=>finish(new Unavailable('ledger-unavailable')));
    child.stdin.end(JSON.stringify({database,releaseDigest,reservationSeconds,delivery,operation,input}));
    });
  };
}
