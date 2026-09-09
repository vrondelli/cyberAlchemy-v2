import {readFileSync,readdirSync,lstatSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {sha,loadInput} from './adapter.mjs';
import {buildView,renderHtml} from './view.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
function inventory(dir='') {
  return readdirSync(join(root,dir)).flatMap(name=>{
    const path=dir?dir+'/'+name:name;
    if(['candidate.json','EVIDENCE.json','latency-inspect-001/report.json','latency-inspect-001/progress.json','latency-inspect-001/view.html'].includes(path))return [];
    const stat=lstatSync(join(root,path));if(stat.isSymbolicLink())throw Error('owned-runtime.symlink-forbidden');
    return stat.isDirectory()?inventory(path):[path];
  });
}
export const sourcePaths=inventory().sort();
export function verifyCandidate(candidate,read=p=>readFileSync(join(root,p))) {
  const errors=[];
  if(candidate?.schema_version!=='workspace.research-candidate/v1'||candidate.status!=='candidate'||candidate.authority_effect!=='none'||candidate.approval!=='not-requested'
    ||candidate.closure_ceiling!=='selected-source-inventory-not-transitive-build-closure')errors.push('candidate-claims');
  if(JSON.stringify(candidate?.sources?.map(s=>s.path))!==JSON.stringify(sourcePaths))errors.push('source-coverage');
  for(const path of sourcePaths){try{if(sha(read(path))!==candidate?.sources?.find(s=>s.path===path)?.sha256)errors.push('source-drift:'+path);}catch{errors.push('source-missing:'+path);}}
  return {ok:errors.length===0,errors,authority_effect:'none'};
}
export function verifySaved() {
  const c=JSON.parse(readFileSync(new URL('./candidate.json',import.meta.url))),result=verifyCandidate(c);
  if(!result.ok)return result;
  const {registration,view}=buildView(loadInput());
  for(const [path,value]of [['registration.json',registration],['view.json',view]]){
    if(readFileSync(new URL(path,import.meta.url),'utf8')!==JSON.stringify(value,null,2)+'\n')result.errors.push('derived-drift:'+path);
  }
  if(readFileSync(new URL('./view.html',import.meta.url),'utf8')!==renderHtml(view))result.errors.push('derived-drift:view.html');
  return {...result,ok:result.errors.length===0,candidate_sha256:sha(readFileSync(new URL('./candidate.json',import.meta.url))),view_digest:view.view_digest};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  try{const r=verifySaved();console.log(JSON.stringify(r,null,2));process.exitCode=r.ok?0:1;}
  catch(e){console.log(JSON.stringify({ok:false,errors:[e.message]}));process.exitCode=1;}
}
