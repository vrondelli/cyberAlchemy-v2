import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync,existsSync,openSync,closeSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const here=fileURLToPath(new URL('./',import.meta.url));
const repo=fileURLToPath(new URL('../../../../../',import.meta.url));
const desktop=repo+'cyberAlchemy-v2/essays/development/agent-runtime/implementation/desktop/src-tauri/';
const library=repo+'cyberAlchemy-v2/essays/development/agent-runtime/implementation';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const inputs=JSON.parse(readFileSync(here+'build-inputs.json'));
function verifyInputs(){for(const s of inputs.sources)if(sha(readFileSync(repo+s.path))!==s.sha256)throw Error('build-input-drift:'+s.path);}
function run(command,args,env,log){
  const fd=openSync(log,'wx');
  const result=spawnSync(command,args,{cwd:here+'native/source',env:{...process.env,...env},stdio:['ignore',fd,fd]});
  closeSync(fd);
  if(result.error||result.status!==0)throw Error('build-failed:'+log+':'+(result.error?.message??result.status));
}
verifyInputs();
if(existsSync(here+'native'))throw Error('create-only native output already exists; preserve failed attempt and choose a new successor');
mkdirSync(here+'native/source',{recursive:true});
for(const path of ['Cargo.toml','Cargo.lock','build.rs','tauri.conf.json','src/main.rs','capabilities/default.json','wdio/capabilities/wdio-smoke.json','icons/icon.png','icons/icon.ico']){
  mkdirSync(resolve(here+'native/source',path,'..'),{recursive:true});
  copyFileSync(desktop+path,here+'native/source/'+path);
}
const manifest=readFileSync(here+'native/source/Cargo.toml','utf8');
if(!manifest.includes('path = "../.."'))throw Error('dependency-selector-drift');
writeFileSync(here+'native/source/Cargo.toml',manifest.replace('path = "../.."','path = '+JSON.stringify(library)));
for(const arm of ['uninstrumented']){
  const assets=fileURLToPath(new URL('../latency-comparison-005/dist/uninstrumented/',import.meta.url));
  if(!existsSync(assets+'/index.html'))throw Error('frontend-missing:'+arm);
  const env={CARGO_TARGET_DIR:here+'native/target',TAURI_CONFIG:JSON.stringify({build:{frontendDist:assets}})};
  console.log('Building isolated native '+arm+'; log '+here+'native/'+arm+'.log');
  run('cargo',['build','--offline','--locked','--features','wdio','-j','2'],env,here+'native/'+arm+'.log');
  verifyInputs();
  mkdirSync(here+'native/'+arm,{recursive:true});
  const binary=here+'native/'+arm+'/essays-desktop';
  copyFileSync(here+'native/target/debug/essays-desktop',binary);
  const walk=(dir,rel='')=>readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>
    e.isDirectory()?walk(dir+'/'+e.name,rel+e.name+'/'):[{path:rel+e.name,sha256:sha(readFileSync(dir+'/'+e.name))}]);
  writeFileSync(here+'native/'+arm+'/identity.json',JSON.stringify({
    schema_version:'workspace.native-variant-build/v1',arm,
    build_id:sha(JSON.stringify({arm,identity:inputs})),
    build_inputs_sha256:sha(readFileSync(here+'build-inputs.json')),
    binary_sha256:sha(readFileSync(binary)),frontend:walk(assets),tauri_config:JSON.parse(env.TAURI_CONFIG),
    cargo_manifest_sha256:sha(readFileSync(here+'native/source/Cargo.toml')),
    claim_ceiling:'Local build receipt, not independent running-process attestation or transitive hermetic build proof',
    authority_effect:'none'},null,2)+'\n');
  console.log('Built '+arm+' '+sha(readFileSync(binary)));
}
