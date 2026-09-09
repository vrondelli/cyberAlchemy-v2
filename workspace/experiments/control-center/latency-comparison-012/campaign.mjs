import {readFileSync,writeFileSync,openSync,closeSync,fsyncSync,mkdirSync,rmdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {assess} from '../latency-comparison-011/host.mjs';
import {verifySemantics} from '../latency-comparison-005/semantics.mjs';
import {protocolBytes} from '../research-learning-owned/runtime/benchmark/analyze.mjs';

export const sha=b=>createHash('sha256').update(b).digest('hex');
const hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const arms=['baseline','uninstrumented'];
const orderFor=n=>n%2===1?arms:[...arms].reverse();
function ensure(v,message){if(!v)throw Error(message);}
export function evaluate(events,identity){
  ensure(hash(identity?.registration_sha256)&&hash(identity?.protocol_sha256)&&arms.every(a=>hash(identity.arms?.[a]?.binary_sha256)&&hash(identity.arms?.[a]?.build_id)),'campaign-identity');
  ensure(Array.isArray(events),'events-contract');
  ensure(identity.protocol_sha256===sha(protocolBytes),'selected-protocol-mismatch');
  const counts={baseline:0,uninstrumented:0},samples={baseline:[],uninstrumented:[]},rejected=[],seen=new Set();
  let active=null,pairs=0,stopped=false;
  for(const [index,event] of events.entries()){
    ensure(event.seq===index+1&&event.identity_sha256===sha(JSON.stringify(identity)),'event-sequence-or-identity');
    if(event.type==='reserve'){
      ensure(!active&&!stopped,'campaign-not-runnable');
      ensure(!arms.every(a=>samples[a].length===40),'population-complete');
      const selected=orderFor(pairs+1).filter(a=>samples[a].length<40);
      ensure(selected.every(a=>counts[a]<60),'attempt-limit');
      ensure(event.pair===pairs+1&&JSON.stringify(event.arms)===JSON.stringify(selected),'pair-order');
      active={pair:event.pair,arms:selected};pairs++;
      for(const a of selected)counts[a]++;
    }else if(event.type==='settle'){
      ensure(active&&event.pair===active.pair&&Array.isArray(event.results)&&event.results.length===active.arms.length,'settlement-contract');
      for(const [i,r] of event.results.entries()){
        const arm=active.arms[i];
        ensure(r?.arm===arm&&typeof r.run_id==='string'&&r.run_id.length>0&&!seen.has(r.run_id),'run-order-or-duplicate');seen.add(r.run_id);
        ensure(['completed','host-rejected','failed','not-run'].includes(r.status),'run-status');
        ensure(!stopped||r.status==='not-run','successor-after-failure');
        if(r.status==='not-run'){
          ensure(typeof r.reason==='string'&&r.reason.length>0,'missing-skip-reason');
          rejected.push({pair:active.pair,arm,reasons:['not-run:'+r.reason]});continue;
        }
        ensure(r.protocol_sha256===identity.protocol_sha256,'host-protocol-drift');
        const host=assess(r.host?.observations,r.host?.startMs,r.host?.endMs,r.host?.errors??[]);
        if(!host.qualified){rejected.push({pair:active.pair,arm,reasons:host.reasons});if(r.status==='failed')stopped=true;continue;}
        ensure(r.status!=='host-rejected','false-host-rejection');
        if(r.status==='failed'){stopped=true;continue;}
        ensure(r.binary_sha256===identity.arms[arm].binary_sha256&&r.build_id===identity.arms[arm].build_id,'run-identity-drift');
        ensure(r.cold_process===true&&r.fresh_storage===true,'cold-posture');
        ensure(verifySemantics(r.semantics),'semantic-mismatch');
        ensure(Array.isArray(r.samples)&&r.samples.length===1&&r.samples.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=0),'invalid-aggregate');
        samples[arm].push(Math.max(...r.samples));
      }
      active=null;
    }else throw Error('unknown-event');
  }
  const complete=!active&&!stopped&&arms.every(a=>samples[a].length===40);
  const p95=Object.fromEntries(arms.map(a=>[a,complete?[...samples[a]].sort((x,y)=>x-y)[37]:null]));
  const delta=complete?p95.baseline-p95.uninstrumented:null;
  const exhausted=arms.some(a=>samples[a].length<40&&counts[a]>=60);
  return {status:stopped?'FAILED':active?'IN_FLIGHT':complete?'POPULATION_COMPLETE':exhausted?'EXHAUSTED':'INCOMPLETE',
    next:!active&&!stopped&&!complete&&!exhausted?{pair:pairs+1,arms:orderFor(pairs+1).filter(a=>samples[a].length<40)}:null,
    attempts_reserved:counts,qualified_counts:Object.fromEntries(arms.map(a=>[a,samples[a].length])),rejected,p95_ms:p95,
    overhead_delta_ms:delta,threshold_check:complete?(delta<=1?'PASS':'FAIL'):'not_evaluable',
    campaign_readiness:'not_evaluable',claim_ceiling:'Normalized-input evaluator only; raw artifact closure and exact budget binding remain required.',authority_effect:'none'};
}

export function createCampaign(dir,identity){
  evaluate([],identity);mkdirSync(dir);
  writeFileSync(join(dir,'identity.json'),JSON.stringify(identity)+'\n',{flag:'wx'});
  writeFileSync(join(dir,'events.jsonl'),'',{flag:'wx'});
}
export function readCampaign(dir){
  const identity=JSON.parse(readFileSync(join(dir,'identity.json'),'utf8'));
  const bytes=readFileSync(join(dir,'events.jsonl'),'utf8');
  ensure(!bytes||bytes.endsWith('\n'),'partial-ledger-tail');
  const envelopes=bytes?bytes.trimEnd().split('\n').map(x=>JSON.parse(x)):[];
  let previous='0'.repeat(64);
  const events=envelopes.map(e=>{ensure(e.previous===previous&&e.sha256===sha(JSON.stringify({previous:e.previous,event:e.event})),'ledger-chain');previous=e.sha256;return e.event;});
  return {identity,events,previous,view:evaluate(events,identity)};
}
export function appendEvent(dir,event){
  const lock=join(dir,'.writer-lock');mkdirSync(lock);
  try{
    const state=readCampaign(dir);
    const bound={...event,seq:state.events.length+1,identity_sha256:sha(JSON.stringify(state.identity))};
    const view=evaluate([...state.events,bound],state.identity);
    const payload={previous:state.previous,event:bound};
    const fd=openSync(join(dir,'events.jsonl'),'a');
    try{writeFileSync(fd,JSON.stringify({...payload,sha256:sha(JSON.stringify(payload))})+'\n');fsyncSync(fd);}finally{closeSync(fd);}
    return view;
  }finally{rmdirSync(lock);}
}
