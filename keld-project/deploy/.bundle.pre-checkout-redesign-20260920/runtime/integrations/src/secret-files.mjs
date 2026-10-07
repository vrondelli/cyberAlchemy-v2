import {open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {isAbsolute} from 'node:path';

/** Resolve only declared inputs; values never enter process.env or diagnostics. */
export async function resolveSecretFiles(input,{env=process.env,role='web'}={}){
  const refs=[
    input?.payments?.stripe?.secretEnv,input?.payments?.mercadopago?.accessTokenEnv,
    input?.payments?.paypal?.clientIdEnv,input?.payments?.paypal?.secretEnv,
    ...(role==='web'?[input?.auth?.secretEnv,input?.auth?.databaseUrlEnv,input?.auth?.keyEnv,
      input?.webhooks?.stripe?.secretEnv,input?.webhooks?.mercadopago?.secretEnv]:[]),
  ];
  const resolved={},issues=[];
  for(const name of new Set(refs)){
    if(typeof name!=='string'||!/^KELD_[A-Z0-9_]+$/.test(name))continue;
    const path=env[name+'_FILE'],value=env[name];
    if(path!==undefined&&value!==undefined){issues.push({path:name,code:'ambiguous-secret-source'});continue;}
    if(path===undefined){
      if(input?.listener?.mode==='proxy-http')issues.push({path:name,code:'secret-file-required'});
      else if(value!==undefined)resolved[name]=value;
      continue;
    }
    let handle;
    try{
      if(typeof path!=='string'||!isAbsolute(path))throw Error();
      handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
      const info=await handle.stat();
      if(!info.isFile()||info.size<1||info.size>16384||(info.mode&0o077)!==0)throw Error();
      const buffer=Buffer.alloc(16385);const {bytesRead}=await handle.read(buffer,0,buffer.length,0);
      if(bytesRead!==info.size)throw Error();
      const text=new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,bytesRead));buffer.fill(0);
      if(!text||/[\u0000\r\n]/.test(text))throw Error();
      resolved[name]=text;
    }catch{issues.push({path:name,code:'private-secret-file-required'});}
    finally{await handle?.close();}
  }
  return {env:resolved,issues};
}
