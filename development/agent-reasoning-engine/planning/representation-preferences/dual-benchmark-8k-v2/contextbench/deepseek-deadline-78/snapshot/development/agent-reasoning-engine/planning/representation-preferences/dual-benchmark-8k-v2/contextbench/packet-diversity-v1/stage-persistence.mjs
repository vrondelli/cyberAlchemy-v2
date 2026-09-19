// Prospective native persistence integration. Open questions: STAGE-PERSISTENCE.md.
import * as fs from 'node:fs';import {resolve,relative,dirname,join,sep} from 'node:path';import {randomUUID} from 'node:crypto';
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
export function createStagePersistence({stage_guard,stage_root,io={}}){
 const disk={...fs,...io},root=resolve(stage_root);if(!stage_guard?.reserve||disk.realpathSync(root)!==root)throw Error('stage-persistence.root');
 const pathOf=path=>{const full=resolve(path),part=relative(root,full);if(!part||part==='..'||part.startsWith('..'+sep)||part.startsWith(sep))throw Error('stage-persistence.path');return {full,part};};
 const directorySync=path=>{const fd=disk.openSync(dirname(path),'r');try{disk.fsyncSync(fd);}finally{disk.closeSync(fd);}};
 function admitted(path,body,{operation='create',final=false,temporary=null}={},effect){
  const {full,part}=pathOf(path),leases=[];try{
   if(temporary&&operation==='create'){leases.push(stage_guard.reserve({path:part,bytes:0,operation:'create',final}));leases.push(stage_guard.reserve({path:pathOf(temporary).part,bytes:Buffer.byteLength(body),operation:'create'}));}
   else leases.push(stage_guard.reserve({path:part,bytes:Buffer.byteLength(body),operation,final,...(temporary?{temporary_path:pathOf(temporary).part}:{})}));
   disk.mkdirSync(dirname(full),{recursive:true,mode:0o700});effect(full,body);directorySync(full);
  }catch(error){for(const lease of leases.reverse())try{lease.cancel();}catch(settlement){error.persistence_settlement_error=String(settlement.message);}error.persistence_failure=true;throw error;}
  let failure;for(const lease of leases.reverse())try{lease.complete();}catch(error){error.persistence_failure=true;failure??=error;}if(failure)throw failure;
 }
 const write=(path,body,flags)=>{const fd=disk.openSync(path,flags,0o600);try{disk.writeFileSync(fd,body);disk.fsyncSync(fd);}finally{disk.closeSync(fd);}};
 const locks=new Set();
 return Object.freeze({
  writeJson(path,value,{final=false}={}){admitted(path,stable(value),{final},(p,b)=>write(p,b,'wx'));},
  append(path,text){if(typeof text!=='string')throw Error('stage-persistence.append-text');const present=disk.existsSync(path);admitted(path,text,{operation:present?'append':'create'},(p,b)=>write(p,b,present?'a':'wx'));},
  atomicJson(path,value){const full=pathOf(path).full,temporary=full+'.'+randomUUID()+'.tmp';admitted(full,stable(value),{operation:disk.existsSync(full)?'replace':'create',temporary},(p,b)=>{write(temporary,b,'wx');disk.renameSync(temporary,p);});},
  createLock(path){const full=pathOf(path).full;admitted(full,'',{},p=>write(p,'','wx'));locks.add(full);},
  removeLock(path){const full=pathOf(path).full;if(!locks.has(full))throw Error('stage-persistence.unowned-lock');let current=root;for(const piece of relative(root,full).split(sep)){current=join(current,piece);if(disk.lstatSync(current).isSymbolicLink())throw Error('stage-persistence.lock-symlink');}if(!disk.lstatSync(full).isFile())throw Error('stage-persistence.lock-kind');disk.unlinkSync(full);directorySync(full);locks.delete(full);}
 });
}
