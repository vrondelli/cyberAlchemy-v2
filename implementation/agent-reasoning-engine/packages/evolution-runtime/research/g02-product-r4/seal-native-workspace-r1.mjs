// Local construction receipt; no providers, gold or native quality scoring.
// Open Questions: evidence/G02-NATIVE-CANDIDATE-WORKSPACE-R1.md.
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {buildNativeWorkspaceOverlay,BASE_SHA} from './build-native-workspace-overlay-r1.mjs';
const here=dirname(fileURLToPath(import.meta.url)),project=resolve(here,'../../../../../..');
const root='/home/vlad_/are-benchmark-archive/g02-native-workspace-r1-20261006';
const base='/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002/pairs/01-pr11-mixed-01/raw/code/episode-recovery-v2.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
if(existsSync(root))throw Error('workspace-seal.output-exists');
const files=['candidate-workspace-r1.mjs','build-native-workspace-overlay-r1.mjs',
  'candidate-workspace-r1.test.mjs','native-workspace-overlay-r1.test.mjs','seal-native-workspace-r1.mjs'];
const captured=Object.fromEntries(files.map(f=>[f,readFileSync(join(here,f))]));
const protocol=readFileSync(join(here,'../../evidence/G02-NATIVE-CANDIDATE-WORKSPACE-R1.md'));
const overlay=Buffer.from(buildNativeWorkspaceOverlay(readFileSync(base,'utf8')));
const test=spawnSync(process.execPath,['--test',join(here,files[2]),join(here,files[3])],
  {encoding:'utf8',timeout:60000,maxBuffer:1024*1024});
if(test.status!==0||test.error)throw Error('workspace-seal.tests-failed:'+test.stdout+test.stderr);
for(const f of files)if(sha(readFileSync(join(here,f)))!==sha(captured[f]))throw Error('workspace-seal.source-drift');
const auxiliary=[
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/provenance-validator.mjs',
  'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/source-map.mjs',
  'implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs',
  'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/terminal-evidence.mjs',
  'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/full-cycle-79/snapshot/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/tool-batch-policy.mjs'
];
const receipt={schema_version:'are.g02-native-workspace-construction/v1',status:'local-functional-tests-passed',
  posture:'synthetic transport and source fixtures; no GLM or superiority evidence',node:process.version,
  archived_episode_sha256:BASE_SHA,overlay_sha256:sha(overlay),protocol_sha256:sha(protocol),
  source_sha256:Object.fromEntries(files.map(f=>[f,sha(captured[f])])),
  selected_local_auxiliary_sha256:Object.fromEntries(auxiliary.map(f=>[f,sha(readFileSync(join(project,f)))])),
  test_exit_code:test.status,test_stdout_sha256:sha(test.stdout),test_stderr_sha256:sha(test.stderr),
  unresolved:['VPS provider canary and full native scores not run','All native deployment dependencies not verified by local tests',
    'Resume deliberately unsupported','Semantic relevance of cited model judgments not proven'],
  open_questions_owner:'G02-NATIVE-CANDIDATE-WORKSPACE-R1.md'};
mkdirSync(root,{mode:0o700});
for(const [f,b] of Object.entries({...captured,'episode-workspace-r1.mjs':overlay,'PROTOCOL.md':protocol,
  'TEST-STDOUT.txt':Buffer.from(test.stdout),'TEST-STDERR.txt':Buffer.from(test.stderr),
  'CONSTRUCTION-SEAL.json':Buffer.from(JSON.stringify(receipt,null,2)+'\n')})){
  writeFileSync(join(root,f),b,{flag:'wx',mode:0o600});
}
console.log(JSON.stringify({status:receipt.status,root,seal_sha256:sha(readFileSync(join(root,'CONSTRUCTION-SEAL.json'))),
  overlay_sha256:receipt.overlay_sha256,source_sha256:receipt.source_sha256}));
