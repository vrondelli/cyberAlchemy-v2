// Run-local DSH composition. Final claims still require independent wire binding.
import {resolve,relative,join,isAbsolute} from 'node:path';
import {realpathSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createMatchedRepositoryTools} from './deepseek-matched-tools.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {observationItems,observationMaterial,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {diagnoseSourceSelection} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/provenance-validator.mjs';
import {FINAL_SCHEMA} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-schema.mjs';
export const name='are-benchmark-tools';
export const inject=['tools'];
const need=(v,m)=>{if(!v)throw Error('dsh-headless.'+m);};
export function createHeadlessTools({work_root,base_root,evidence_root,base_commit,payload_encoding=null}){
 const roots=[work_root,base_root,evidence_root].map(p=>{need(typeof p==='string'&&isAbsolute(p),'absolute-root');need(realpathSync(p)===resolve(p),'canonical-root');return resolve(p);});
 for(let i=0;i<roots.length;i++)for(let j=i+1;j<roots.length;j++){const p=relative(roots[i],roots[j]);need(p==='..'||p.startsWith('../')||isAbsolute(p),'disjoint-roots');const q=relative(roots[j],roots[i]);need(q==='..'||q.startsWith('../')||isAbsolute(q),'disjoint-roots');}
 need(/^[a-f0-9]{40}$/.test(base_commit),'base-commit');
 const git=args=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd:base_root,encoding:'utf8',timeout:120000,stdio:['ignore','pipe','pipe']});
 need(git(['rev-parse','HEAD']).trim()===base_commit,'base-identity');
 need(git(['diff','--no-ext-diff','--no-textconv','--name-only',base_commit,'--']).trim()==='','base-dirty');
 need(readdirSync(evidence_root).length===0,'fresh-evidence');
 const guard=createStageOutputGuard({root:evidence_root}),persistence=createStagePersistence({stage_guard:guard,stage_root:evidence_root});
 let n=0,closed=false,failed=false;const ids=new Set();
 const persist=event=>{try{persistence.writeJson(join(evidence_root,`${String(n++).padStart(6,'0')}.json`),event);}catch(e){failed=true;throw e;}};
 const adapter=createMatchedRepositoryTools({root:work_root,base_commit,persist,payload_encoding});
 const definitions=adapter.definitions.map(d=>({...d,execute:async(args,exec)=>{need(!closed&&!failed,'closed');need(!ids.has(exec.callId),'duplicate-call-id');ids.add(exec.callId);return d.execute(args,exec);}}));
 const terminal={name:'submit_context_selection',description:'Finish the issue-resolution attempt with a summary and the source read IDs used. Select pinned-base evidence. Report inability honestly; context selection does not prove patch correctness.',parameters:FINAL_SCHEMA,
  output:{schema:{type:'object'},render:(_args,value)=>[{type:'text',text:stable(value)}]},isConcurrencySafe:()=>false,
  async execute(args,exec){
   need(!closed&&!failed&&!adapter.snapshot().poisoned,'closed');need(!adapter.snapshot().busy,'tool-in-progress');
   need(exec?.signal instanceof AbortSignal&&!exec.signal.aborted&&typeof exec.callId==='string'&&exec.callId.length>0&&typeof exec.concludeTurn==='function','execution');
   need(!ids.has(exec.callId),'duplicate-call-id');ids.add(exec.callId);
   const records=adapter.snapshot().records,reads=new Map(),snapshots=[];
   for(const r of records){if(r.kind==='source-snapshot')snapshots.push(r.snapshot);if(r.kind==='tool-result')for(const {tool_call_id,o} of observationItems(r.call,r.output))reads.set(o.read_id,{id:o.read_id,...observationMaterial(tool_call_id,o)});}
   const diagnostic=diagnoseSourceSelection({raw:stable(args),reads:[...reads.values()],snapshots,repoRoot:base_root});
   if(!diagnostic.ok){persist({kind:'terminal-rejected',call_id:exec.callId,diagnostic});return {ok:false,diagnostic};}
   persist({kind:'terminal-candidate',call_id:exec.callId,selection:diagnostic.value,delivery_confirmed:false,provider_response_bound:false});
   closed=true;exec.concludeTurn();return {ok:true,selection:diagnostic.value,claim:'Executed evidence only; independent successful-request binding required.'};
  }};
 return {definitions:[...definitions,terminal],snapshot:()=>({closed,failed,adapter:adapter.snapshot(),storage:guard.snapshot()})};
}
export function apply(ctx,config){
 const adapter=createHeadlessTools(config);
 for(const d of adapter.definitions)ctx.tools.register(d);
}
