import {readFileSync,writeFileSync,mkdirSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir,loadavg} from 'node:os';
import {createHash} from 'node:crypto';
import {measureExecutionReadiness} from '../../packages/coding-agent-runtime/execution-readiness.mjs';
import {createSopsAgeProcessSecretProvider} from '../../packages/coding-agent-runtime/sops-age-secret-provider.mjs';
import {createSecretProviderRegistry,createSecretReference} from '../../packages/coding-agent-runtime/secret-provider.mjs';
import {parseCredential} from '../../packages/coding-agent-runtime/glm-flash-v1/cli.mjs';
import {validatePublicCases} from '../../packages/coding-agent-runtime/public-case-validation.mjs';
import {publicCheckPlan} from './public-checks.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),here=dirname(fileURLToPath(import.meta.url));
const [credentialFile,outputArg]=process.argv.slice(2);if(!outputArg||process.argv.length!==4)throw Error('usage: credential-reference output-directory');
const output=resolve(outputArg);mkdirSync(output,{mode:0o700});
const save=(name,value)=>writeFileSync(join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
const c=parseCredential(JSON.parse(readFileSync(credentialFile,'utf8'))),project=fileURLToPath(new URL('../../../../secret-management',import.meta.url));
const provider=createSopsAgeProcessSecretProvider({...c,python_command:'/usr/bin/python3',project_root:project,timeout_ms:5000});
const registry=createSecretProviderRegistry({providers:[provider]}),ref=createSecretReference({provider_id:c.provider_id,locator:c.locator});
function files(root){return readdirSync(root,{withFileTypes:true}).flatMap(x=>x.isDirectory()&&x.name!=='__pycache__'?files(join(root,x.name)):x.isFile()&&x.name.endsWith('.py')?[join(root,x.name)]:[]);}
const paths=['execution-readiness-run.mjs','public-checks.mjs','../../packages/coding-agent-runtime/execution-readiness.mjs','../../packages/coding-agent-runtime/public-case-validation.mjs','../../packages/coding-agent-runtime/secret-provider.mjs','../../packages/coding-agent-runtime/sops-age-secret-provider.mjs'].map(x=>resolve(here,x));
const sources=[...paths,...files(join(project,'secret_management'))].map(path=>({path,sha256:hash(readFileSync(path))}));
const check=()=>{if(sources.some(s=>hash(readFileSync(s.path))!==s.sha256))throw Error('readiness-source-drift');};
save('manifest.json',{schema_version:'are.execution-readiness-diagnostic/v1',sources,node:process.versions.node,rounds:8,maximum_secret_consumptions:8,provider_calls:0,load_average:loadavg(),authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
const rounds=[];
for(let i=0;i<8;i++) {
 check();save(`started-${i}.json`,{index:i,started_at:new Date().toISOString(),authority_effect:'none'});
 const r=await measureExecutionReadiness({consume_secret:()=>registry.consume({secret_ref:ref,consumer_id:'glm-flash-transport',request_digest:hash(`execution-latency-30-readiness-${i}`),consumer(){}})});
 save(`round-${i}.json`,r);rounds.push(r);check();console.log(JSON.stringify({round:i,ready:r.ready,child_ms:r.children.map(x=>Math.round(x.elapsed_ms)),secret_ms:Math.round(r.secret.elapsed_ms??0),secret_reason:r.secret.reason}));
}
const validations=[];
if(rounds.every(r=>r.ready)) {
 const historical=join(here,'evidence/fixed-repeatability-2026-09-08/run'),old=JSON.parse(readFileSync(join(historical,'result.json')));
 for(const t of old.trials.filter(t=>t.gate)) {
  check();const trial=join(historical,`trial-${String(t.index).padStart(2,'0')}`),candidate=JSON.parse(readFileSync(join(trial,'candidate.json'))),task=JSON.parse(readFileSync(join(trial,'manifest.json'))).arms[0].task;
  if(candidate.expected_base_tree_sha256!==task.fixture_tree_sha256||candidate.changes.length!==1||candidate.changes[0].path!=='src/subject.mjs'||candidate.changes[0].expected_file_sha256!==task.fixture_files['src/subject.mjs'])throw Error('diagnostic-candidate-binding');
  const plan=publicCheckPlan(t.episode,join(here,'fixtures',t.episode,'cases.json'));if(plan.sources[0].sha256!==task.fixture_files['evidence/cases.json'])throw Error('diagnostic-evidence-binding');
  const root=mkdtempSync(join(tmpdir(),'are-readiness-validate-'));
  try {const subject=join(root,'subject.mjs');writeFileSync(subject,candidate.changes[0].utf8);validations.push({id:t.id,prior_repair:t.repair,plan,result:validatePublicCases({subject,plan,child_timeout_ms:5000,batch_timeout_ms:120000})});}
  finally {rmSync(root,{recursive:true,force:true});}
  check();console.log(JSON.stringify({id:t.id,passed:validations.at(-1).result.ok}));
 }
}
check();const failures=validations.flatMap(r=>r.result.results).filter(r=>!r.passed&&r.reason!=='output-mismatch');
save('result.json',{status:'COMPLETED',rounds,validations,ready_rounds:rounds.filter(r=>r.ready).length,validation_execution_failures:failures.length,target_met:rounds.every(r=>r.ready)&&validations.length===6&&failures.length===0&&validations.filter(r=>r.result.ok).length===4,provider_calls:0,authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
