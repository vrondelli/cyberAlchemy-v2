import {copyFileSync,existsSync,mkdirSync,readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const freezeRef='agent-reasoning-engine/research/contextbench-v1/freeze-round26-execution.json';
const target='implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round26-preserved';
const prior=JSON.parse(readFileSync('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round25-preserved/runtime-manifest.json'));
const freeze=JSON.parse(readFileSync(freezeRef));
const expected=new Map(freeze.sources.map(item=>[resolve(item.path),item.sha256]));
const candidates=[];
function walk(path){for(const name of readdirSync(path)){const item=resolve(path,name),stat=statSync(item);if(stat.isDirectory())walk(item);else candidates.push(item);}}
walk('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round25-preserved');

mkdirSync(target,{recursive:true});
const files=prior.files.map(item=>{
  const original=resolve(item.original_path),expectedSha=expected.get(original);if(!expectedSha)throw Error('round26.freeze-source-missing:'+original);
  const currentSha=sha(readFileSync(original));
  const source=currentSha===expectedSha?original:candidates.find(candidate=>sha(readFileSync(candidate))===expectedSha);
  if(!source)throw Error('round26.frozen-bytes-unrecoverable:'+original);
  const name=item.original_path.replace(resolve('.')+'/', '').replaceAll('/','__'),destination=resolve(target,name);
  if(!existsSync(destination))copyFileSync(source,destination);
  const bytes=readFileSync(destination);if(sha(bytes)!==expectedSha)throw Error('round26.preserve-integrity:'+original);
  return {path:`${target}/${name}`,original_path:original,preserved_path:destination,sha256:expectedSha,recovered_from:source};
});
const manifest={schema_version:'are.contextbench-preserved-runtime/v1',round:25,source_freeze_ref:freezeRef,source_freeze_sha256:sha(readFileSync(freezeRef)),files,purpose:'Replay and audit the exact stopped Round 26 branch runtime before timeout-continuation work.',authority_effect:'none'};
const path=resolve(target,'runtime-manifest.json'),bytes=JSON.stringify(manifest,null,2)+'\n';
if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round26.manifest-drift');}else writeFileSync(path,bytes,{flag:'wx'});
console.log(JSON.stringify({ok:true,files:files.length,recovered:files.filter(item=>item.recovered_from!==item.original_path).length,manifest:path,sha256:sha(Buffer.from(bytes))}));
