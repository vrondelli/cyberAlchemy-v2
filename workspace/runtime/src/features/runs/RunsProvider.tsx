import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import type {RunProjection} from './run-contract';
import type {RuntimeControls} from './runtime-controls';
import {offlineProjection} from './dashboard-state';
// Open questions: README.md#open-questions.
const RunsContext=createContext<{projection:RunProjection|null;controls:RuntimeControls|null;error:string;refresh:()=>Promise<void>}|null>(null);
export function RunsProvider({children}:{children:ReactNode}) {
 const [projection,setProjection]=useState<RunProjection|null>(null),[controls,setControls]=useState<RuntimeControls|null>(null),[error,setError]=useState('');
 const refresher=useRef<()=>Promise<void>>(async()=>{});
 const refresh=useCallback(()=>refresher.current(),[]);
 useEffect(()=>{
  let disposed=false,timer:ReturnType<typeof setTimeout>,controller:AbortController,inflight:Promise<void>|null=null;
  const load=():Promise<void>=>{
   if(inflight)return inflight;
   clearTimeout(timer);
   inflight=(async()=>{
    controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
    try{
     const response=await fetch('/api/v1/workspace/runs',{cache:'no-store',credentials:'same-origin',signal:controller.signal});
     if(!response.ok)throw Error('Run connection unavailable');
     const body=await response.json();
     if(body.schema_version!=='workspace-dashboard-response/v1'||body.projection?.schemaVersion!=='workspace-run-projection/v1-candidate'||!Array.isArray(body.projection.runs)||!Array.isArray(body.projection.sources)||!Array.isArray(body.errors))throw Error('Unsupported run response');
     if(!disposed){setProjection(body.projection);setControls(body.controls?.schema_version==='workspace-native-controls/v1'?body.controls:null);setError(body.errors.join(' '));}
    }catch{
     if(!disposed){setError('Run connection unavailable. Previous observations are retained.');setProjection(last=>last?offlineProjection(last):null);setControls(null);}
    }finally{clearTimeout(timeout);inflight=null;if(!disposed)timer=setTimeout(()=>void load(),3000);}
   })();
   return inflight;
  };
  refresher.current=async()=>{if(inflight)await inflight;if(!disposed)await load();};void load();
  return()=>{disposed=true;clearTimeout(timer);controller?.abort();refresher.current=async()=>{};};
 },[]);
 return <RunsContext.Provider value={{projection,controls,error,refresh}}>{children}</RunsContext.Provider>;
}
export function useRuns(){const value=useContext(RunsContext);if(!value)throw Error('RunsProvider required');return value;}
