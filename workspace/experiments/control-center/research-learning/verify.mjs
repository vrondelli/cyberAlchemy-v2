import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {sha,loadInput} from './adapter.mjs';
import {buildView,renderHtml} from './view.mjs';
const root=fileURLToPath(new URL('../../../../../',import.meta.url));
const local='cyberAlchemy-v2/workspace/experiments/control-center/research-learning/';
const are='cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/';
export const sourcePaths=[
  ...['PLAN.md','profile.json','adapter.mjs','view.mjs','inspect.mjs','adapter.test.mjs','verify.mjs','input.json','registration.json','view.json','view.html','README.md'].map(p=>local+p),
  ...['evolution-runtime/index.mjs','evolution-runtime/src/research-dag.mjs','evolution-runtime/src/research-work.mjs',
    'evolution-runtime/src/benchmark-registration.mjs','evolution-runtime/ontology/research-learning-v1.json','request-intent-runtime/src/canonical.mjs'].map(p=>are+p),
  ...['analyze.mjs','collect.mjs','protocol.json'].map(p=>'cyberAlchemy-v2/workspace/experiments/control-center/native-test/campaign/'+p),
].sort();
const defaultRead=p=>readFileSync(resolve(root,p));
export function verifyCandidate(candidate,read=defaultRead) {
  const errors=[];
  if(candidate?.schema_version!=='workspace.research-candidate/v1'||candidate.status!=='candidate'||candidate.authority_effect!=='none'||candidate.approval!=='not-requested'
    ||candidate.closure_ceiling!=='selected-source-inventory-not-transitive-build-closure')errors.push('candidate-claims');
  if(JSON.stringify(candidate?.sources?.map(s=>s.path))!==JSON.stringify(sourcePaths))errors.push('source-coverage');
  for(const path of sourcePaths) {
    try {if(sha(read(path))!==candidate?.sources?.find(s=>s.path===path)?.sha256)errors.push('source-drift:'+path);}
    catch {errors.push('source-missing:'+path);}
  }
  return {ok:errors.length===0,errors,authority_effect:'none'};
}
export function verifySaved() {
  const candidate=JSON.parse(readFileSync(new URL('./candidate.json',import.meta.url)));
  const result=verifyCandidate(candidate);
  if(!result.ok)return result;
  const {registration,view}=buildView(loadInput());
  for(const [path,value] of [['registration.json',registration],['view.json',view]]) {
    if(readFileSync(new URL(path,import.meta.url),'utf8')!==JSON.stringify(value,null,2)+'\n')result.errors.push('derived-drift:'+path);
  }
  if(readFileSync(new URL('./view.html',import.meta.url),'utf8')!==renderHtml(view))result.errors.push('derived-drift:view.html');
  return {...result,ok:result.errors.length===0,candidate_sha256:sha(readFileSync(new URL('./candidate.json',import.meta.url))),
    view_digest:view.view_digest,research_nodes:view.research_dag.nodes.length,frontier:view.state.frontier};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
  try {const result=verifySaved();console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;}
  catch(error){console.log(JSON.stringify({ok:false,errors:[error.message],authority_effect:'none'}));process.exitCode=1;}
}
