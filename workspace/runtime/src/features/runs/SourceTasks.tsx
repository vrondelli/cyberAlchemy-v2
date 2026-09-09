import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {encodeSourceContext,readSourceContext,textSha256,type SelectedSource} from './source-context';
import {matchSource,sourceHref,type SourceTarget} from './source-navigation';
// Open questions: ../../../../plans/orchestrator-integration/T5C-SOURCE-ENTRY.md.
interface Offer {id:string;input:string;label:string;href:string}
const Context=createContext<{pending:Offer|null;offer:(source:SelectedSource,text:string,label:string)=>Promise<void>;dismiss:()=>void}|null>(null);
export const useSourceTasks=()=>useContext(Context);
export function SourceTasksProvider({children}:{children:ReactNode}){
 const [pending,setPending]=useState<Offer|null>(null);const occupied=useRef(false);
 const dismiss=()=>{occupied.current=false;setPending(null);};
 const offer=async(source:SelectedSource,text:string,label:string)=>{
  if(occupied.current)throw Error('A source selection is already waiting in New task. Use or dismiss it before selecting another.');
  occupied.current=true;
  try{const input=await encodeSourceContext(source,text),context=await readSourceContext(input);
   setPending({id:crypto.randomUUID(),input,label,href:sourceHref({source,textSha256:context!.text_sha256})!});
   window.location.hash='#/apps/orchestrator/runs/new';
  }catch(e){occupied.current=false;throw e;}
 };
 return <Context.Provider value={{pending,offer,dismiss}}>{children}</Context.Provider>;
}
export function SourceTaskButton({source,text,label}:{source:Omit<SelectedSource,'revision'>&{revision?:string};text:string;label:string}){
 const tasks=useSourceTasks();const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 if(!tasks)return null;
 return <div className="source-task-action"><button type="button" disabled={busy||!text.trim()} onClick={async()=>{
  if(busy)return;setBusy(true);setError('');
  try{await tasks.offer({...source,revision:source.revision??'sha256:'+await textSha256(text)},text,label);}catch(e){setError(String(e).includes('SOURCE_CONTEXT_INPUT_TOO_LARGE')?'This selection exceeds the task input limit. Select a shorter source.':String(e));}finally{setBusy(false);}
 }}>Prepare task from {label}</button>{error&&<p role="alert">{error}</p>}</div>;
}
export function SourceReturn({target,selected,text}:{target:SourceTarget|null;selected:(Omit<SelectedSource,'revision'>&{revision?:string})|null;text:string|null}){
 const [status,setStatus]=useState('Checking source…');const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{let active=true;if(target){setStatus('Checking source…');void (async()=>matchSource(target,selected?{...selected,revision:selected.revision??'sha256:'+await textSha256(text??'')}:null,text))().then(match=>{if(active)setStatus(match==='matching'?'The current selection matches the declared revision and text.':match==='changed'?'The source has changed. This is current content, not the reviewed revision.':target.source.kind==='chat'?'The selected source is unavailable here. Chat history is kept only while this page remains open.':target.source.kind==='knowledge'?'The selected knowledge context is unavailable in this snapshot.':'The selected project description is unavailable in this snapshot.');}).catch(()=>{if(active)setStatus('Source comparison is unavailable.');});}return()=>{active=false;};},[target,selected?.id,selected?.revision,selected?.selector,text]);
 useEffect(()=>{if(target&&heading.current?.getClientRects().length)heading.current.focus();},[target]);
 if(!target)return null;
 return <aside className="source-return"><h2 ref={heading} tabIndex={-1}>Selected source</h2><p>{target.source.kind} · {target.source.id} · {target.source.selector}</p><p>Declared revision: {target.source.revision}</p><p role="status">{status}</p>{target.runId&&<a href={'#/apps/orchestrator/runs/'+encodeURIComponent(target.runId)}>Back to run</a>}<p>These are caller-declared coordinates; source ownership is not verified.</p></aside>;
}
