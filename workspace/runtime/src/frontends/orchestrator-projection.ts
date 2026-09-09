import type {Projection,Run} from '@cyberalchemy/orchestrator-console/domain';
import type {RunProjection,RunView} from '../features/runs/run-contract';
// Adapter only: product rendering stays in the orchestrator repository.
// Open questions: README.md#open-questions.
export function toConsoleRun(run:RunView):Run {
 const progress=run.progress,unknown='Not reported';
 return {
  run_key:run.viewId,title:run.title,
  status:['preparing','queued','running','cancelling'].includes(run.execution)?'active':['blocked','failed','uncertain','unknown'].includes(run.execution)?'blocked':'closed',
  phase:run.execution,progress:progress&&progress.total?Math.round(progress.accepted*100/progress.total):0,
  semantic_work_id:run.taskId??unknown,run_id:run.runRef?.runKey??run.launchId??run.viewId,attempt_id:unknown,
  owner:run.source.label,work_kind:run.workKind,deadline:'Deadline not reported',
  next_action:run.attention.includes('reconciliation-required')?'Operator reconciliation required':run.result.content?'Inspect the recorded result':'Waiting for runtime observations',
  graph:progress?{completed:progress.accepted,running:progress.running,blocked:progress.blocked,pending:progress.pending,total:progress.total}:{completed:0,running:0,blocked:0,pending:0,total:0},
  strategy:run.strategy??undefined,
  workers:[],blockers:run.attention.map(reason=>({code:reason,owner:run.source.label,subject:run.viewId,detail:reason.replaceAll('-',' ')})),
  evidence:run.result.completionDigest?[{kind:'Completion binding',count:1,digest:run.result.completionDigest}]:[],
  result:{status:run.result.content?'available':'unavailable',title:run.title,content:run.result.content??undefined,detail:'No result supplied by this connection.',kind:run.result.kind==='unknown'?undefined:run.result.kind,model:run.executor.modelTarget??undefined,authority_effect:'none'},
  lifecycle:Object.fromEntries(Object.entries(run.lifecycle).filter((entry):entry is [string,string]=>entry[1]!==null)),
  source:{revision:run.source.revision??0,registry_digest:unknown,history_digest:unknown},
  observation:{execution:run.execution,mode:run.mode,freshness:run.source.freshness,progressKnown:progress!==null,icon:run.icon,
   verification:run.result.verification==='owner-verified'?'Verified against owner history':run.result.verification==='source-reported'?'Reported by runtime':'Verification unavailable',
   identity:{...(run.origin?{'Declared source':run.origin.source.kind+' · '+run.origin.source.id,'Declared source revision':run.origin.source.revision,'Selected source content':run.origin.source.selector,'Selected text SHA-256':run.origin.textSha256,'Reviewed task digest':run.origin.taskDigest,'Source attribution':'Caller-declared source; exact input bytes bound by the task digest. Source ownership and currentness are not verified.'}:{}),'View identity':run.viewId,'Owner run key':run.runRef?.runKey??unknown,'Runtime':run.source.runtimeId,'Task':run.taskId??unknown,'Launch':run.launchId??unknown,'Executor contract':run.executor.contract??unknown,'Model target':run.executor.modelTarget??unknown,'Completion digest':run.result.completionDigest??unknown,'Source revision':run.source.revision?.toString()??unknown,'Observed':run.source.observedAtMs?new Date(run.source.observedAtMs).toISOString():unknown}},
 };
}
export function toConsoleProjection(value:RunProjection|null):Projection {
 return {schema_version:'workspace-orchestrator-presentation/v1-candidate',projection_revision:0,projection_digest:'Not reported',generated_at:'Not reported',source_mode:'workspace-observations',authority_effect:'none',external_effect:'none',
  health:Object.fromEntries(value?.sources.map(source=>[source.label,source.freshness])??[['connection','loading']]),
  runs:value?.runs.map(toConsoleRun)??[]};
}
