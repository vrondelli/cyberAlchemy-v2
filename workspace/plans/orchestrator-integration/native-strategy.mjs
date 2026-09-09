// Recorded manifest projection, not graph synthesis. Open questions: PLAN.md.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,lstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const digest=value=>'sha256:'+createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
function read(path){assert.ok(!lstatSync(path).isSymbolicLink(),'GRAPH_SYMLINK');return JSON.parse(readFileSync(path));}
export function recordedNativeStrategy(state,job) {
 assert.match(job.id,/^[a-f0-9-]{36}$/);
 const root=resolve(state,job.id,'orchestrator'),registryPath=resolve(root,'run-registry.json');
 if(!existsSync(registryPath))return null; // The owner has not registered this preparing task yet.
 const registry=read(registryPath);assert.equal(registry.schema_version,'cav2-multi-run-registry/v1-candidate');
 const entries=Object.values(registry.runs).filter(entry=>entry.identity.semantic_work_id===job.task.task_id);
 assert.equal(entries.length,1,'GRAPH_IDENTITY_AMBIGUOUS');
 const entry=entries[0];assert.match(entry.run_key,/^[a-f0-9]{64}$/);assert.equal(entry.relative_root,'runs/'+entry.run_key);
 const manifest=read(resolve(root,entry.relative_root,'run-manifest.json'));
 assert.equal(manifest.schema_version,'cav2-durable-run-manifest/v2-candidate');assert.deepEqual(manifest.identity,entry.identity);
 assert.equal(manifest.graph_digest,entry.graph_digest);assert.equal(digest(manifest.graph),entry.graph_digest,'GRAPH_DIGEST_MISMATCH');
 const graph=manifest.graph;
 assert.equal(graph.nodes.length,1,'UNSUPPORTED_NATIVE_GRAPH');
 const node=graph.nodes[0];assert.equal(node.contract,'are-codex-text/v1');assert.deepEqual(node.static_input.task,job.task);
 assert.equal(node.node_id,'text');assert.equal(node.role_id,'text-worker');
 return {kind:'recorded-native-manifest',model:'gpt-5.6-luna',goal:job.task.instruction,max_parallelism:graph.max_parallelism,
  nodes:graph.nodes.map(node=>({node_id:node.node_id,role_id:node.role_id,stage:node.node_id,depends_on:node.depends_on,max_attempts:node.max_attempts,status:job.status==='succeeded'?'succeeded':job.status==='cancelled'?'cancelled':job.status==='running'?'running':'unknown'})),
  edges:graph.nodes.flatMap(node=>node.depends_on.map(parent=>({from:parent,to:node.node_id})))};
}
