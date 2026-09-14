import {copyFileSync,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const freezeRef='agent-reasoning-engine/research/contextbench-v1/freeze-round23-execution.json';
const target='implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round23-preserved';
const originals=[
  'implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs',
  'implementation/agent-reasoning-engine/packages/coding-agent-runtime/test/context-recycling.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/external-context-v1/holdout-v1/transport.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/live-client.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/live-client.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/request-tokenizer-retry.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode-provenance.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode-terminal-submission.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/task-state.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/task-state.test.mjs',
  'implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/cli.mjs',
  'implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/cli-delivery.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/shared-prefix.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/shared-prefix.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-prefix-cell.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-branch-cell.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-shared-sequence.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/resume-shared-sequence.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/dispatch-validation.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/dispatch-validation.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/local-failure-ledger.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/local-failure-ledger.test.mjs',
];

mkdirSync(target,{recursive:true});
const frozen=JSON.parse(readFileSync(freezeRef)),frozenByPath=new Map(frozen.sources.map(item=>[resolve(item.path),item.sha256]));
const files=originals.map(original=>{
  const name=original.replaceAll('/','__'),destination=resolve(target,name);
  if(!existsSync(destination)){
    const frozenOriginal=original.endsWith('/delivery.mjs')||original.endsWith('/delivery.test.mjs');
    if(frozenOriginal)writeFileSync(destination,execFileSync('git',['show',`HEAD:${original}`]),{flag:'wx'});
    else copyFileSync(original,destination);
  }
  const bytes=readFileSync(destination),expected=frozenByPath.get(resolve(original));
  if(expected&&sha(bytes)!==expected)throw Error('round23.preserved-source-drift:'+original);
  return {path:`${target}/${name}`,original_path:resolve(original),preserved_path:destination,sha256:sha(bytes)};
});
const manifest={
  schema_version:'are.contextbench-preserved-runtime/v1',
  round:23,
  source_freeze_ref:freezeRef,
  source_freeze_sha256:sha(readFileSync(freezeRef)),
  files,
  purpose:'Replay the exact completed Round 23 runtime before changing terminal envelope acceptance, credential failure handling, or any later experiment variable.',
  authority_effect:'none',
};
const path=resolve(target,'runtime-manifest.json'),bytes=JSON.stringify(manifest,null,2)+'\n';
if(existsSync(path)){
  if(readFileSync(path,'utf8')!==bytes)throw Error('round23.manifest-drift');
}else writeFileSync(path,bytes,{flag:'wx'});
console.log(JSON.stringify({ok:true,files:files.length,manifest:path,sha256:sha(Buffer.from(bytes))}));
