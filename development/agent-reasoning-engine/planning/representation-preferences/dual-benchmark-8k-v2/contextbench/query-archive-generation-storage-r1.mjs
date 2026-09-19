// Additive query-archive production candidate. Open questions: QUERY-ARCHIVE-CANDIDATE-R1.md.
// Candidate-only descendant of comparison-generation-storage-r2.mjs. Open questions: CANDIDATE-ONLY-PLAN.md.
// Exact twelve-slot storage admission. Open questions: COMPARISON-CAPACITY.md.
import {existsSync,lstatSync,readdirSync,realpathSync,readFileSync} from 'node:fs';
import {resolve,join,dirname,relative,sep} from 'node:path';
import {verifyQueryArchiveSchedule as verifyComparisonSchedule} from './query-archive-schedule-r1.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
import {createStageOutputGuard as largeGuard,MAXIMUM_STAGE_BYTES as RUN_BYTES} from './comparison-output-guard.mjs';
import {createStageOutputGuard as smallGuard,MAXIMUM_STAGE_BYTES as SMALL_BYTES} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
export const OUTCOME_BYTES=64*1024**2;
const SOURCE_BYTES=2*1024**3,need=(v,m)=>{if(!v)throw Error('comparison-storage.'+m);};
const within=(a,b)=>{const r=relative(a,b);return r===''||(r!=='..'&&!r.startsWith('..'+sep)&&!r.startsWith(sep));};
export function createComparisonGenerationStorage({schedule,sources,outcome_root,runs_root,metadata_root,source_root,binding},{host_guard=guardStorage}={}){
 verifyComparisonSchedule({schedule,...sources});
 const roots=[outcome_root,runs_root,metadata_root,source_root].map(resolvePath);
 function resolvePath(p){need(typeof p==='string'&&p.length>0,'root');return resolve(p);}
 need(roots.every((a,i)=>roots.every((b,j)=>i===j||(!within(a,b)&&!within(b,a)))),'root-overlap');
 for(const root of roots.slice(0,3))need(realpathSync(root)===root&&lstatSync(root).isDirectory()&&readdirSync(root).length===0,'fresh-evidence-root');
 const source=roots[3];need(!existsSync(source)&&realpathSync(dirname(source))===dirname(source),'fresh-canonical-source-parent');
 const config=JSON.parse(readFileSync(sources.config_path)),allowed=new Map(schedule.slots.map(s=>[String(s.sequence).padStart(2,'0'),{slot:s,task:config.tasks.find(t=>t.id===s.task_id)}]));
 const guards=[largeGuard({root:roots[0],maximum_bytes:OUTCOME_BYTES}),largeGuard({root:roots[1]}),smallGuard({root:roots[2]})];
 const persistences=guards.map((stage_guard,i)=>createStagePersistence({stage_root:roots[i],stage_guard}));
 let stopped=false;
 function sourceUsage(){
  if(!existsSync(source))return {bytes:0,entries:0};
  need(realpathSync(source)===source&&lstatSync(source).isDirectory(),'source-root');
  need(readdirSync(source).every(n=>allowed.has(n)),'unassigned-source');let bytes=0,entries=0;
  function walk(p){const s=lstatSync(p);need(++entries<=150000&&!s.isSymbolicLink()&&(s.isFile()||s.isDirectory()),'source-entry');bytes+=Math.max(s.size,s.blocks*512);need(Number.isSafeInteger(bytes)&&bytes<=SOURCE_BYTES,'source-budget');if(s.isDirectory())for(const n of readdirSync(p))walk(join(p,n));}
  walk(source);return {bytes,entries};
 }
 function check(){
  need(!stopped,'stopped');try{
   const usage=sourceUsage(),states=guards.map(g=>g.snapshot());need(states.every(s=>!s.poisoned),'poisoned');
   const growth=SOURCE_BYTES-usage.bytes+states.reduce((n,s,i)=>n+Math.max(0,(i===1?RUN_BYTES:i===0?OUTCOME_BYTES:SMALL_BYTES)-s.bytes),0);
   const receipts=roots.map(output=>host_guard({binding,output,growth_reservation_bytes:growth}));need(receipts.every(r=>r?.admitted===true),'host-denied');return {source:usage,evidence:states,receipts,growth_reservation_bytes:growth};
  }catch(error){stopped=true;throw error;}
 }
 function admit_source({task,cache,source_root:assigned,phase}){
  need(['before-prepare','before-base','before-work'].includes(phase),'source-phase');
  const name=relative(source,resolve(assigned)),expected=allowed.get(name);
  need(expected&&resolve(assigned)===join(source,name)&&resolve(cache)===resolve(expected.task.repository_cache)&&task.instance_id===expected.slot.instance_id&&task.base_commit===expected.slot.base_commit,'source-assignment');check();return true;
 }
 check();return {outcome_persistence:persistences[0],run_persistence:persistences[1],metadata_persistence:persistences[2],admit_campaign:()=>{check();return true;},admit_source,before_model_dispatch:()=>{check();return true;},check};
}
