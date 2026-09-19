// Orchestration faults only; native request behavior has separate loopback tests.
// Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate} from 'node:timers/promises';
import {qualifyRankedOutputCampaign} from './ranked-read-output-campaign-r1.mjs';
import {fixture as sourceFixture} from './ranked-read-test-fixture-r1.mjs';
function fixture(){
 const saved=[],calls=[],loads=new Map();let active=0,peak=0;
 const request={schedule:{fresh_control_runs:false,schedule_sha256:'fixture',slots:Array.from({length:4},(_,sequence)=>({sequence,slot_id:'s'+sequence,arm:'ranked-read-acquisition',cell:{}}))},sources:{},donor_stage:'fixture',donor_review_sha256:'fixture',out:'/fixture',persistence:{writeJson:(path,value)=>saved.push({path,value})},signal:new AbortController().signal,credential_path:'unused',before_measure:async()=>true};
 const deps={build:async()=>{const f=await sourceFixture();return {evidence:f.ranked_evidence.get(f.call.id),snapshots:[],provenance:{model_generated:false}};},verify_schedule:()=>true,load:({sequence})=>{loads.set(sequence,(loads.get(sequence)??0)+1);return {task:{instance_id:String(sequence)},donor_sha256:'d'+sequence,source_bindings:[]};},create_factory:()=>({create_client:()=>{},measure_index_tokens:()=>{}}),qualify:async args=>{calls.push(args.task.instance_id);active++;peak=Math.max(peak,active);await setImmediate();active--;return {qualified:true,source_output_visible:true,model_calls:0,receipts:[{kind:'tokenizer',status:200}]};}};
 return {request,deps,saved,calls,loads,peak:()=>peak};
}
test('four fixed finals use two workers and reverify every donor',async()=>{
 const f=fixture(),r=await qualifyRankedOutputCampaign(f.request,f.deps);
 assert.equal(r.qualified,true);assert.equal(r.rows.length,4);assert.equal(r.model_calls,0);
 assert.equal(f.peak(),2);assert.deepEqual([...f.loads.values()],[2,2,2,2]);assert.equal(f.saved.at(-1).value,r);
});
test('donor drift retains measured receipts and stops unstarted slots',async()=>{
 const f=fixture(),load=f.deps.load;
 f.deps.load=args=>{const d=load(args);return {...d,donor_sha256:f.loads.get(args.sequence)>1?'changed':d.donor_sha256};};
 const r=await qualifyRankedOutputCampaign(f.request,f.deps);
 assert.equal(r.qualified,false);assert.ok(f.calls.length<=2);assert.equal(r.rows.length,4);
 const failed=r.rows.find(x=>x.error?.includes('donor-drift'));
 assert.equal(failed.result.receipts[0].kind,'tokenizer');assert.ok(r.rows.some(x=>x.status==='not-started'));
});
test('qualification model witness remains in failed campaign accounting',async()=>{
 const f=fixture();f.deps.qualify=async()=>{const e=Error('tokenizer-only');e.result={qualified:false,model_calls:1,index_receipts:[{kind:'model'}]};throw e;};
 const r=await qualifyRankedOutputCampaign(f.request,f.deps);
 assert.equal(r.qualified,false);assert.ok(r.model_calls>0);assert.ok(r.rows.some(x=>x.result?.index_receipts?.[0].kind==='model'));
});
test('all donors preflight before any qualification',async()=>{
 const f=fixture(),load=f.deps.load;f.deps.load=args=>{if(args.sequence===3)throw Error('bad donor');return load(args);};
 await assert.rejects(qualifyRankedOutputCampaign(f.request,f.deps),/bad donor/);assert.equal(f.calls.length,0);
});
test('final persistence failure carries complete rows without a success claim',async()=>{
 const f=fixture();f.request.persistence.writeJson=(path,value,options)=>{if(options?.final)throw Error('disk failure');};
 await assert.rejects(qualifyRankedOutputCampaign(f.request,f.deps),e=>{assert.equal(e.result.qualified,false);assert.equal(e.result.rows.length,4);assert.equal(e.result.model_calls,0);assert.equal(e.result.persistence_failure,'disk failure');return true;});
});

test('fitting request without retained source cannot qualify campaign',async()=>{
 const f=fixture();f.deps.qualify=async()=>({qualified:true,source_output_visible:false,model_calls:0,receipts:[{kind:'tokenizer'}]});
 const r=await qualifyRankedOutputCampaign(f.request,f.deps);assert.equal(r.qualified,false);assert.ok(r.rows.some(x=>x.error?.includes('no-source')));
});
test('evidence persistence failure prevents any tokenizer factory',async()=>{
 const f=fixture();let clients=0;f.deps.create_factory=()=>{clients++;throw Error('unexpected');};
 f.request.persistence.writeJson=(path,value,options)=>{if(!options?.final)throw Error('evidence disk failure');};
 const r=await qualifyRankedOutputCampaign(f.request,f.deps);assert.equal(r.qualified,false);assert.equal(clients,0);assert.equal(r.rows.length,4);
});
