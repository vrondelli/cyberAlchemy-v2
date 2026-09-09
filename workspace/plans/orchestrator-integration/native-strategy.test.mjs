// Open questions: PLAN.md.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {recordedNativeStrategy} from './native-strategy.mjs';
test('recorded native graph is bound to registry digest and exact task',()=>{
 const root=mkdtempSync('/tmp/graph-test-'),id='00000000-0000-4000-8000-000000000001',key='a'.repeat(64),task={task_id:'task',instruction:'Explain'},job={id,task,status:'succeeded'};
 try{
  assert.equal(recordedNativeStrategy(root,job),null);
  const dir=resolve(root,id,'orchestrator');mkdirSync(resolve(dir,'runs',key),{recursive:true});
  const graph={max_parallelism:1,nodes:[{contract:'are-codex-text/v1',depends_on:[],max_attempts:1,node_id:'text',role_id:'text-worker',static_input:{task}}]};
  const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
  const digest='sha256:'+createHash('sha256').update(JSON.stringify(canonical(graph))).digest('hex'),identity={semantic_work_id:'task'};
  writeFileSync(resolve(dir,'run-registry.json'),JSON.stringify({schema_version:'cav2-multi-run-registry/v1-candidate',runs:{[key]:{run_key:key,relative_root:'runs/'+key,identity,graph_digest:digest}}}));
  const path=resolve(dir,'runs',key,'run-manifest.json'),manifest={schema_version:'cav2-durable-run-manifest/v2-candidate',identity,graph,graph_digest:digest};
  writeFileSync(path,JSON.stringify(manifest));
  assert.equal(recordedNativeStrategy(root,job).nodes[0].node_id,'text');
  assert.throws(()=>recordedNativeStrategy(root,{...job,task:{...task,instruction:'Changed'}}));
  manifest.graph.nodes[0].max_attempts=4;writeFileSync(path,JSON.stringify(manifest));
  assert.throws(()=>recordedNativeStrategy(root,job),/GRAPH_DIGEST_MISMATCH/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
