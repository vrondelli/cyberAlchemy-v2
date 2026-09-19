// Dispose only completed experiment-owned clones. Open questions: STORAGE-RETENTION.md.
import {readFileSync,writeFileSync,existsSync,lstatSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {cleanupCellSourceTrees} from '../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs';
const dir=import.meta.dirname,read=p=>JSON.parse(readFileSync(p,'utf8'));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const save=(name,x)=>writeFileSync(join(dir,name),JSON.stringify(x,null,2)+'\n',{flag:'wx'});
const roots=['live/stage1','amended-live/stage2','amended-live/first-exposure-cb4'];
function inventory(){
 const cells=[];
 for(const part of roots){
  const base=join(dir,part),state=read(join(base,'checkpoint.json')),manifest=read(join(base,'manifest.json'));
  assert.ok(!existsSync(join(base,'.scheduler-lock')));
  assert.ok(Object.values(state.jobs).every(j=>!['pending','running'].includes(j.status)));
  assert.equal(state.accounting.unknown_reserved_tokens,0);
  for(const job of manifest.jobs.filter(j=>j.benchmark==='contextbench')){
   const pair=join(base,'pairs',job.id,'run');assert.ok(existsSync(join(pair,'scored-result.json')));
   for(const arm of ['control','treatment']){
    const cell=join(pair,arm);assert.ok(realpathSync(cell).startsWith(realpathSync(dir)+'/'));
    const result=join(cell,'result.json'),completed=read(join(cell,'completed.json'));
    assert.notEqual(completed.status,'shared_prefix_ready');assert.equal(completed.result_sha256,sha(result));
    const trees=['base','work'].map(n=>join(cell,n)).filter(existsSync);
    for(const tree of trees){const stat=lstatSync(tree);assert.ok(stat.isDirectory()&&!stat.isSymbolicLink());}
    cells.push({cell,result_sha256:sha(result),trees});
   }
  }
 }
 return cells;
}
const command=process.argv[2];
if(command==='plan'){
 const cells=inventory(),trees=cells.flatMap(c=>c.trees);
 const bytes=trees.length?Number(execFileSync('du',['-sc','-B1',...trees],{encoding:'utf8',timeout:60000}).trim().split('\n').at(-1).split(/\s+/)[0]):0;
 save('STORAGE-PLAN.json',{script_sha256:sha(new URL(import.meta.url)),cells,disposable_allocated_bytes:bytes,preserve:['receipts','snapshots','captures','responses','scoring results','native evaluator worktrees','shared caches','all original and amended results'],authority_effect:'none'});
 console.log(JSON.stringify({cells:cells.length,trees:trees.length,disposable_allocated_bytes:bytes}));
}else if(command==='apply'){
 const plan=read(join(dir,'STORAGE-PLAN.json'));assert.equal(plan.script_sha256,sha(new URL(import.meta.url)));
 assert.equal(read(join(dir,'FINAL-REVIEW.json')).complete,true);
 assert.equal(read(join(dir,'AMENDED-FINAL-REVIEW.json')).complete,true);
 assert.deepEqual(inventory(),plan.cells);
 for(const script of ['audit-postrun.mjs','audit-amended.mjs'])execFileSync(process.execPath,[join(dir,script),'--check'],{maxBuffer:8*1024*1024});
 const receipts=plan.cells.map(c=>cleanupCellSourceTrees({cellRoot:c.cell,requireCompleted:true}));
 for(const c of plan.cells){assert.equal(sha(join(c.cell,'result.json')),c.result_sha256);assert.ok(c.trees.every(p=>!existsSync(p)));}
 for(const script of ['audit-postrun.mjs','audit-amended.mjs'])execFileSync(process.execPath,[join(dir,script),'--check'],{maxBuffer:8*1024*1024});
 save('STORAGE-CLEANUP.json',{completed:true,plan_sha256:sha(join(dir,'STORAGE-PLAN.json')),removed_trees:receipts.reduce((n,r)=>n+r.removed_source_trees.length,0),removed_allocated_file_bytes:plan.disposable_allocated_bytes,receipts,post_cleanup_raw_audits_passed:true,windows_vhd_shrink_measured:false,authority_effect:'none',open_questions_ref:'STORAGE-RETENTION.md'});
 console.log(JSON.stringify({removed_trees:receipts.reduce((n,r)=>n+r.removed_source_trees.length,0),removed_allocated_file_bytes:plan.disposable_allocated_bytes,audits_passed:true}));
}else throw Error('Usage: storage-closeout.mjs plan|apply');
