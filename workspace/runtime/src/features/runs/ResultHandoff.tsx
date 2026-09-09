import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import type {EssayWorkspace} from '@cyberalchemy/essays-runtime/model';
import type {EssaysSavedDraftObservation,EssaysStagedBuffer} from '@cyberalchemy/essays-runtime/markdown';
import {HANDOFF_KEY,captureResult,observeHandoff,parseHandoff,type ResultHandoff} from './result-handoff';
import type {RunView} from './run-contract';
// Open questions: ../../../plans/orchestrator-integration/T5-RELATIONSHIPS.md.
type State={record:ResultHandoff|null;error:string;offer:(run:RunView)=>void;write:(value:ResultHandoff|null)=>void};
const Context=createContext<State|null>(null);
export function useResultHandoff(){const value=useContext(Context);if(!value)throw Error('Result handoff provider missing');return value;}
export function ResultHandoffProvider({children}:{children:ReactNode}){
 const [initial]=useState(()=>{let raw:string|null=null;try{raw=localStorage.getItem(HANDOFF_KEY);return {raw,record:parseHandoff(raw),error:''};}catch(e){return {raw,record:null,error:String(e)};}});
 const persisted=useRef(initial.raw);
 const [record,setRecord]=useState(initial.record),[error,setError]=useState(initial.error);
 const write=useCallback((value:ResultHandoff|null)=>{try{if(localStorage.getItem(HANDOFF_KEY)!==persisted.current)throw Error('Handoff changed in another tab. Reload before changing it.');if(value)localStorage.setItem(HANDOFF_KEY,JSON.stringify(value));else localStorage.removeItem(HANDOFF_KEY);persisted.current=value?JSON.stringify(value):null;setRecord(value);setError('');}catch(e){throw Error('Could not update the local handoff. Reload and inspect it before retrying. Your editor has not been changed. '+String(e));}},[]);
 const offer=useCallback((run:RunView)=>{if(record)throw Error('An Essays handoff is already open. Finish or dismiss it in Essays before opening another result.');write(captureResult(run,crypto.randomUUID()));window.location.hash='#/essays';},[record,write]);
 return <Context.Provider value={{record,error,offer,write}}>{children}</Context.Provider>;
}
export function ResultHandoffPanel({workspace,observation,onStage,active=true}:{active?:boolean;workspace:EssayWorkspace|null;observation:EssaysSavedDraftObservation|null;onStage:(buffer:EssaysStagedBuffer)=>void}){
 const {record,error,write}=useResultHandoff();
 const [confirmed,setConfirmed]=useState(false),[message,setMessage]=useState('');
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(active&&record&&heading.current){heading.current.focus({preventScroll:true});heading.current.scrollIntoView({block:'start'});}},[active,record?.id]);
 useEffect(()=>{setConfirmed(false);setMessage('');},[record?.id,workspace?.workspaceId,workspace?.currentRevision]);
 useEffect(()=>{if(!record||!observation)return;const next=observeHandoff(record,observation);if(next!==record){try{write(next);}catch(e){setMessage(String(e));}}},[record,observation,write]);
 if(!record&&!error)return null;
 const dismiss=()=>{try{const target=heading.current?.closest('.essays-owned-plane')?.querySelector('h1');write(null);if(target instanceof HTMLElement){target.tabIndex=-1;target.focus();}}catch(e){setMessage(String(e));}};
 if(!record)return <aside className="run-result-handoff"><p role="alert">{error}</p><button onClick={dismiss}>Dismiss invalid handoff</button></aside>;
 const ready=!!workspace?.compositionPlan;
 const stage=()=>{
  if(!ready||!confirmed||!workspace)return;
  const stageEpoch=Math.max(Date.now(),(record.target?.stageEpoch??0)+1);
  const next={...record,target:{workspaceId:workspace.workspaceId,baseRevision:workspace.currentRevision,stageEpoch},saved:null};
  try{
   write(next);
   onStage({workspaceId:workspace.workspaceId,proposalId:'run-result:'+record.id,stageEpoch,markdown:record.content});
   setConfirmed(false);setMessage('Result staged in the unsaved Essays buffer. Use Essays to save it when ready.');
  }catch(e){setMessage(String(e));}
 };
 return <aside className="run-result-handoff" aria-label="Run result handoff">
  <h2 ref={heading} tabIndex={-1}>Run result → Essays</h2><p>{record.title} · {record.source.mode==='fixture'?'Fixed test response; no model generated this text.':'Captured execution output.'}</p>
  <a href={'#/apps/orchestrator/runs/'+encodeURIComponent(record.source.viewId)}>Open source run</a>
  <details><summary>Source and target references</summary><dl>
   <dt>Owner run key</dt><dd>{record.source.runKey}</dd><dt>Runtime</dt><dd>{record.source.runtimeId}</dd>
   <dt>Source revision</dt><dd>{record.source.revision??'Not reported'}</dd><dt>Completion digest</dt><dd>{record.source.completionDigest}</dd>
   <dt>Target</dt><dd>{record.target?record.target.workspaceId+' · base revision '+record.target.baseRevision:'Not staged'}</dd>
  </dl></details>
  <details><summary>Preview captured result</summary><pre>{record.content}</pre></details>
  <p role="status">{record.saved?record.saved.match==='exact'?'Saved exact text in Essays revision '+record.saved.essayRevision+'.':'Saved edited text in Essays revision '+record.saved.essayRevision+'; it differs from the captured result.':record.target?'Staged previously. Reload does not restore an unsaved editor buffer; restage explicitly if needed.':'Ready for review. The editor has not changed.'}</p>
  {!ready&&<p>Create or open an Essays composition plan below before staging.</p>}
  <label><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Replace the current unsaved Essays buffer with this result.</label>
  <button type="button" disabled={!ready||!confirmed} onClick={stage}>{record.target?'Restage result in editor':'Stage result in editor'}</button>
  <button type="button" onClick={dismiss}>Dismiss handoff</button>
  {message&&<p role="status">{message}</p>}
  <p>Staging does not save, accept, publish or promote this result. The source reference is a local handoff record.</p>
 </aside>;
}
