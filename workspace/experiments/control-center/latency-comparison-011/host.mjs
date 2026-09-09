import {sampleHost,describeHost} from '../native-test/campaign/probe.mjs';
import {qualify,protocol,protocolBytes,digest} from '../research-learning-owned/runtime/benchmark/analyze.mjs';
import {setTimeout as delay} from 'node:timers/promises';
export {protocol};
export function prelaunchReasons(rows){
  if(!Array.isArray(rows)||rows.length<protocol.prelaunchObservations||rows.some(r=>!r||typeof r!=='object'))return ['host-coverage-missing'];
  const end=rows.at(-1).atMs;
  return qualify(rows,end+1,end+2).filter(r=>!['host-coverage-missing','host-edge-gap'].includes(r));
}
export function assess(rows,start,end,errors=[]){
  let reasons;
  try{reasons=qualify(rows,start,end);}catch{reasons=['host-observations-invalid'];}
  reasons=[...new Set([...reasons,...errors.map(e=>'host-sampling-error:'+e)])];
  return {qualified:reasons.length===0,reasons,protocol_sha256:digest(protocolBytes),authority_effect:'none'};
}
export async function prepareHost(save){
  const rows=[],errors=[],host=describeHost();
  const persist=()=>save({host,host_sha256:digest(JSON.stringify(host)),protocol_sha256:digest(protocolBytes),observations:rows,errors,authority_effect:'none'});
  const take=()=>{try{rows.push(sampleHost(performance.now()));}catch(e){errors.push(e.message);}persist();};
  for(let i=0;i<protocol.prelaunchObservations;i++){take();if(i<protocol.prelaunchObservations-1)await delay(1000);}
  const reasons=[...prelaunchReasons(rows),...errors.map(e=>'host-sampling-error:'+e)];
  if(reasons.length)return {prelaunch:{qualified:false,reasons},start:()=>{throw Error('host-rejected');}};
  return {prelaunch:{qualified:true,reasons:[]},start(){
    const start=performance.now();take();const timer=setInterval(take,500);
    return {finish(){clearInterval(timer);take();const end=performance.now();const result=assess(rows,start,end,errors);save({host,host_sha256:digest(JSON.stringify(host)),observations:rows,startMs:start,endMs:end,errors,...result});return result;}};
  }};
}
