import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,symlinkSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {createReferencedSeal,hydrateReferencedSeal} from './referenced-generation-seal.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const validate=({slot_id,result})=>result.slot_id===slot_id&&Number.isSafeInteger(result.tokens)&&result.tokens>=0;
const summarize=rows=>({slots:rows.length,tokens:rows.reduce((n,r)=>n+r.result.tokens,0)});
test('16large persisted results seal within final reserve and hydrate losslessly',()=>{
 const root=mkdtempSync(join(tmpdir(),'reference-seal-'));try{
  const guard=createStageOutputGuard({root}),persistence=createStagePersistence({stage_guard:guard,stage_root:root}),slots=[];
  for(let i=0;i<16;i++){const path='slot'+i+'.json',slot_id='s'+i,result={slot_id,tokens:i+1,payload:'x'.repeat(800000)};persistence.writeJson(join(root,path),result);slots.push({slot_id,path,sha256:hash(readFileSync(join(root,path)))});}
  const args={root,slots,validate,summarize},seal=createReferencedSeal(args);assert.ok(slots.reduce((n,s)=>n+readFileSync(join(root,s.path)).length,0)>8388608);assert.ok(JSON.stringify(seal).length<8192);
  persistence.writeJson(join(root,'GENERATION-SEAL.json'),seal,{final:true});const restored=hydrateReferencedSeal({...args,seal,expected_slots:slots});assert.equal(restored.length,16);assert.equal(restored[15].result.payload.length,800000);assert.deepEqual(seal.summary,{slots:16,tokens:136});
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('source tampering, wrong fixed identities and duplicate slots are rejected',()=>{
 const root=mkdtempSync(join(tmpdir(),'reference-seal-'));try{
  const raw=JSON.stringify({slot_id:'a',tokens:1});writeFileSync(join(root,'a.json'),raw);const slots=[{slot_id:'a',path:'a.json',sha256:hash(raw)}],args={root,slots,validate,summarize},seal=createReferencedSeal(args);
  assert.throws(()=>createReferencedSeal({...args,slots:[...slots,...slots]}),/duplicate/);
  assert.throws(()=>hydrateReferencedSeal({...args,seal,expected_slots:[{...slots[0],slot_id:'b'}]}));
  assert.throws(()=>createReferencedSeal({...args,validate:()=>false}),/validation/);
  writeFileSync(join(root,'a.json'),raw.replace(':1',':2'));assert.throws(()=>hydrateReferencedSeal({...args,seal,expected_slots:slots}),/drift/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('path escape, symlink and oversized summary fail before final persistence',()=>{
 const root=mkdtempSync(join(tmpdir(),'reference-seal-'));try{
  const raw=JSON.stringify({slot_id:'a',tokens:1});writeFileSync(join(root,'a.json'),raw);symlinkSync(join(root,'a.json'),join(root,'link.json'));const slot={slot_id:'a',path:'a.json',sha256:hash(raw)},args={root,slots:[slot],validate,summarize};
  for(const path of ['../a.json','link.json'])assert.throws(()=>createReferencedSeal({...args,slots:[{...slot,path}]}),/escape|symlink/);
  assert.throws(()=>createReferencedSeal({...args,maximum_bytes:100}),/size-cap/);
  assert.throws(()=>createReferencedSeal({...args,summarize:()=>({tokens:NaN})}),/roundtrip/);
  const seal=createReferencedSeal(args);seal.summary.tokens=99;assert.throws(()=>hydrateReferencedSeal({...args,seal,expected_slots:[slot]}),/integrity/);
  const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);const {seal_digest,...body}=seal;seal.seal_digest=hash(stable(body));assert.throws(()=>hydrateReferencedSeal({...args,seal,expected_slots:[slot]}),/reconciliation/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
