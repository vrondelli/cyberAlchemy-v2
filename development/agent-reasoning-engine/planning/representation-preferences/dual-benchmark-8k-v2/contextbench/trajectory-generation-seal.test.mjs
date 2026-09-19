import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {accountReceipts} from './discovery-v1/run.mjs';
import {trajectorySealContract,persistTrajectorySeal,loadTrajectorySeal} from './trajectory-generation-seal.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
function row(task_id,arm,status='completed'){
 const receipts=status==='not-started'?[]:[{kind:'model',dispatched:true,input_tokens:100,output_tokens:20,reserved_input_tokens:7000,output_cap:1000}];
 return {schema:'are.trajectory-slot/v1',slot_id:task_id+':'+arm,task_id,arm,status,transport_settled:true,receipts,usage:accountReceipts(receipts),dispatches:receipts.map(()=>({input_upper_bound:7000,output_reservation:1000,projected_upper_bound:8000})),...(status==='completed'?{episode_status:'final_context_selected',native_export:{prediction:{instance_id:'synthetic'}}}:{reason:'shared stop',native_export:null})};
}
test('guarded final seal retains all paired slots, failed costs and undispatched placeholders',()=>{
 const root=mkdtempSync(join(tmpdir(),'trajectory-seal-'));try{
  const task_ids=['a','b'],persistence=createStagePersistence({stage_root:root,stage_guard:createStageOutputGuard({root})});
  const records=[row('a','control'),row('a','treatment','failed'),row('b','control','not-started'),row('b','treatment','not-started')];
  // An interrupted dispatched request keeps unknown usage and the full8K reservation.
  records[1].receipts=[{kind:'model',dispatched:true,reserved_input_tokens:7000,output_cap:1000}];records[1].usage=accountReceipts(records[1].receipts);
  const slots=records.map((r,i)=>{const path='slot'+i+'.json';persistence.writeJson(join(root,path),r);return {slot_id:r.slot_id,path,sha256:createHash('sha256').update(readFileSync(join(root,path))).digest('hex')};});
  const args={root,task_ids,slots,persistence,workers_settled:true};
  assert.throws(()=>persistTrajectorySeal({...args,workers_settled:false}),/workers/);
  assert.throws(()=>persistTrajectorySeal({...args,slots:slots.slice(0,3)}),/denominator/);
  const seal=persistTrajectorySeal(args);assert.equal(seal.summary.complete,false);assert.equal(seal.summary.arms.control.total_tokens,120);assert.equal(seal.summary.arms.treatment.conservative_total_tokens,8000);assert.equal(seal.summary.assigned,4);
  assert.deepEqual(loadTrajectorySeal({...args,seal}).map(r=>r.result),records);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('reject false completion, discarded costs, unsettled transport and over-window requests',()=>{
 const {validate}=trajectorySealContract({task_ids:['a']});
 const check=r=>validate({slot_id:'a:control',result:r});assert.equal(check(row('a','control')),true);
 for(const mutate of [r=>r.usage.total_tokens=0,r=>r.transport_settled=false,r=>r.dispatches[0].projected_upper_bound=8001,r=>r.receipts[0].output_tokens=null,r=>r.native_export=null,r=>r.arm='treatment',r=>{r.receipts[0].input_tokens=9000;r.usage=accountReceipts(r.receipts);},r=>{r.receipts[0].dispatched=false;r.usage=accountReceipts(r.receipts);r.dispatches=[];},r=>r.receipts[0].output_cap=999]){
  const r=row('a','control');mutate(r);assert.throws(()=>check(r));
 }
 const r=row('a','control','not-started');r.receipts=[{kind:'model',dispatched:false}];assert.throws(()=>check(r),/empty/);
});
