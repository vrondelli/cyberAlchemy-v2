import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const [baseArg,stateArg]=process.argv.slice(2);
if(!baseArg||!stateArg)throw Error('Usage: node seed.mjs http://127.0.0.1:8787 /absolute/isolated/state-directory');
const base=new URL(baseArg);
if(base.protocol!=='http:'||!['127.0.0.1','localhost'].includes(base.hostname)||base.username||base.password||base.pathname!=='/'||base.search||base.hash){
 throw Error('Only an exact loopback HTTP origin is allowed');
}
if(!stateArg.startsWith('/tmp/cyberalchemy-workspace-orchestrator.'))throw Error('State must be the isolated temporary Workspace orchestrator directory');
const stateDir=resolve(stateArg);
const origin=base.origin;
const now=Date.now();

async function request(path,{intent,body}={}){
 const response=await fetch(origin+path,{method:body?'POST':'GET',headers:{...(body?{'content-type':'application/json'}:{}),...(intent?{'x-orchestrator-intent':intent}:{})},body:body?JSON.stringify(body):undefined});
 const value=await response.json();
 if(!response.ok)throw Error(`${path}: HTTP ${response.status}: ${JSON.stringify(value)}`);
 return value;
}

function strategy(id,outcome){
 return {
  schema_version:'orchestrator-strategy/v1',strategy_id:id,version:'v1',intended_outcome:outcome,
  root_work_ref:'root',work_definitions:[
   {kind:'leaf',work_id:'analyze',version:'v1',contract:'analyze',role_id:'analyst',max_attempts:1,static_input:{synthetic:true,question:outcome}},
   {kind:'composite',work_id:'root',version:'v1',nodes:[{node_id:'analysis',work_ref:'analyze',depends_on:[],release:'root',quorum:null,role_id:null,max_attempts:null,static_input:{},when:null}]},
  ],
  lanes:[{lane_id:'analysis',purpose:'Synthetic demonstration'}],
  agent_requirements:[{requirement_id:'demo-analyst',agent_ref:null,lane_id:'analysis',node_selector:'analysis',required_capabilities:['analyze']}],
  policies:{effects:'none',synthetic:true},limits:{deadline_seconds:3600,max_parallelism:1},
  adapter_requirements:[],inputs:{synthetic:true},evidence_expectations:{format:'demo'},result_reduction:{method:'single-output'},
  authority_refs:['demo:synthetic-local-only'],
 };
}

async function admit(id,outcome){
 const proposed=await request('/api/v1/proposals/direct',{intent:'compose-dispatch',body:{strategy:strategy(id,outcome),selected_adapter_refs:[]}});
 const proposalId=proposed.proposal.proposal_id;
 return request(`/api/v1/proposals/${encodeURIComponent(proposalId)}/admit`,{intent:'admit-dispatch',body:{run_id:id,admitted_at_ms:now,deadline_at_ms:now+3600_000,admission_authority_ref:'demo:synthetic-local-only'}});
}

const completedId='synthetic-completed-review';
const cancelledId='synthetic-cancelled-review';
const activeId='synthetic-active-review';
const existing=new Set((await request('/api/v1/state')).runs.map(run=>run.run_id));
if([completedId,cancelledId,activeId].some(id=>existing.has(id))){
 throw Error('A synthetic run already exists in this runtime. Refusing to duplicate or overwrite it.');
}

await admit(completedId,'SYNTHETIC: Review a bounded design question');
const assignment=await request('/api/v1/workers',{intent:'worker-operation',body:{operation:'poll',worker_id:'worker:synthetic-demo',capabilities:['analyze'],now_ms:now+1,ttl_ms:60_000}});
if(assignment.kind!=='assignment'||assignment.value.run_id!==completedId)throw Error('Expected only the synthetic completed run to receive a worker assignment');
const commandId=assignment.value.command.command_id;
const fence=assignment.value.lease.fencing_token;
await request('/api/v1/workers',{intent:'worker-operation',body:{operation:'begin',run_id:completedId,command_id:commandId,worker_id:'worker:synthetic-demo',fencing_token:fence,now_ms:now+2}});
const artifactPath=join(stateDir,'runtime','runs',completedId,'synthetic-result.json');
const artifact=JSON.stringify({result:{status:'SYNTHETIC PASS',finding:'This output was generated only to demonstrate the Control Center state, receipt, event trace, and result view.'}});
await mkdir(join(stateDir,'runtime','runs',completedId),{recursive:true});
await writeFile(artifactPath,artifact,{flag:'wx'});
const digest=createHash('sha256').update(artifact).digest('hex');
await request('/api/v1/workers',{intent:'worker-operation',body:{operation:'complete',run_id:completedId,expected_revision:0,receipt:{receipt_id:'receipt:synthetic-demo',command_id:commandId,worker_id:'worker:synthetic-demo',fencing_token:fence,event:{event_id:'event:synthetic-demo',command_id:commandId,node_id:'analysis',outcome:'succeeded',output_ref:{uri:artifactPath,sha256:digest},error:null},effect_disposition:'not_applicable',recorded_at_ms:now+3},now_ms:now+3}});

await admit(cancelledId,'SYNTHETIC: Show an operator-cancelled run');
await request(`/api/v1/runs/${cancelledId}/cancel`,{intent:'cancel-run',body:{expected_revision:0,control_id:'control:synthetic-cancel',reason:'Synthetic demonstration of cancellation',now_ms:now+4}});

await admit(activeId,'SYNTHETIC: Show a run awaiting a worker');
const state=await request('/api/v1/state');
const runs=state.runs.filter(run=>[completedId,cancelledId,activeId].includes(run.run_id));
if(runs.length!==3)throw Error(`Expected three synthetic runs, found ${runs.length}`);
process.stdout.write(JSON.stringify(runs.map(run=>({run_id:run.run_id,phase:run.phase})))+'\n');
