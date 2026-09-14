import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {cloneSharedPrefix,inspectSharedPrefix} from './shared-prefix.mjs';
import {stable} from './delivery.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');

function fixture(t){
  const root=mkdtempSync(join(tmpdir(),'are-shared-prefix-clone-')),prefix=join(root,'prefix'),state=join(prefix,'state');mkdirSync(state,{recursive:true});mkdirSync(join(prefix,'work'));mkdirSync(join(prefix,'base'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const continuation={schema_version:'are.contextbench-episode-continuation/v1',continuation_digest:'a'.repeat(64)};
  const boundary={generation:1,start_index:2,recycles:1,history_count:2,history_digest:'b'.repeat(64)};
  const result={status:'shared_prefix_ready',history:['a','b'],continuation,shared_prefix_boundary:boundary};
  const resultBytes=Buffer.from(JSON.stringify(result,null,2)+'\n');writeFileSync(join(prefix,'result.json'),resultBytes);
  writeFileSync(join(prefix,'completed.json'),JSON.stringify({status:'shared_prefix_ready',result_sha256:hash(resultBytes)}));
  writeFileSync(join(prefix,'events.jsonl'),'prefix event\n');writeFileSync(join(prefix,'started.json'),'{}');writeFileSync(join(prefix,'episode.json'),'{}');
  const checkpoint={phase:'idle',generation:1,start_index:2};writeFileSync(join(state,'checkpoint.json'),JSON.stringify(checkpoint));
  writeFileSync(join(state,'glm-transport-ledger.json'),JSON.stringify({phase:'idle'}));writeFileSync(join(prefix,'work','source.txt'),'prefix bytes');
  return {root,prefix};
}

test('clones an idle prefix exactly and isolates branch writes',t=>{
  const f=fixture(t),inspection=inspectSharedPrefix(f.prefix),control=join(f.root,'control'),state=join(f.root,'state');
  const controlAncestry=cloneSharedPrefix({prefix_root:f.prefix,out:control,branch_id:'control-1'}),stateAncestry=cloneSharedPrefix({prefix_root:f.prefix,out:state,branch_id:'state-1'});
  assert.equal(controlAncestry.prefix_tree_digest,inspection.tree_digest);assert.equal(stateAncestry.prefix_tree_digest,inspection.tree_digest);
  assert.equal(readFileSync(join(control,'work','source.txt'),'utf8'),'prefix bytes');assert.equal(readFileSync(join(state,'work','source.txt'),'utf8'),'prefix bytes');
  writeFileSync(join(control,'work','source.txt'),'control mutation');assert.equal(readFileSync(join(state,'work','source.txt'),'utf8'),'prefix bytes');assert.equal(readFileSync(join(f.prefix,'work','source.txt'),'utf8'),'prefix bytes');
  assert.equal(JSON.parse(readFileSync(join(control,'prefix-ancestry.json'))).continuation_digest,'a'.repeat(64));
});

test('rejects active, tampered and non-prefix roots',t=>{
  const f=fixture(t);writeFileSync(join(f.prefix,'state','writer.lock'),'');assert.throws(()=>inspectSharedPrefix(f.prefix),/writer-active/);rmSync(join(f.prefix,'state','writer.lock'));
  const completed=JSON.parse(readFileSync(join(f.prefix,'completed.json')));completed.result_sha256='0'.repeat(64);writeFileSync(join(f.prefix,'completed.json'),stable(completed));assert.throws(()=>inspectSharedPrefix(f.prefix),/result-integrity/);
  assert.throws(()=>cloneSharedPrefix({prefix_root:f.root,out:join(f.root,'bad'),branch_id:'bad'}),/result-missing/);
});
