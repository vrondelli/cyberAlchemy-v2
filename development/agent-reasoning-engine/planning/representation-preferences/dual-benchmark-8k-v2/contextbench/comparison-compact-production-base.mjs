// Exact production qualification; no automatic dispatch. Open questions: COMPARISON-PRODUCTION.md.
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync,lstatSync,realpathSync,mkdirSync} from 'node:fs';import {dirname,resolve,join} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {createComparisonGenerationProcess} from './comparison-compact-generation-process.mjs';
import {scoreComparisonCampaign} from './score-comparison-compact-campaign.mjs';
import {launchComparison} from './comparison-launcher-r3.mjs';
import {verifyComparisonSchedule} from './comparison-schedule.mjs';
import {verifyEvolutionRecord} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {credentials} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),need=(v,m)=>{if(!v)throw Error('comparison-production.'+m);};
const read=p=>JSON.parse(readFileSync(p)),dir=import.meta.dirname;
export const COMPARISON_GROWTH_BYTES=2*1024**3+416*1024**2;
const required=['comparison-compact-production-base.mjs','comparison-launcher-r3.mjs','comparison-compact-generation-process.mjs','comparison-compact-generation-worker.mjs','comparison-generation-storage-r2.mjs','comparison-output-guard.mjs','comparison-compact-campaign-runner.mjs','score-comparison-compact-campaign.mjs','comparison-score-summary-r2.mjs','packet-diversity-v1/score-native-bounded-v3.py'];
export function verifyComparisonProductionFreeze({manifest_path,manifest_sha256}){
 const bytes=readFileSync(manifest_path);need(hash(bytes)===manifest_sha256,'freeze-drift');const f=JSON.parse(bytes);
 need(f.schema==='are.comparison-production-freeze/v1'&&Array.isArray(f.files)&&f.files.length>0&&f.files.length<=2048,'freeze-shape');
 const files=new Map();for(const b of f.files){need(typeof b.path==='string'&&resolve(b.path)===b.path&&realpathSync(b.path)===b.path&&lstatSync(b.path).isFile()&&/^[a-f0-9]{64}$/.test(b.sha256)&&!files.has(b.path),'file-binding');need(hash(readFileSync(b.path))===b.sha256,'source-drift');files.set(b.path,b.sha256);}
 for(const p of [...required.map(p=>join(dir,p)),f.request?.sources?.config_path,f.request?.sources?.cohort_path,f.request?.credential_path,...Object.values(f.evidence??{})])need(files.has(p),'required-binding');
 need(typeof vm.SourceTextModule==='function','experimental-vm-modules-required');
 for(const path of files.keys())if(path.endsWith('.mjs'))for(const spec of new vm.SourceTextModule(readFileSync(path,'utf8'),{identifier:path}).dependencySpecifiers){if(spec.startsWith('node:'))continue;need(spec.startsWith('.')&&files.has(resolve(dirname(path),spec)),'unbound-static-dependency');}
 const config=read(f.request.sources.config_path);for(const p of [config.scorer,config.source_manifest])need(files.has(p),'bound-evaluator');
 need(f.request&&f.evidence&&Object.keys(f.evidence).sort().join(',')==='amendment,capacity,request_qualification','evidence-shape');
 verifyComparisonSchedule({schedule:f.request.schedule,...f.request.sources});need(f.generation_deadline_ms===150*60*1000&&f.combined_growth_bytes===COMPARISON_GROWTH_BYTES,'fixed-envelope');
 for(const slot of f.request.schedule.slots)need(files.get(slot.task_path)===slot.task_sha256,'bound-task');
 return f;
}
export function verifyComparisonRequestQualification({qualification,schedule,files}){
 need(qualification?.schema==='are.comparison-request-qualification/v1'&&qualification.qualified===true&&qualification.model_calls===0&&qualification.schedule_sha256===schedule.schedule_sha256&&Array.isArray(qualification.rows)&&qualification.rows.length===12,'request-qualification');
 for(const [i,row]of qualification.rows.entries()){
  const slot=schedule.slots[i];need(row.slot_id===slot.slot_id&&row.task_sha256===slot.task_sha256&&row.cell_sha256===slot.cell_sha256,'qualification-slot');
  need(typeof row.prompt_path==='string'&&files.get(row.prompt_path)===row.prompt_sha256,'bound-prompt');const raw=readFileSync(row.prompt_path);need(hash(raw)===row.prompt_sha256,'prompt-drift');const prompt=JSON.parse(raw);
  need(prompt.model==='glm-5.3-flash'&&Array.isArray(prompt.messages)&&Array.isArray(prompt.tools),'prompt-shape');
  const receipt=row.receipt;need(receipt?.kind==='tokenizer'&&receipt.dispatched===true&&receipt.status===200&&Number.isSafeInteger(receipt.input_tokens)&&receipt.input_tokens>=0&&receipt.request_sha256===hash(stable({model:prompt.model,messages:prompt.messages,tools:prompt.tools})),'tokenizer-receipt');
  const projected=receipt.input_tokens+slot.cell.provider_profile.token_margin+slot.cell.limits.output_cap;
  need(Number.isSafeInteger(projected)&&projected<=8000&&row.projected_tokens===projected,'initial-request-window');
 }
 return {verified:true,requests:12,model_calls:0,scope:'Initial request per fixed slot; every later production request still requires native measured admission.'};
}
function gitProbe(task){
 const git=args=>execFileSync('git',['--no-optional-locks','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-C',task.repository_cache,...args],{encoding:'utf8',timeout:10000,maxBuffer:8*1024**2,env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_OPTIONAL_LOCKS:'0',GIT_NO_LAZY_FETCH:'1',GIT_ALLOW_PROTOCOL:'',GIT_TERMINAL_PROMPT:'0'}});
 need(git(['rev-parse','--verify',task.base_commit+'^{commit}']).trim()===task.base_commit,'source-commit');need(!git(['ls-tree','-r',task.base_commit]).split('\n').some(s=>/^(120000|160000) /.test(s)),'unsupported-source-entry');return true;
}
export function qualifyComparisonProduction(args,{host_guard=guardStorage,verify_source=gitProbe,verify_credential=credentials}={}){
 const f=verifyComparisonProductionFreeze(args),files=new Map(f.files.map(b=>[b.path,b.sha256])),request=f.request,config=read(request.sources.config_path),amendment=read(f.evidence.amendment),capacity=read(f.evidence.capacity);
 need(config.model==='glm-5.3-flash'&&config.tasks.length===4,'model-and-cohort');
 need(amendment.schema==='are.comparison-repair-amendment/v1'&&amendment.schedule_sha256===request.schedule.schedule_sha256&&amendment.records?.length===4,'native-amendment');
 for(const r of [...amendment.records,amendment.experiment])need(verifyEvolutionRecord(r).ok===true,'native-record');
 need(amendment.maximum_workers===2&&amendment.maximum_model_tokens===1152000&&amendment.experiment.success_criteria.alternative_each_task_perfect===true&&amendment.experiment.success_criteria.at_least_15_percent_savings_vs_current===true&&amendment.experiment.success_criteria.at_least_15_percent_savings_vs_minimal===true,'native-criteria');
 need(capacity.schema==='are.comparison-capacity-qualification/v1'&&capacity.successor_runs?.passed===true&&capacity.successor_entries?.passed===true&&capacity.successor_outcomes?.passed===true&&capacity.combined_growth_bytes===COMPARISON_GROWTH_BYTES,'capacity-qualification');
 const windows=verifyComparisonRequestQualification({qualification:read(f.evidence.request_qualification),schedule:request.schedule,files});
 for(const task of config.tasks){need(hash(readFileSync(task.task_path))===task.task_sha256,'task-drift');need(verify_source(task)===true,'source-qualification');}
 verify_credential(request.credential_path);
 const roots=[request.outcome_root,request.runs_root,request.metadata_root,request.source_root,f.score_root,f.supervision_root];const storage=roots.map(output=>host_guard({binding:request.binding,output,growth_reservation_bytes:COMPARISON_GROWTH_BYTES}));need(storage.every(r=>r?.admitted===true),'current-storage');
 return {admitted:true,manifest_sha256:args.manifest_sha256,windows,tasks:config.tasks.map(t=>t.id),storage,combined_growth_bytes:COMPARISON_GROWTH_BYTES,new_provider_calls:0};
}
export async function runComparisonProduction({manifest_path,manifest_sha256,review_path,signal},{qualify=qualifyComparisonProduction,launch=launchComparison,create_process=createComparisonGenerationProcess,evaluate=scoreComparisonCampaign}={}){
 const args={manifest_path,manifest_sha256},f=verifyComparisonProductionFreeze(args),review=read(review_path);
 need(review.approved===true&&review.live_execution_admitted===true&&review.manifest_sha256===manifest_sha256,'exact-live-review');
 // Qualification precedes directory creation; launcher then repeats it at its boundary.
 qualify(args);
 for(const p of [f.request.outcome_root,f.request.runs_root,f.request.metadata_root,f.score_root,f.supervision_root])mkdirSync(p,{recursive:true,mode:0o700});
 const processRun=create_process(),process_adapter={generate:async input=>{verifyComparisonProductionFreeze(args);return await processRun.generate(input);},settle:async input=>{const local=await processRun.settle(input);verifyComparisonProductionFreeze(args);return local;}};
 const score=async input=>{verifyComparisonProductionFreeze(args);const result=await evaluate(input);verifyComparisonProductionFreeze(args);return result;};
 return await launch({request:f.request,score_root:f.score_root,supervision_root:f.supervision_root,signal,deadline_ms:f.generation_deadline_ms,qualify:async({request})=>{assert.deepEqual(request,f.request);return qualify(args);}},{process_adapter,score});
}
