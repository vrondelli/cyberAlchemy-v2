import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {buildFreezePackage,buildDevelopmentSuccessorSourceClosure,dryRunExactTask,EXACT_TASK} from './g02-task2-qualification.mjs';

const root=resolve(fileURLToPath(new URL('../../../../../..',import.meta.url)));
const task='development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/full-cycle-80/snapshot/tasks/contextbench-2.json';

test('provider-free exact task-2 dry-run selects the additive G02 stack and exact budgets',()=>{
  const result=dryRunExactTask({repo_root:root});
  assert.equal(result.status,'qualified-provider-free');
  assert.deepEqual(result.task,{...EXACT_TASK,path:task});
  assert.equal(result.worker_binding.episode,'discovery-v1/episode-recovery-g02-v1.mjs');
  assert.equal(result.worker_binding.transport,'packet-diversity-v1/transport-bounded-g02-v1.mjs');
  assert.equal(result.budgets.maximum_tool_batch_corrections,1);
  assert.equal(result.budgets.maximum_calls,96);
  assert.equal(result.budgets.total_tokens,4000000);
  assert.equal(result.provider_calls,0);
  assert.equal(result.credentials_accessed,false);
  assert.equal(result.network_accessed,false);
  assert.equal(result.launch_enabled,false);
});

test('dry-run rejects task substitution before constructing a candidate',()=>{
  const temporary=mkdtempSync(join(tmpdir(),'g02-task-'));
  const bad=join(temporary,'task.json');
  const value=JSON.parse(readFileSync(join(root,task)));
  value.problem_statement+=' substituted';
  writeFileSync(bad,JSON.stringify(value));
  assert.throws(()=>dryRunExactTask({repo_root:root,task_path:bad}),/task-digest/);
});

test('freeze package binds runtime, Ajv, sources, policy, budgets and only waits for VPS qualification',()=>{
  const manifest=buildFreezePackage({repo_root:root});
  assert.equal(manifest.ajv.name,'ajv');
  assert.equal(manifest.ajv.version,'8.20.0');
  assert.match(manifest.runtime.node_exec_sha256,/^[a-f0-9]{64}$/);
  assert.ok(manifest.sources.length>6);
  assert.equal(manifest.source_entries.length,8);
  assert.ok(manifest.sources.every(row=>/^[a-f0-9]{64}$/.test(row.sha256)));
  assert.ok(manifest.source_entries.every(path=>manifest.sources.some(row=>row.path===path)));
  assert.ok(manifest.ajv.package_tree.file_count>1);
  assert.match(manifest.ajv.package_tree.tree_sha256,/^[a-f0-9]{64}$/);
  assert.deepEqual(manifest.response_policy.recoverable_tool_calls,{minimum:9,maximum:32});
  assert.equal(manifest.vps_profile.benchmark_ready,false);
  assert.deepEqual(manifest.vps_profile.missing_checks,['glm_profile','token_boundary','durable_accounting','benchmark_adapter']);
  assert.equal(manifest.launch.enabled,false);
  assert.deepEqual(manifest.launch.blocked_by,['vps-qualification-incomplete']);
  assert.equal(manifest.execution_mode,'development'); assert.equal(manifest.development_execution.prelaunch_authorization_required,false); assert.equal(manifest.development_execution.cryptographic_signatures_required,false);
  assert.equal(manifest.model_calls,0);
  assert.match(manifest.package_digest,/^[a-f0-9]{64}$/);
});

test('development successor closure has no reviewer verifier or trust registry gate',()=>{
  const predecessor=buildFreezePackage({repo_root:root}),successor=buildDevelopmentSuccessorSourceClosure({repo_root:root});
  assert.equal(predecessor.package_digest,'60f636fb13d46039088524d817f5eb0385b3dfa51a00a459006965fd68c0d3e8');
  assert.equal(successor.predecessor_package_digest,predecessor.package_digest);
  assert.equal(successor.final_successor_freeze_available,false);
  assert.equal(successor.prelaunch_authorization_required,false); assert.equal(successor.cryptographic_signatures_required,false);
  assert.ok(!successor.source_entries.some(path=>path.endsWith('/g02-vps-probe-adapter-v1.mjs')));
  assert.deepEqual(successor.missing,['live-vps-qualification']);
});

test('freeze output is exclusive and remains launch-disabled',()=>{
  const temporary=mkdtempSync(join(root,'.g02-freeze-test-'));
  const output=join(temporary,'FREEZE.json');
  try{
    const expected=buildFreezePackage({repo_root:root,output_path:output});
    assert.deepEqual(JSON.parse(readFileSync(output)),expected);
    assert.throws(()=>buildFreezePackage({repo_root:root,output_path:output}),/EEXIST/);
  }finally{rmSync(temporary,{recursive:true});}
});

test('predecessor worker and orchestrator remain separate from additive G02 imports',()=>{
  const predecessorWorker=readFileSync(join(root,'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-pilot-are-worker.mjs'),'utf8');
  const predecessorOrchestrator=readFileSync(join(root,'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-recovery-v2.mjs'),'utf8');
  assert.match(predecessorWorker,/transport-bounded-v3\.mjs/);
  assert.match(predecessorOrchestrator,/episode-recovery-v2\.mjs/);
  assert.doesNotMatch(predecessorWorker,/g02-v1/);
  assert.doesNotMatch(predecessorOrchestrator,/g02-v1/);
});

test('direct G02 worker launch is disabled before config, secret or provider access',()=>{
  const worker=join(root,'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-pilot-are-worker-g02-v1.mjs');
  const result=spawnSync(process.execPath,[worker,EXACT_TASK.id],{encoding:'utf8',env:{PATH:process.env.PATH}});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/direct-launch-disabled-use-development-wrapper/);
  assert.doesNotMatch(result.stderr,/PILOT-CONFIG|model_api_key|ENET|ECONN/);
});
