import type {Workspace} from './canvasWorkspace';

// Reading offsets are imperative browser state, not a reason to render the graph.
// Persist on idle (250 ms), at most every second during continuous interaction,
// and synchronously on lifecycle/navigation boundaries.
export function createWorkspacePersistence(write:(value:Workspace)=>void,initial:Workspace){
 let current=initial,dirty=false,idle:ReturnType<typeof setTimeout>|undefined,maxWait:ReturnType<typeof setTimeout>|undefined;
 const offsets=new Map<string,number>();
 const cancel=()=>{clearTimeout(idle);clearTimeout(maxWait);idle=maxWait=undefined;};
 const snapshot=()=>({...current,cards:current.cards.map(c=>offsets.has(c.id)?{...c,scroll:offsets.get(c.id)!}:c)});
 const flush=()=>{cancel();if(dirty){dirty=false;write(snapshot());}};
 const schedule=()=>{dirty=true;clearTimeout(idle);idle=setTimeout(flush,250);maxWait??=setTimeout(flush,1000);};
 return {
  update(value:Workspace){if(current===value)return;current=value;for(const id of offsets.keys())if(!value.cards.some(c=>c.id===id))offsets.delete(id);schedule();},
  recordScroll(id:string,value:number){if(!Number.isFinite(value)||value<0)return;if((offsets.get(id)??current.cards.find(c=>c.id===id)?.scroll)===value)return;offsets.set(id,value);schedule();},
  readScroll(id:string,fallback:number){return offsets.get(id)??fallback;},
  flush,
  reset(){offsets.clear();},
  dispose(){flush();cancel();},
 };
}
