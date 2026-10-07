import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const [baseArg,stateArg]=process.argv.slice(2);
if(!baseArg||!stateArg)throw Error('Usage: node seed-dag.mjs http://127.0.0.1:8787 /absolute/isolated/state-directory');
const base=new URL(baseArg);
if(base.protocol!=='http:'||!['127.0.0.1','localhost'].includes(base.hostname)||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw Error('Only an exact loopback HTTP origin is allowed');
if(!stateArg.startsWith('/tmp/cyberalchemy-workspace-orchestrator.'))throw Error('State must be the isolated temporary Workspace orchestrator directory');
const stateDir=resolve(stateArg);
const origin=base.origin;
const runId='synthetic-orchestration-journey-v1';
const now=Date.now();

async function request(path,{intent,body}={}){
 const response=await fetch(origin+path,{method:body?'POST':'GET',headers:{...(body?{'content-type':'application/json'}:{}),...(intent?{'x-orchestrator-intent':intent}:{})},body:body?JSON.stringify(body):undefined});
 const value=await response.json();
 if(!response.ok)throw Error(`${path}: HTTP ${response.status}: ${JSON.stringify(value)}`);
 return value;
}

// This is one admitted Work Graph, not a picture assembled from invented UI states.
const stages=[
 ['intake','coordinator',[],'Record the bounded request and intended outcome'],
 ['context','context-builder',['intake'],'Collect source references and constraints'],
 ['source-map','researcher',['context'],'Inspect relevant implementation surfaces'],
 ['guardrails','policy-analyst',['context'],'Check effects and authority boundaries'],
 ['plan','planner',['source-map','guardrails'],'Join findings into an execution plan'],
 ['implement','builder',['plan'],'Produce the bounded candidate change'],
 ['unit-check','tester',['implement'],'Run focused behavioral checks'],
 ['policy-check','reviewer',['implement'],'Review the candidate against guardrails'],
 ['integration','integrator',['unit-check','policy-check'],'Join validation evidence'],
 ['evidence','observer',['integration'],'Assemble receipts and provenance'],
 ['review','owner-reviewer',['evidence'],'Present the result for owner review'],
 ['handoff','coordinator',['review'],'Record a bounded handoff'],
];
const capability=id=>`synthetic-journey-${id}`;
const strategy={
 schema_version:'orchestrator-strategy/v1',strategy_id:runId,version:'v1',
 intended_outcome:'SYNTHETIC: Bounded change from intake through review and handoff',
 root_work_ref:'root',
 work_definitions:[
  ...stages.map(([id,role,,purpose])=>({kind:'leaf',work_id:id,version:'v1',contract:capability(id),role_id:role,max_attempts:1,static_input:{synthetic:true,purpose}})),
  {kind:'composite',work_id:'root',version:'v1',nodes:stages.map(([id,,,],index)=>({node_id:id,work_ref:id,depends_on:stages[index][2],release:'root',quorum:null,role_id:null,max_attempts:null,static_input:{},when:null}))},
 ],
 lanes:[{lane_id:'journey',purpose:'Synthetic orchestration journey; no external work'}],
 agent_requirements:stages.map(([id])=>({requirement_id:`demo-${id}`,agent_ref:null,lane_id:'journey',node_selector:id,required_capabilities:[capability(id)]})),
 policies:{effects:'none',synthetic:true},limits:{deadline_seconds:3600,max_parallelism:2},
 adapter_requirements:[],inputs:{synthetic:true},evidence_expectations:{format:'demo-only'},
 result_reduction:{method:'reviewable-outputs'},authority_refs:['demo:synthetic-local-only'],
};

const existing=await request('/api/v1/state');
if(existing.runs.some(run=>run.run_id===runId))throw Error(`Run ${runId} already exists. Refusing to overwrite it.`);
const proposed=await request('/api/v1/proposals/direct',{intent:'compose-dispatch',body:{strategy,selected_adapter_refs:[]}});
const proposalId=proposed.proposal.proposal_id;
if(Object.keys(proposed.proposal.graph.nodes).length!==stages.length)throw Error('Proposal did not compile the expected twelve nodes');
await request(`/api/v1/proposals/${encodeURIComponent(proposalId)}/admit`,{intent:'admit-dispatch',body:{run_id:runId,admitted_at_ms:now,deadline_at_ms:now+3600_000,admission_authority_ref:'demo:synthetic-local-only'}});

// Stop before validation: the graph then shows accepted work, two ready branches,
// and a downstream join waiting for both branches. All outputs are synthetic.
for(const [index,id] of ['intake','context','source-map','guardrails','plan','implement'].entries()){
 const workerId=`worker:synthetic-journey-${id}`;
 const assignment=await request('/api/v1/workers',{intent:'worker-operation',body:{operation:'poll',worker_id:workerId,capabilities:[capability(id)],now_ms:now+index*10+1,ttl_ms:60_000}});
 if(assignment.kind!=='assignment'||assignment.value.run_id!==runId||assignment.value.command.node_id!==id)throw Error(`Expected assignment for ${runId}/${id}; got ${JSON.stringify(assignment)}`);
 const commandId=assignment.value.command.command_id;
 const fence=assignment.value.lease.fencing_token;
 await request('/api/v1/workers',{intent:'worker-operation',body:{operation:'begin',run_id:runId,command_id:commandId,worker_id:workerId,fencing_token:fence,now_ms:now+index*10+2}});
 const artifactPath=join(stateDir,'runtime','runs',runId,`${id}-output.json`);
 const artifact=JSON.stringify({result:{status:'SYNTHETIC ONLY',stage:id,finding:`Demonstration output for ${id}; no worker performed the described domain work.`,authority_effect:'none'}});
 await mkdir(join(stateDir,'runtime','runs',runId),{recursive:true});
 await writeFile(artifactPath,artifact,{flag:'wx'});
 const digest=createHash('sha256').update(artifact).digest('hex');
 const current=await request(`/api/v1/runs/${encodeURIComponent(runId)}`);
 await request('/api/v1/workers',{intent:'worker-operation',body:{operation:'complete',run_id:runId,expected_revision:current.revision,receipt:{receipt_id:`receipt:synthetic-journey-${id}`,command_id:commandId,worker_id:workerId,fencing_token:fence,event:{event_id:`event:synthetic-journey-${id}`,command_id:commandId,node_id:id,outcome:'succeeded',output_ref:{uri:artifactPath,sha256:digest},error:null},effect_disposition:'not_applicable',recorded_at_ms:now+index*10+3},now_ms:now+index*10+3}});
}

const run=await request(`/api/v1/runs/${encodeURIComponent(runId)}`);
const statuses=run.history.cursor.node_status;
if(Object.values(statuses).filter(status=>status==='succeeded').length!==6||!['issued','ready'].includes(statuses['unit-check'])||!['issued','ready'].includes(statuses['policy-check']))throw Error(`Unexpected final graph state: ${JSON.stringify(statuses)}`);
process.stdout.write(JSON.stringify({run_id:runId,phase:run.phase,revision:run.revision,nodes:stages.length,statuses,authority_effect:'none'})+'\n');
