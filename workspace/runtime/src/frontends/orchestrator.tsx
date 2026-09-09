import {useSourceTasks} from '../features/runs/SourceTasks';
import {KnowledgeContext} from '../features/runs/KnowledgeContext';
import {sourceHref,sourceTarget} from '../features/runs/source-navigation';
import {useResultHandoff} from '../features/runs/ResultHandoff';
import {canOfferResult} from '../features/runs/result-handoff';
import {useMemo,useRef} from 'react';
import {EmbeddedConsole,embeddedStyles,type EmbeddedControls} from '@cyberalchemy/orchestrator-console/embedded';
import {useRuns} from '../features/runs/RunsProvider';
import {toConsoleProjection} from './orchestrator-projection';
import {runViewId} from '../features/runs/run-contract';
import type {FrontendProps} from './contract';
// Open questions: README.md#open-questions.
export const styles=embeddedStyles;
export function OrchestratorFrontend(props:FrontendProps){
 const {projection,controls,error,refresh}=useRuns();
 const handoff=useResultHandoff();
 const sourceTasks=useSourceTasks();
 const draft=useRef<{title:string;instruction:string;input:string}|undefined>(undefined);
 const knowledgeTarget=useMemo(()=>sourceTarget(props.href(props.path)),[props.path,props.href]);
 const observed=useMemo(()=>toConsoleProjection(projection),[projection]);
 const lastControls=useRef(controls);
 if(controls)lastControls.current=controls;
 const service=useMemo<EmbeddedControls|undefined>(()=>{
  const selected=controls??lastControls.current;
  if(!selected?.enabled&&!selected?.scheduler?.enabled)return undefined;
  if(!selected)return undefined;
  const request=async<T,>(path:string,body?:unknown):Promise<T>=>{
   if(!controls?.available)throw Error('RUNTIME_UNAVAILABLE');
   const response=await fetch('/api/v1/workspace/runtimes/'+encodeURIComponent(selected.runtimeId)+'/native-tasks'+path,{method:'POST',cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json','X-Workspace-Intent':'native-task'},body:JSON.stringify(body??{})});
   const result=await response.json();if(!response.ok)throw Error(result.error??'Control failed; check Runs before retrying.');return result as T;
  };
  const schedulerRequest=async(viewId:string,action:'cancel'|'reconcile-stop')=>{
   const run=projection?.runs.find(run=>run.viewId===viewId),scheduler=controls?.scheduler;
   if(!scheduler?.enabled||!scheduler.available||run?.runRef?.runtimeId!==scheduler.runtimeId||!run.actions.includes(action))throw Error('Action unavailable');
   try{const response=await fetch('/api/v1/workspace/runtimes/'+encodeURIComponent(scheduler.runtimeId)+'/scheduler-runs/'+encodeURIComponent(run.runRef.runKey)+'/'+action,{method:'POST',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json','X-Workspace-Intent':'scheduler-run'},body:'{}'});const result=await response.json();if(!response.ok)throw Error(result.error??'Control delivery uncertain. Check Runs.');}finally{await refresh();}
  };
  return {connectionLabel:selected.scheduler?.enabled?'Workspace run connections':'Local native console',connectionStatus:selected.scheduler?.enabled?`Shared orchestrator ${controls?.scheduler?.available?'connected':'offline'}${selected.enabled?` · Native console ${controls?.available?'connected':'offline'}`:''}`:controls?.available?`Fixture · ${controls.remaining} launches remaining${controls.active?' · Busy':''}${controls.blockedReason?' · Reconciliation required':''}`:'Offline · controls unavailable',
   nativeTasks:selected.enabled?{get draft(){return draft.current;},saveDraft:value=>{draft.current=value;},inputOffer:sourceTasks?.pending?{...sourceTasks.pending,dismiss:sourceTasks.dismiss}:undefined,state:controls?.state??null,error:error||controls?.blockedReason||'',canReview:controls?.canReview??false,canLaunch:controls?.canLaunch??false,request,refresh,runsHref:props.href('/runs'),
    onLaunched:job=>props.navigate('/runs/'+encodeURIComponent(runViewId(selected.runtimeId,'launch',job.id)))}:undefined,
   cancelRunIds:projection?.runs.filter(run=>run.actions.includes('cancel')).map(run=>run.viewId)??[],
   reconcileRunIds:projection?.runs.filter(run=>run.actions.includes('reconcile-stop')).map(run=>run.viewId)??[],
   reconcile:(viewId:string)=>schedulerRequest(viewId,'reconcile-stop'),
   cancel:async(viewId:string)=>{const run=projection?.runs.find(run=>run.viewId===viewId);if(run?.runRef?.runtimeId===controls?.scheduler?.runtimeId)return schedulerRequest(viewId,'cancel');if(!run?.launchId||!run.actions.includes('cancel'))throw Error('Action unavailable');try{await request('/'+run.launchId+'/cancel',{});}finally{await refresh();}},
  };
 },[controls,error,projection,refresh,props.navigate,props.href,sourceTasks]);
 const selectedRun=projection?.runs.find(run=>props.path==='/runs/'+encodeURIComponent(run.viewId));
 const originHref=selectedRun?.origin?sourceHref({source:selectedRun.origin.source,textSha256:selectedRun.origin.textSha256,runId:selectedRun.viewId}):null;
 if(!projection&&!error)return <p role="status">Loading run observations…</p>;
 return <>{!service&&sourceTasks?.pending&&<aside className="native-notice"><p>Your source selection is waiting, but the launch connection is unavailable.</p><button onClick={sourceTasks.dismiss}>Dismiss selection</button></aside>}{originHref&&<aside className="native-notice"><a href={originHref}>Open declared source</a><p>Source ownership and currentness are not verified.</p></aside>}{error&& !props.path.endsWith("/new") &&<p role="status" className="panel-note">{error}</p>}<EmbeddedConsole {...props} path={props.path.split('?')[0]} knowledgeContext={{selectedId:knowledgeTarget?.source.kind==='knowledge'?knowledgeTarget.source.id:undefined,render:record=><KnowledgeContext record={record} target={knowledgeTarget?.source.kind==='knowledge'?knowledgeTarget:null}/>}} projection={observed} controls={service} resultAction={{label:'Open result in Essays',runIds:projection?.runs.filter(canOfferResult).map(run=>run.viewId)??[],onSelect:async id=>{const run=projection?.runs.find(run=>run.viewId===id);if(!run)throw Error('Run observation unavailable.');handoff.offer(run);}}}/></>;
}
