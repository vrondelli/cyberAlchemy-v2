import {copyFileSync,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const freezeRef='agent-reasoning-engine/research/contextbench-v1/freeze-round18-execution.json',target='implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round18-preserved';
const originals=[
  'implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs',
  'implementation/agent-reasoning-engine/packages/coding-agent-runtime/test/context-recycling.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/external-context-v1/holdout-v1/transport.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/live-client.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/live-client.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/request-tokenizer-retry.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/orchestrate.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/shared-prefix.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/shared-prefix.test.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-prefix-cell.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-branch-cell.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-shared-sequence.mjs',
];
mkdirSync(target,{recursive:true});const files=originals.map(original=>{const name=original.replaceAll('/','__'),destination=resolve(target,name),bytes=readFileSync(original);if(existsSync(destination)){if(!readFileSync(destination).equals(bytes))throw Error('round18.preservation-drift:'+original);}else copyFileSync(original,destination);return{path:`${target}/${name}`,original_path:resolve(original),preserved_path:destination,sha256:sha(bytes)};});
const manifest={schema_version:'are.contextbench-preserved-runtime/v1',round:18,source_freeze_ref:freezeRef,source_freeze_sha256:sha(readFileSync(freezeRef)),files,purpose:'Replay the exact stopped Round 18 runtime before implementing bounded local-failure isolation for later independent cells.',authority_effect:'none'},path=resolve(target,'runtime-manifest.json'),bytes=JSON.stringify(manifest,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round18.manifest-drift');}else writeFileSync(path,bytes,{flag:'wx'});console.log(JSON.stringify({ok:true,files:files.length,manifest:path,sha256:sha(Buffer.from(bytes))}));
