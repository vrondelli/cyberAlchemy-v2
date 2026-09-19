// Prospective writer admission only. Open questions: STAGE-OUTPUT-GUARD.md.
import {lstatSync,readdirSync,realpathSync,statfsSync} from 'node:fs';
import {resolve,relative,join,dirname,sep} from 'node:path';
export const MAXIMUM_STAGE_BYTES=32*1024**2,FINAL_STAGE_RESERVE_BYTES=8*1024**2;
const reject=(reason,details={})=>{throw Object.assign(new Error('stage-output.'+reason),{code:'STAGE_OUTPUT_REJECTED',...details});};
const need=(value,reason)=>{if(!value)reject(reason);};
const integer=n=>Number.isSafeInteger(n)&&n>=0;
/** Caller must supply exact upper-bound UTF8 bytes and route ALL stage writers here. */
export function createStageOutputGuard({root,deps={},maximum_bytes=MAXIMUM_STAGE_BYTES,final_reserve_bytes=FINAL_STAGE_RESERVE_BYTES}){
 need(integer(maximum_bytes)&&maximum_bytes>=MAXIMUM_STAGE_BYTES&&maximum_bytes<=1024**3&&integer(final_reserve_bytes)&&final_reserve_bytes>=FINAL_STAGE_RESERVE_BYTES&&final_reserve_bytes<maximum_bytes,'capacity-policy');
 const io={lstat:lstatSync,readdir:readdirSync,realpath:realpathSync,statfs:statfsSync,...deps};root=resolve(root);
 need(io.realpath(root)===root,'canonical-root');need(io.lstat(root).isDirectory()&&!io.lstat(root).isSymbolicLink(),'root-directory');
 const block=Number(io.statfs(root).bsize);need(integer(block)&&block>0,'allocation-unit');const allocation=Math.max(4096,block),round=n=>Math.ceil(n/allocation)*allocation;
 const held=new Map(),activePaths=new Set();let next=0,poisoned=false,finalPhase=false;
 const stat=path=>{try{return io.lstat(path);}catch(error){if(error.code==='ENOENT')return null;throw error;}};
 const checked=s=>{need(!s.isSymbolicLink()&&(s.isFile()||s.isDirectory()),'regular-files-only');need(integer(s.size)&&integer(s.blocks),'file-size');return Math.max(s.size,s.blocks*512);};
 const inspect=()=>{need(io.realpath(root)===root,'root-drift');let bytes=0,entries=0;const walk=path=>{need(++entries<=4096,'entry-ceiling');const s=io.lstat(path);bytes+=checked(s);need(integer(bytes),'byte-overflow');if(s.isDirectory()){const names=io.readdir(path);for(const name of names){need(typeof name==='string'&&name!=='.'&&name!=='..'&&!name.includes('/')&&!name.includes('\\'),'entry-name');walk(join(path,name));}}};walk(root);return {bytes,entries};};
 const reserved=()=>[...held.values()].reduce((n,r)=>n+r.reserved_bytes,0);
 function destination(name){need(typeof name==='string'&&name.length>0&&!name.includes('\0')&&!name.includes('\\'),'path');need(!name.split('/').some(p=>p==='..'||p==='.'||p===''),'path-segments');const path=resolve(root,name),part=relative(root,path);need(part&&part!=='..'&&!part.startsWith('..'+sep)&&!part.startsWith(sep),'path-outside-stage');let cursor=root,missing=0;const missing_paths=[];for(const segment of part.split(sep).slice(0,-1)){cursor=join(cursor,segment);const s=stat(cursor);if(s){checked(s);need(s.isDirectory(),'parent-directory');}else{missing++;missing_paths.push(cursor);}}const current=stat(path);if(current){checked(current);need(current.isFile(),'target-file');}return {path,current,missing,missing_paths};}
 function reserve({path,bytes,operation='create',final=false,temporary_path}){
 need(!poisoned,'stage-poisoned');need(integer(bytes),'payload-byte-bound');need(['create','append','replace'].includes(operation),'write-operation');need(typeof final==='boolean','final-flag');need(final||!finalPhase,'ordinary-after-final-phase');if(final)need(held.size===0,'final-requires-drained-writers');const target=destination(path);need(!activePaths.has(target.path),'concurrent-same-path');
 if(operation==='create')need(!target.current,'exclusive-create');else need(target.current,'existing-write-target');
 let temporary=null;if(operation==='replace'){temporary=destination(temporary_path);need(!temporary.current&&temporary.path!==target.path&&!activePaths.has(temporary.path),'exclusive-temporary');need(dirname(temporary.path)===dirname(target.path),'same-directory-temporary');}else need(temporary_path===undefined,'unexpected-temporary');
 if(final)need(dirname(target.path)===root&&['GENERATION-SEAL.json','RESULTS.json','RESULTS-V2.json'].includes(path),'final-artifact-name');
 // Replacement retains old allocation while the full temporary file is written.
 // Append conservatively reserves all appended bytes plus metadata, without reclaim credit.
 const charge=round(bytes)+(target.missing+2)*allocation;need(integer(charge),'reservation-overflow');if(final)need(charge<=final_reserve_bytes,'final-reserve-limit');
 const entryPaths=[...target.missing_paths,...(!target.current?[target.path]:[]),...(temporary?[temporary.path]:[])],prospective=new Set([...held.values()].flatMap(r=>r.entry_paths).concat(entryPaths).filter(p=>!stat(p)));
 const before=inspect();need(before.entries+prospective.size<=(final?4096:4095),'prospective-entry-ceiling');const limit=final?maximum_bytes:maximum_bytes-final_reserve_bytes;need(before.bytes+reserved()+charge<=limit,'stage-byte-budget');if(final)finalPhase=true;const id=++next,receipt={id,entry_paths:Object.freeze(entryPaths),reserved_entries:entryPaths.length,path:target.path,operation,final,temporary_path:temporary?.path??null,payload_bytes:bytes,reserved_bytes:charge,allocation_unit:allocation,used_bytes:before.bytes,stage_limit:limit};held.set(id,receipt);activePaths.add(target.path);if(temporary)activePaths.add(temporary.path);
 const settle=()=>{need(held.has(id),'reservation-already-settled');held.delete(id);activePaths.delete(target.path);if(temporary)activePaths.delete(temporary.path);try{const after=inspect();need(after.bytes+reserved()<=maximum_bytes,'writer-exceeded-stage-budget');if(!final)need(after.bytes+reserved()<=maximum_bytes-final_reserve_bytes,'writer-consumed-final-reserve');return {...receipt,settled:true,used_bytes:after.bytes};}catch(error){poisoned=true;throw error;}};
 return Object.freeze({receipt:Object.freeze(receipt),complete:settle,cancel:settle});
 }
 return Object.freeze({reserve,snapshot:()=>({...inspect(),reserved_bytes:reserved(),pending_writes:held.size,poisoned,final_phase:finalPhase,reserved_entries:new Set([...held.values()].flatMap(r=>r.entry_paths).filter(p=>!stat(p))).size,maximum_bytes:maximum_bytes,ordinary_limit_bytes:maximum_bytes-final_reserve_bytes,final_reserve_bytes:final_reserve_bytes})});
}
