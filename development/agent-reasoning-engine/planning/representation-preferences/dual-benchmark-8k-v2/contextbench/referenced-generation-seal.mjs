// Reference-only final evidence; no model/provider calls. Open questions: REFERENCED-GENERATION-SEAL.md.
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute,sep,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(v,m)=>{if(!v)throw Error('reference-seal.'+m);};
const schema='are.referenced-generation-seal/v1';
function source(root,path){
 need(typeof path==='string'&&!isAbsolute(path)&&path.length>0,'relative-source');
 const base=resolve(root);need(realpathSync(base)===base,'canonical-root');
 const full=resolve(base,path),part=relative(base,full);need(part===path&&part!=='..'&&!part.startsWith('..'+sep)&&part!=='','source-escape');
 let current=base;for(const bit of part.split(sep)){current=join(current,bit);need(!lstatSync(current).isSymbolicLink(),'source-symlink');}
 need(lstatSync(full).isFile(),'source-not-file');return full;
}
function readSlots({root,slots,validate}){
 need(Array.isArray(slots)&&slots.length>0&&typeof validate==='function','slots-and-validator');
 need(new Set(slots.map(s=>s.slot_id)).size===slots.length&&new Set(slots.map(s=>s.path)).size===slots.length,'duplicate-slot-or-path');
 return slots.map(s=>{
  need(typeof s.slot_id==='string'&&s.slot_id.length>0&&/^[a-f0-9]{64}$/.test(s.sha256),'slot-binding');
  const bytes=readFileSync(source(root,s.path));need(hash(bytes)===s.sha256,'source-drift');if(s.bytes!==undefined)need(bytes.length===s.bytes,'byte-count');
  const result=JSON.parse(bytes);need(validate({slot_id:s.slot_id,result})===true,'slot-validation');
  return {slot_id:s.slot_id,result,reference:{slot_id:s.slot_id,path:s.path,sha256:s.sha256,bytes:bytes.length}};
 });
}
export function createReferencedSeal({root,slots,validate,summarize,maximum_bytes=8388608}){
 need(typeof summarize==='function'&&Number.isSafeInteger(maximum_bytes)&&maximum_bytes>0&&maximum_bytes<=8388608,'summary-and-cap');
 const rows=readSlots({root,slots,validate}),summary=summarize(rows.map(({slot_id,result})=>({slot_id,result})));
 need(summary&&typeof summary==='object'&&!Array.isArray(summary),'summary-object');
 assert.deepEqual(JSON.parse(stable(summary)),summary,'summary must roundtrip without data loss');
 const body={schema,slots:rows.map(r=>r.reference),summary,authority_effect:'none'};
 const seal={...body,seal_digest:hash(stable(body))};need(Buffer.byteLength(stable(seal))<=maximum_bytes,'final-size-cap');return seal;
}
export function hydrateReferencedSeal({root,seal,expected_slots,validate,summarize}){
 need(seal&&Object.keys(seal).sort().join(',')==='authority_effect,schema,seal_digest,slots,summary'&&seal.schema===schema&&seal.authority_effect==='none','envelope');
 const {seal_digest,...body}=seal;need(hash(stable(body))===seal_digest,'seal-integrity');
 need(Array.isArray(expected_slots),'expected-slots');assert.deepEqual(seal.slots.map(({slot_id,path,sha256})=>({slot_id,path,sha256})),expected_slots.map(({slot_id,path,sha256})=>({slot_id,path,sha256})),'exact fixed slot bindings');
 const rebuilt=createReferencedSeal({root,slots:seal.slots,validate,summarize});assert.deepEqual(rebuilt,seal,'summary and source reconciliation');
 return readSlots({root,slots:seal.slots,validate}).map(({slot_id,result})=>({slot_id,result}));
}
