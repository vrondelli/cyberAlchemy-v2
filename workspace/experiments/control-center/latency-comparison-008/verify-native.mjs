import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=fileURLToPath(new URL('./',import.meta.url));
const repo=fileURLToPath(new URL('../../../../../',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const inputBytes=readFileSync(here+'build-inputs.json');
const inputs=JSON.parse(inputBytes),checks=[];
const check=(id,fn)=>{try{if(!fn())throw Error('identity mismatch');checks.push({id,status:'PASS'});}catch(e){checks.push({id,status:e.code==='ENOENT'?'not_evaluable':'FAIL',reason:e.message});}};
check('selected-build-inputs',()=>inputs.sources.every(s=>sha(readFileSync(repo+s.path))===s.sha256));
for(const arm of ['uninstrumented']){
  check(arm+'-native-artifact',()=>{
    const identity=JSON.parse(readFileSync(here+'native/'+arm+'/identity.json'));
    if(identity.arm!==arm||identity.authority_effect!=='none'||identity.build_inputs_sha256!==sha(inputBytes)
      ||identity.build_id!==sha(JSON.stringify({arm,identity:inputs})))return false;
    if(identity.binary_sha256!==sha(readFileSync(here+'native/'+arm+'/essays-desktop')))return false;
    if(identity.cargo_manifest_sha256!==sha(readFileSync(here+'native/source/Cargo.toml')))return false;
    if(identity.tauri_config?.build?.frontendDist!==fileURLToPath(new URL('../latency-comparison-005/dist/uninstrumented/',import.meta.url)))return false;
    const walk=(dir,rel='')=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name,rel+e.name+'/'):[rel+e.name]);
    if(JSON.stringify(walk(fileURLToPath(new URL('../latency-comparison-005/dist/uninstrumented/',import.meta.url))).sort())!==JSON.stringify(identity.frontend.map(f=>f.path).sort()))return false;
    return identity.frontend.every(f=>sha(readFileSync(fileURLToPath(new URL('../latency-comparison-005/dist/uninstrumented/',import.meta.url))+'/'+f.path))===f.sha256);
  });
}
console.log(JSON.stringify({ok:checks.every(c=>c.status==='PASS'),checks,
  running_process_attestation:'not_evaluable',host_qualification:'not_evaluable',registration_status:'incomplete',authority_effect:'none'},null,2));
if(checks.some(c=>c.status!=='PASS'))process.exitCode=1;
