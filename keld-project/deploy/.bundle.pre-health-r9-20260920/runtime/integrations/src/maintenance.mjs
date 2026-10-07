import {setTimeout as delay} from 'node:timers/promises';
import {processEvents} from './event-worker.mjs';
import {reconcileBatch} from './reconcile.mjs';

/** Explicit operator loop. No timer overlap, checkout creation or capture. */
export async function runMaintenance({repository,adapters,watch=false,intervalSeconds=60,signal,
  clock=()=>Math.floor(Date.now()/1000),onCycle=()=>{},
  wait=(ms,signal)=>delay(ms,undefined,{signal})}){
  if(typeof watch!=='boolean'||!Number.isInteger(intervalSeconds)||intervalSeconds<30||intervalSeconds>3600)
    throw new Error('maintenance-options-invalid');
  let cycles=0;
  while(!signal?.aborted){
    const report={cycle:++cycles,events:null,reconciliation:null,queue:null,reconciliationQueue:null,errors:[]};
    try{report.events=await processEvents({repository,adapters,clock,signal});}
    catch{report.errors.push({stage:'events',code:'event-processing-failed'});}
    if(!signal?.aborted){
      try{
        report.reconciliation=await reconcileBatch({repository,adapters,clock,signal});
      }catch{report.errors.push({stage:'reconciliation',code:'reconciliation-failed'});}
    }
    if(!signal?.aborted){
      try{
        const {counts,total,capacity,remaining,due,deferred,expiredLeases,nextAttempt,archive}=await repository('event-inspect',{now:clock()});
        report.queue={counts,total,capacity,remaining,due,deferred,expiredLeases,nextAttempt,archive};
        report.reconciliationQueue=await repository('reconcile-inspect',{now:clock()});
      }catch{report.errors.push({stage:'inspection',code:'event-inspection-failed'});}
    }
    report.stopping=Boolean(signal?.aborted);
    await onCycle(report);
    if(!watch||signal?.aborted)break;
    try{await wait(intervalSeconds*1000,signal);}
    catch(error){if(signal?.aborted)break;throw error;}
  }
  return {cycles,stopped:Boolean(signal?.aborted)};
}
