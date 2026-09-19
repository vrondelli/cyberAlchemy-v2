// Native recycler admission bridge. Open questions: INDEPENDENT-NATIVE-DRIVER.md.
import {existsSync} from 'node:fs';import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';
import {openContextRecycling} from './packet-diversity-v1/context-recycling-bounded-v3.mjs';
import {bodyForReceipt,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {runIndependentEpisode} from './independent-episode.mjs';
const digest=x=>createHash('sha256').update(stable(x)).digest('hex');const need=(v,m)=>{if(!v)throw Error('independent-native.'+m);};
export function createNativeInvestigationDriver({client,profile,scope,fixture_root,directory,persistence,signal,before_dispatch}){
 need(client?.transport&&Array.isArray(client.receipts)&&client.receipts.length===0&&typeof client.bindRunLedger==='function','fresh-client');
 need(profile&&Object.keys(profile).sort().join(',')==='model,output_cap,reasoning_effort'&&typeof profile.model==='string'&&typeof profile.reasoning_effort==='string'&&Number.isSafeInteger(profile.output_cap)&&profile.output_cap>0&&profile.output_cap<=2048,'profile');
 need(scope&&typeof scope.request==='string'&&scope.request.length>0&&typeof before_dispatch==='function','scope-and-health');
 need(persistence&&['writeJson','createLock','removeLock'].every(k=>typeof persistence[k]==='function'),'persistence');
 directory=resolve(directory);need(!existsSync(directory),'fresh-directory');const boundProfile=Object.freeze({...profile}),boundScope=structuredClone(scope),binding=digest({scope:boundScope,profile:boundProfile,policy:'independent-native-v1'});
 persistence.writeJson(join(directory,'driver-binding.json'),{binding,scope:boundScope,profile:boundProfile,context_limit:8000,recycle_at:7999,safety_margin:1});
 const lock=join(directory,'writer.lock');persistence.createLock(lock);let closed=false,active=null,sequence=0,closePromise=null;
 try{client.bindRunLedger({directory,binding});}catch(e){persistence.removeLock(lock);throw e;}
 function abortPending(){if(active&&!active.released)active.release(false);}
 signal?.addEventListener('abort',abortPending);
 async function prepare({prompt,output_cap}){
  need(!closed&&!active&&!signal?.aborted,'not-ready');need(typeof prompt==='string'&&output_cap===boundProfile.output_cap,'prompt-profile');
  const slot={id:++sequence,released:false,prepared:null};active=slot;
  let readyResolve,readyReject;const ready=new Promise((yes,no)=>{readyResolve=yes;readyReject=no;});
  const decision=new Promise(resolve=>{slot.release=value=>{if(!slot.released){slot.released=true;resolve(value);}};});
  let recycler;
  try{recycler=openContextRecycling({persistence,transport:client.transport,fixture_root,scope:{...boundScope,request_sequence:slot.id},options:{directory:join(directory,'request-'+slot.id),context_limit:8000,recycle_at:7999,safety_margin:1,state:{objective:boundScope.request,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:[binding]}}});}
  catch(e){active=null;readyReject(e);return ready;}
  slot.completion=recycler.generate({history:[],run_id:binding+':'+slot.id,render:async()=>prompt,admit_dispatch:async dispatch=>{
   need(dispatch.prompt_digest===digest(prompt)&&dispatch.output_reservation===output_cap,'measured-binding');
   if(signal?.aborted)return false;
   slot.prepared=Object.freeze({prompt,output_cap,profile:boundProfile,input_upper_bound:dispatch.input_upper_bound,request_sha256:digest(bodyForReceipt(prompt,boundProfile))});
   readyResolve(slot.prepared);return decision;
  }}).then(result=>{recycler.completeStep([],true);return result;}).finally(()=>recycler.close());
  // Observe failures before admission and avoid detached rejected promises while paused.
  slot.completion.catch(error=>{readyReject(error);});
  try{return await ready;}catch(e){slot.release(false);await slot.completion.catch(()=>{});if(active===slot)active=null;throw e;}
 }
 async function dispatch(prepared){
  const slot=active;need(!closed&&slot&&prepared===slot.prepared&&!slot.released&&!slot.claimed,'prepared-identity');slot.claimed=true;
  try{need(!signal?.aborted,'aborted');need(await before_dispatch()===true,'shared-health-stop');need(!signal?.aborted&&!closed&&!slot.released,'aborted');slot.release(true);return await slot.completion;}
  catch(error){slot.release(false);await slot.completion.catch(()=>{});throw error;}
  finally{if(active===slot)active=null;}
 }
 function close(){
  if(closePromise)return closePromise;closed=true;signal?.removeEventListener('abort',abortPending);
  closePromise=(async()=>{let failure;const slot=active;if(slot){slot.release(false);try{await slot.completion;}catch(e){if(e.message!=='recycling.dispatch-admission-denied')failure=e;}if(active===slot)active=null;}try{persistence.removeLock(lock);}catch(e){failure??=e;}if(failure)throw failure;})();
  return closePromise;
 }
 return Object.freeze({receipts:client.receipts,prepare,dispatch,close});
}
export async function runNativeIndependentEpisode({native,...episode}){
 const driver=createNativeInvestigationDriver(native);let result;
 try{result=await runIndependentEpisode({...episode,driver});return result;}
 finally{try{await driver.close();}catch(error){if(result)error.result=result;throw error;}}
}
