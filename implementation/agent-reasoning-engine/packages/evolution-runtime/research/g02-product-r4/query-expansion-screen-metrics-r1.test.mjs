// Synthetic labels only; zero benchmark/VPS/provider access.
// Open Questions: evidence/G02-QUERY-EXPANSION-SCREEN-R1.json.
import test from 'node:test';import assert from 'node:assert/strict';
import{normalizeGoldPath,goldFiles,observedFiles,pairLeadWidths,scoreFileAcquisition,verifyLeadSeal}from'./query-expansion-screen-metrics-r1.mjs';
import{createHash}from'node:crypto';
test('native Gold file normalization and init/add fallback',()=>{
 for(const[p,q]of [['/testbed/a.py','a.py'],['/workspace/repo/a.py','a.py'],['./a.py','a.py'],['a\\b.py','a/b.py'],['///a.py','a.py']])assert.equal(normalizeGoldPath(p),q);
 assert.deepEqual(goldFiles({gold_ctx:[{file:'./a.py'},{file:'a.py'}]}),['a.py']);
 assert.deepEqual(goldFiles({init_ctx:[{file:'a.py'}],add_ctx:[{file:'b.py'}],gold_ctx:[{file:'ignored.py'}]}),['a.py','b.py']);
});
test('observed baseline includes all trajectory files and spans, not just final selection',()=>{
 assert.deepEqual(observedFiles({traj_data:{pred_steps:[{files:['a.py'],spans:{'b.py':[]}}],pred_files:['c.py'],pred_spans:{'d.py':[]}}}),['a.py','b.py','c.py','d.py']);
});
test('nonempty paired widths match; missing slots remain visible',()=>{
 const lead=(path,start_line,end_line)=>({path,start_line,end_line});
 const r=pairLeadWidths([lead('t.py',10,26)],[lead('c.py',1,8)]);
 assert.equal(r.treatment[0].end_line,17);assert.equal(r.control[0].end_line,8);
 assert.deepEqual(r.treatment.slice(1),[null,null]);assert.deepEqual(r.control.slice(1),[null,null]);
});
test('deduplicates file hits and penalizes missing proposals in all allocated slots',()=>{
 const r=scoreFileAcquisition({referenceFiles:['a.py','b.py'],observed:[],
  treatment:[{path:'a.py'},{path:'a.py'},null],control:[{path:'other.py'},null,null]});
 assert.equal(r.treatment.hit_count,1);assert.equal(r.treatment.allocated_slots,3);
 assert.equal(r.treatment.reference_file_coverage_gain,.5);assert.equal(r.control.hit_count,0);
});
test('already observed files cannot be credited as new acquisition',()=>{
 assert.throws(()=>scoreFileAcquisition({referenceFiles:['a.py'],observed:['a.py'],
  treatment:[{path:'a.py'},null,null],control:[null,null,null]}),/not-novel/);
});
test('all12 lead identities and digests must verify before any label callback',()=>{
 const cases=Array.from({length:12},(_,i)=>({pair:'case-'+i,instance_id:'instance-'+i}));
 const bytes=new Map(cases.map(c=>[c.pair,Buffer.from(JSON.stringify({...c,treatment:[null,null,null],control:[null,null,null]}))]));
 const seal={rows:cases.map(c=>({pair:c.pair,leads_sha256:createHash('sha256').update(bytes.get(c.pair)).digest('hex')}))};
 assert.equal(verifyLeadSeal({cases,seal,readLeadBytes:p=>bytes.get(p)}).length,12);
 let labels=0;bytes.set(cases[11].pair,Buffer.from('changed'));
 assert.throws(()=>{verifyLeadSeal({cases,seal,readLeadBytes:p=>bytes.get(p)});labels++;});assert.equal(labels,0);
 assert.throws(()=>verifyLeadSeal({cases,seal:{rows:seal.rows.slice(0,11)},readLeadBytes:p=>bytes.get(p)}));
});
