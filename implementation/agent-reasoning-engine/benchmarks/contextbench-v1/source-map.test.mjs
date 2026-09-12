import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {unchangedLineMap,projectObservationsToBase} from './source-map.mjs';
import {stable,bodyForReceipt,bindDelivery} from './delivery.mjs';
import {exportCapturedContext} from './receipt-export.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
test('insertions and replacements get no base credit, unchanged lines shift exactly',()=>{
 assert.deepEqual([...unchangedLineMap('a\nb\nc\n','insert\na\nchanged\nc\n')],[[2,1],[4,3]]);
 assert.deepEqual([...unchangedLineMap('a\nb\nc\n','a\nc\n')],[[1,1],[2,3]]);
 assert.deepEqual([...unchangedLineMap('a\n','a\nnew\n')],[[1,1]]);
});
test('projects only observed unchanged fragments and records omitted changed lines',()=>{
 const root=mkdtempSync(join(tmpdir(),'are-cb-projection-'));
 try{
  writeFileSync(join(root,'a.py'),'a\nb\nc\n');const current='insert\na\nchanged\nc\n';
  const read={id:'r1',path:'a.py',source_sha256:hash(current),start_line:2,end_line:4,body:'a\nchanged\nc',first_confirmed_receipt:1};
  const snapshots=[{path:'a.py',source_sha256:hash(current),utf8:current}];
  const p=projectObservationsToBase([read],snapshots,root);
  assert.deepEqual(p.events.map(e=>[e.start_line,e.end_line,e.body]),[[1,1,'a'],[3,3,'c']]);
  assert.deepEqual(p.projections[0].unmapped_current_lines,[3]);
  assert.throws(()=>projectObservationsToBase([read],[],root),/snapshot-missing/);
  assert.throws(()=>projectObservationsToBase([read],[{...snapshots[0],utf8:'forged'}],root),/snapshot-digest/);
  assert.throws(()=>projectObservationsToBase([{...read,body:'unseen'}],snapshots,root),/body-mismatch/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('empty and fully replaced source have no unchanged lines',()=>{
 assert.equal(unchangedLineMap('','new\n').size,0);
 assert.equal(unchangedLineMap('old\n','new\n').size,0);
 assert.equal(unchangedLineMap('old\n','').size,0);
});
test('final selection with changed lines cannot improve precision through silent omission',()=>{
 const root=mkdtempSync(join(tmpdir(),'are-cb-score-guard-'));
 try{
  writeFileSync(join(root,'a.py'),'a\nb\n');const current='a\nnew\n';
  const prompt=stable({messages:[{role:'assistant',tool_calls:[{id:'r1',type:'function',function:{name:'read_file',arguments:stable({path:'a.py',start_line:1})}}]},
   {role:'tool',tool_call_id:'r1',content:stable({ok:true,output:{path:'a.py',start_line:1,end_line:2,utf8:'a\nnew',source_sha256:hash(current)}})}],tools:[]});
  const r={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:100,output_tokens:10};
  r.request_sha256=hash(stable(bodyForReceipt(prompt,r)));
  const input={captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[r],source_snapshots:[{path:'a.py',source_sha256:hash(current),utf8:current}],task:{instance_id:'fixture',repo_url:'https://example.invalid/repo',base_commit:'a'.repeat(40)}};
  const id=bindDelivery(input).read_observations[0].id;
  assert.throws(()=>exportCapturedContext({...input,final_read_ids:[id]},root),/final-context-unmapped-current-lines/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
