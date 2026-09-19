import {randomUUID} from 'node:crypto';

export function createOperationalEvidence(){
 const counts={offered:0,queued:0,rejected:0,exported:0,dropped:0};
 let pending=0;
 function snapshot(){
  const telemetry={...counts,pending};
  const equations={
   offered_partition:telemetry.offered===telemetry.queued+telemetry.rejected,
   queue_partition:telemetry.queued===telemetry.exported+telemetry.dropped+telemetry.pending,
  };
  return {telemetry,equations,conserved:equations.offered_partition&&equations.queue_partition,required_drops_zero:telemetry.dropped===0};
 }
 function offer({reject=false}={}){
  counts.offered++;
  if(reject){counts.rejected++;return undefined;}
  counts.queued++;pending++;
  let completed=false;
  return outcome=>{
   if(completed)throw Error('Operational evidence ticket already completed');
   if(!['exported','dropped'].includes(outcome))throw Error('Invalid operational evidence outcome');
   completed=true;pending--;counts[outcome]++;
  };
 }
 return {offer,snapshot};
}

export const correlationId=()=>randomUUID();
