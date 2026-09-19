// Bounded representative final qualification; never enables model dispatch.
// Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {join} from 'node:path';
import {loadCatalogDonor} from './schema-agreement-final-donor-r1.mjs';
import {qualifyCatalogFinalRequest} from './schema-agreement-final-qualification-r1.mjs';
import {comparisonLiveClientFactory} from './schema-agreement-live-client-r1.mjs';
import {verifySchemaAgreementSchedule} from './schema-agreement-schedule-r1.mjs';
const need=(v,m)=>{if(!v)throw Error('catalog-final-campaign.'+m);};
export async function qualifyCatalogFinalCampaign(request,{
 load=loadCatalogDonor,qualify=qualifyCatalogFinalRequest,
 create_factory=comparisonLiveClientFactory,
 verify_schedule=verifySchemaAgreementSchedule,
}={}){
 const {schedule,sources,donor_stage,donor_review_sha256,out,persistence,signal,credential_path,before_measure}=request;
 verify_schedule({schedule,...sources});
 need(schedule.slots.length===4&&schedule.fresh_control_runs===false&&schedule.slots.every(s=>s.arm==='schema-agreement'),'candidate-only');
 need(signal instanceof AbortSignal&&!signal.aborted&&typeof before_measure==='function','admission');
 const controller=new AbortController(),cancel=()=>controller.abort();
 signal.addEventListener('abort',cancel,{once:true});
 const rows=schedule.slots.map(s=>({slot_id:s.slot_id,status:'not-started',qualified:false,model_calls:0}));
 const donors=[];let next=0;
 const donorArgs=slot=>({stage:donor_stage,review_sha256:donor_review_sha256,sequence:slot.sequence,candidate_slot:slot});
 const check=async()=>{need(!controller.signal.aborted,'cancelled');need(await before_measure()===true,'storage-or-source-admission');return true;};
 async function worker(){
  while(next<4&&!controller.signal.aborted){
   const i=next++,slot=schedule.slots[i],donor=donors[i];let result;
   try{
    await check();
    const factory=create_factory({credential_path,signal:controller.signal,persistence,before_dispatch:check});
    result=await qualify({...donor,cell:slot.cell,out:join(out,String(i).padStart(2,'0')),persistence,signal:controller.signal,create_client:factory.create_client,measure_index_tokens:factory.measure_index_tokens,before_measure:check});
    need(result.qualified===true&&result.model_calls===0,'qualification-failed');
    await check();
    need(load(donorArgs(slot)).donor_sha256===donor.donor_sha256,'donor-drift');
    rows[i]={slot_id:slot.slot_id,status:'qualified',qualified:true,model_calls:0,donor_sha256:donor.donor_sha256,source_bindings:donor.source_bindings,result};
   }catch(error){
    const evidence=error.result??result;
    rows[i]={slot_id:slot.slot_id,status:'failed',qualified:false,model_calls:evidence?.model_calls??0,donor_sha256:donor.donor_sha256,source_bindings:donor.source_bindings,result:evidence??null,error:String(error.message)};
    controller.abort();
   }
  }
 }
 try{
  // Load every fixed donor before allowing any provider request.
  for(const slot of schedule.slots){await check();donors.push(load(donorArgs(slot)));}
  await Promise.all([worker(),worker()]);
  const report={schema:'are.ranked-read-final-campaign/v1',schedule_sha256:schedule.schedule_sha256,donor_review_sha256,qualified:rows.every(r=>r.qualified),model_calls:rows.reduce((n,r)=>n+r.model_calls,0),workers:2,rows,live_generation_admitted:false};
  try{persistence.writeJson(join(out,'RESULTS.json'),report,{final:true});}
  catch(error){error.result={...report,qualified:false,persistence_failure:String(error.message)};throw error;}
  return report;
 }finally{signal.removeEventListener('abort',cancel);}
}
