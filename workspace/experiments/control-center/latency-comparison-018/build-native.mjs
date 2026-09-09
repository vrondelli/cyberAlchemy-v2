import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,readdirSync,mkdirSync,copyFileSync,constants,openSync,closeSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {relative} from 'node:path';

const here=fileURLToPath(new URL('./',import.meta.url));
const repo=fileURLToPath(new URL('../../../../../',import.meta.url));
const runtime=repo+'cyberAlchemy-v2/workspace/runtime/';
const library=repo+'cyberAlchemy-v2/essays/development/agent-runtime/implementation/';
const desktop=library+'desktop/src-tauri/';
const native=here+'native/';
const cache=here+'../latency-comparison-017/native/target/';
const sha=b=>createHash('sha256').update(b).digest('hex');
const walk=dir=>readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
const files=[...walk(runtime+'src'),...walk(repo+'cyberAlchemy-v2/essays/runtime/src'),
  ...walk(library+'src'),...walk(desktop+'src'),...walk(desktop+'capabilities'),...walk(desktop+'wdio'),...walk(desktop+'icons'),
  ...['Cargo.toml','Cargo.lock','build.rs','tauri.conf.json'].map(p=>desktop+p),library+'Cargo.toml',
  runtime+'package.json',runtime+'pnpm-lock.yaml',runtime+'wdio/vite.config.mjs',runtime+'wdio/frontend-bootstrap.ts',runtime+'index.html',
  runtime+'performance-budgets.candidate.json',here+'build-native.mjs'];
const snapshot=()=>files.map(path=>({path:relative(repo,path),sha256:sha(readFileSync(path))}));
const inputs=snapshot();
mkdirSync(native); // Create-only; never overwrite a previous candidate or failed build.
const save=(name,value)=>writeFileSync(native+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
save('inputs.json',{sources:inputs,authority_effect:'none'});
function run(command,args,cwd,env,log){
  const fd=openSync(native+log,'wx');
  try {
    const result=spawnSync(command,args,{cwd,env:{...process.env,...env},stdio:['ignore',fd,fd]});
    if(result.error||result.status!==0)throw Error('build-failed:'+log+':'+(result.error?.message??result.status));
  } finally {closeSync(fd);}
}
console.log('Building fresh WDIO frontend: '+native+'frontend.log');
run(process.execPath,[runtime+'node_modules/vite/bin/vite.js','build','--config','wdio/vite.config.mjs','--outDir',native+'frontend'],runtime,{},'frontend.log');
const frontend=walk(native+'frontend').map(path=>({path:relative(native,path),sha256:sha(readFileSync(path))}));
const config={build:{frontendDist:native+'frontend'}};
console.log('Building isolated native candidate: '+native+'cargo.log');
run('cargo',['build','--offline','--locked','--features','wdio','-j','2','--manifest-path',desktop+'Cargo.toml'],desktop,
  {CARGO_TARGET_DIR:cache,TAURI_CONFIG:JSON.stringify(config)},'cargo.log');
if(JSON.stringify(snapshot())!==JSON.stringify(inputs))throw Error('source-drift-during-build');
for(const entry of frontend)if(sha(readFileSync(native+entry.path))!==entry.sha256)throw Error('frontend-drift-during-build');
mkdirSync(native+'artifact');
const binary=native+'artifact/essays-desktop';
copyFileSync(cache+'debug/essays-desktop',binary,constants.COPYFILE_EXCL);
save('identity.json',{
  schema_version:'workspace.local-native-candidate/v1',candidate_id:'WLC-018',
  binary:relative(repo,binary),binary_sha256:sha(readFileSync(binary)),
  inputs_sha256:sha(readFileSync(native+'inputs.json')),frontend,tauri_config:config,
  node:process.version,rustc:spawnSync('rustc',['--version'],{encoding:'utf8'}).stdout.trim(),
  predecessor_identity_sha256:sha(readFileSync(here+'../latency-comparison-017/native/identity.json')),
  claim_ceiling:'Selected-input local build only; not hermetic transitive closure, implementation conformance or approval',authority_effect:'none',
});
console.log('Built candidate '+binary);
