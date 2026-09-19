// Exact tokenizer-only invocation. Open questions: COMPARISON-QUALIFICATION-LIVE.md.
import vm from 'node:vm';
import {readFileSync,lstatSync,realpathSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {runComparisonQualification} from './comparison-qualification-process.mjs';
import {verifyComparisonSchedule} from './comparison-schedule.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(v,m)=>{if(!v)throw Error('qualification-live.'+m);};
export function verifyQualificationFreeze(path,digest){
 const raw=readFileSync(path);need(hash(raw)===digest,'manifest-drift');const f=JSON.parse(raw);
 need(f.schema==='are.comparison-qualification-freeze/v1'&&f.deadline_ms===600000&&f.growth_reservation_bytes===2*1024**3+384*1024**2,'envelope');
 need(Array.isArray(f.files)&&f.files.length>0&&f.files.length<=2048,'files');
 const files=new Map();
 for(const b of f.files){need(resolve(b.path)===b.path&&realpathSync(b.path)===b.path&&lstatSync(b.path).isFile()&&!files.has(b.path),'file-identity');need(hash(readFileSync(b.path))===b.sha256,'source-drift');files.set(b.path,b.sha256);}
 need(typeof vm.SourceTextModule==='function','experimental-vm-modules-required');
 for(const path of files.keys())if(path.endsWith('.mjs'))for(const spec of new vm.SourceTextModule(readFileSync(path,'utf8'),{identifier:path}).dependencySpecifiers){
  if(spec.startsWith('node:'))continue;
  need(spec.startsWith('.')&&files.has(resolve(dirname(path),spec)),'static-dependency');
 }
 for(const name of ['run-comparison-qualification.mjs','comparison-qualification-process.mjs','comparison-qualification-worker.mjs','comparison-request-qualification-r3.mjs'])need(files.has(join(import.meta.dirname,name)),'entry-binding');
 const r=f.request;verifyComparisonSchedule({schedule:r.schedule,...r.sources});
 for(const path of [r.sources.config_path,r.sources.cohort_path,r.credential_path,r.binding.provenance.path])need(files.has(path),'request-binding');
 for(const slot of r.schedule.slots)need(files.get(slot.task_path)===slot.task_sha256,'task-binding');
 const roots=[r.outcome_root,r.runs_root,r.metadata_root,r.source_root,f.supervision_root];
 need(roots.every(p=>typeof p==='string'&&resolve(p)===p),'root-shape');
 need(roots.every((p,i)=>roots.every((q,j)=>i===j||p!==q&&!p.startsWith(q+'/')&&!q.startsWith(p+'/'))),'root-overlap');
 return f;
}
export async function executeQualification({manifest_path,manifest_sha256,review_path,signal}){
 const f=verifyQualificationFreeze(manifest_path,manifest_sha256),review=JSON.parse(readFileSync(review_path));
 need(review.approved===true&&review.live_execution_admitted===true&&review.manifest_sha256===manifest_sha256,'exact-review');
 need(signal instanceof AbortSignal&&!signal.aborted,'active-signal');
 const roots=[f.request.outcome_root,f.request.runs_root,f.request.metadata_root,f.request.source_root,f.supervision_root];
 for(const p of roots)need(!existsSync(p)&&realpathSync(dirname(p))===dirname(p),'fresh-canonical-roots');
 const admissions=roots.map(output=>guardStorage({binding:f.request.binding,output,growth_reservation_bytes:f.growth_reservation_bytes}));
 for(const p of roots.filter(p=>p!==f.request.source_root))mkdirSync(p,{mode:0o700});
 const stage_guard=createStageOutputGuard({root:f.supervision_root}),persistence=createStagePersistence({stage_root:f.supervision_root,stage_guard});
 persistence.writeJson(join(f.supervision_root,'PLAN.json'),{manifest_path,manifest_sha256,admissions,deadline_ms:f.deadline_ms,model_dispatch_enabled:false});
 let result;
 try{
  verifyQualificationFreeze(manifest_path,manifest_sha256);
  result=await runComparisonQualification({request:f.request,signal,deadline_ms:f.deadline_ms});
  verifyQualificationFreeze(manifest_path,manifest_sha256);
 }catch(error){result={qualified:false,status:'incomplete',error:String(error.message),evidence:error.result??result??null};}
 try{persistence.writeJson(join(f.supervision_root,'RESULTS.json'),result,{final:true});}
 catch(error){error.result={...result,qualified:false,status:'incomplete',persistence_failure:String(error.message)};throw error;}
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [mode,manifest_path,manifest_sha256,review_path]=process.argv.slice(2);
 if(mode==='check'){const f=verifyQualificationFreeze(manifest_path,manifest_sha256);console.log(JSON.stringify({verified:true,files:f.files.length,model_dispatch_enabled:false}));}
 else if(mode==='run'){
  const controller=new AbortController();process.on('SIGTERM',()=>controller.abort());process.on('SIGINT',()=>controller.abort());
  try{const result=await executeQualification({manifest_path,manifest_sha256,review_path,signal:controller.signal});console.log(JSON.stringify({qualified:result.qualified,supervision_root:JSON.parse(readFileSync(manifest_path)).supervision_root}));process.exitCode=result.qualified?0:2;}
  catch(error){console.error(String(error.message));process.exitCode=2;}
 }else throw Error('qualification-live.mode');
}
