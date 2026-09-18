import {useLayoutEffect,useMemo,useRef} from 'react';
import {STORAGE_KEY,type Workspace} from './canvasWorkspace';
import {createWorkspacePersistence} from './workspacePersistence';
export function useWorkspacePersistence(workspace:Workspace,onError:()=>void){
 const errorRef=useRef(onError);errorRef.current=onError;
 const persistence=useMemo(()=>createWorkspacePersistence(value=>{try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(value));}catch{errorRef.current();}},workspace),[]);
 useLayoutEffect(()=>persistence.update(workspace),[workspace,persistence]);
 useLayoutEffect(()=>{
  const hidden=()=>{if(document.visibilityState==='hidden')persistence.flush();};
  window.addEventListener('pagehide',persistence.flush);window.addEventListener('hashchange',persistence.flush);document.addEventListener('visibilitychange',hidden);
  return()=>{window.removeEventListener('pagehide',persistence.flush);window.removeEventListener('hashchange',persistence.flush);document.removeEventListener('visibilitychange',hidden);persistence.dispose();};
 },[persistence]);
 return persistence;
}
