import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync,writeSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport} from './packet-diversity-v1/context-recycling-bounded-v3.mjs';
import {bodyForReceipt,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {runPair} from './discovery-v1/run-recovery-pair.mjs';
import {exportTerminalEvidenceSelection} from './terminal-evidence.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {runRecoveryCampaign} from './recovery-campaign.mjs';
import {scoreRecoveryCampaign,summarizeRecoveryScores} from './score-recovery-campaign.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
test('complete paired generation, request verification, native reconstruction and fixed scoring gates',async()=>{
 const mode='paired';
 const review=true;let testReceipts;
 const root=mkdtempSync(join(tmpdir(),'are-v2-orchestrate-')),cache=join(root,'cache');mkdirSync(cache);
 const git=args=>execFileSync('git',args,{cwd:cache,stdio:['ignore','pipe','pipe']}).toString().trim();
 try{
  git(['init']);git(['config','user.name','fixture']);git(['config','user.email','fixture@example.invalid']);
  for(const name of ['a','b','c','d'])writeFileSync(join(cache,name+'.py'),name+' = 1\n');
  git(['add','.']);git(['commit','-m','fixture']);git(['remote','add','origin','https://github.com/example/fixture.git']);
  const task={instance_id:'fixture-v2',original_inst_id:'fixture-v2',repo:'example/fixture',repo_url:'https://github.com/example/fixture.git',language:'python',base_commit:git(['rev-parse','HEAD']),problem_statement:'Inspect the four fixture sources.',source:'fixture'};
  const task_path=join(root,'task.json');writeFileSync(task_path,stable(task));
  const cell={cell_id:'fixture-v2',instance_id:task.instance_id,arm:'baseline',context_limit:8000,recycle_at:7000,safety_margin:1000,limits:{maximum_calls:96,output_cap:2048,total_tokens:96000,finalization_reserve_tokens:14000,finalization_calls:2,output_deferral:true,index_entries:10,index_tokens:1000,terminal_submission:true,terminal_content_fallback:true,terminal_evidence_review:review,maximum_terminal_corrections:0,compact_representation:true,discovery_retention:true,recovery_visibility:mode==='demand'?'demand':'eager'}};
  const create_client=()=>{
   const receipts=[];testReceipts=receipts;let n=0;
   const transport=createStatelessRecyclingTransport({adapter_id:'fixture-v2',source_ref:'orchestrate.test.mjs',maximum_output_tokens:2048,measure_request:async({prompt})=>{const wire=JSON.parse(prompt);receipts.push({kind:'tokenizer',dispatched:true,status:200,input_tokens:200,request_sha256:hash(stable({model:'glm-5.3-flash',...wire})),retained_reasoning_reservation:0,retained_reasoning_occurrences:0});return 712;},
    request_once:async({prompt})=>{
     n++;const wire=JSON.parse(prompt);let message,finish_reason;
     if(n===1){message={role:'assistant',tool_calls:['a','b','c','d'].map(name=>({id:name,type:'function',function:{name:'read_file',arguments:stable({path:name+'.py',start_line:1,line_count:1,revision:'base'})}}))};finish_reason='tool_calls';}
     else if(review&&n===3){const tool=wire.tools[0];message={role:'assistant',tool_calls:[{id:'selected',type:'function',function:{name:tool.function.name,arguments:stable({summary:'Four sources',context_handles:tool.function.parameters.properties.context_handles.items.enum})}}]};finish_reason='tool_calls';}
     else{message={role:'assistant',content:stable({summary:'Candidate',context_read_ids:review?[]:wire.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.content).output.read_id)})};finish_reason='stop';}
     const receipt={kind:'model',model:'glm-5.3-flash',output_cap:2048,reasoning_effort:'low',dispatched:true,status:200,latency_ms:1,input_tokens:200,output_tokens:10,reserved_input_tokens:712,finish_reason};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);
     return {receipt,final_bytes:stable({message,finish_reason})};
    }});return {transport,receipts,maximum_model_retries:0};
  };
  const stage=join(root,'evidence');mkdirSync(stage);
  const source_root=join(root,'sources');mkdirSync(source_root);
  const tasks=[];
  for(let i=0;i<4;i++){const publicTask={...task,instance_id:'fixture-'+i},path=join(root,'task-'+i+'.json');writeFileSync(path,stable(publicTask));tasks.push({id:'task'+i,instance_id:publicTask.instance_id,task_path:path,task_sha256:hash(readFileSync(path)),repository_cache:cache,base_commit:task.base_commit,cell_template:{...cell,instance_id:publicTask.instance_id,provider_profile:{token_margin:512,reasoning_effort:'low'}}});}
  const config={context_limit:8000,total_tokens_per_arm:96000,credential_path:'unused',python:'unused',scorer:'unused',upstream:'unused',source_manifest:'unused',scoring_cache:'unused',tasks};
  const terminal=await runRecoveryCampaign({config,evidence_root:stage,source_root,binding:{},host_guard:()=>({admitted:true}),execute:args=>runPair({...args,client_factory:()=>({create_client,measure_index_tokens:async text=>Math.ceil(text.length/4)})})});
  assert.equal(terminal.status,'sealed');assert.equal(terminal.usage.total_tokens,5040);assert.equal(terminal.seal.summary.complete,true);
  let calls=0;const native_score=async({prediction})=>{calls++;assert.ok(prediction.traj_data.pred_spans['a.py']);return {native:{final:{span:{coverage:1,precision:1},file:{coverage:1,precision:1}}}};};
  const options={config,generation_root:stage,source_root,terminal,binding:{},host_guard:()=>({admitted:true}),native_score};
  const directory=join(root,'score');mkdirSync(directory);const result=await scoreRecoveryCampaign({...options,directory});
  assert.equal(calls,8);assert.equal(result.outcomes.length,8);assert.equal(result.known_tokens,5040);assert.equal(result.totals.treatment.perfect,4);assert.equal(result.gates.all_requests_verified,true);assert.equal(result.gates.all_eight_valid,true);assert.equal(result.gates.all_long_trajectories,false);assert.equal(result.development_target_passed,false);assert.equal(result.campaign_goal_achieved,false);assert.equal(result.new_provider_calls,0);
  const unsettled=join(root,'unsettled');mkdirSync(unsettled);calls=0;await assert.rejects(scoreRecoveryCampaign({...options,directory:unsettled,terminal:{...terminal,workers_settled:false}}),/settled-generation/);assert.equal(calls,0);
  const source=join(source_root,'task0-r1-control','base','a.py'),original=readFileSync(source);writeFileSync(source,'changed = 2\n');const drift=join(root,'drift');mkdirSync(drift);const rejected=await scoreRecoveryCampaign({...options,directory:drift});assert.equal(calls,0);assert.equal(rejected.outcomes.length,8);assert.equal(rejected.development_target_passed,false);assert.ok(rejected.outcomes.some(r=>r.status==='preflight-failed'));writeFileSync(source,original);
  const during=join(root,'during-score-drift');mkdirSync(during);let changed=false;const invalidated=await scoreRecoveryCampaign({...options,directory:during,native_score:async args=>{if(!changed){changed=true;writeFileSync(source,'drift during scoring\n');}return native_score(args);}});assert.equal(invalidated.post_score_integrity_verified,false);assert.equal(invalidated.outcomes.length,8);assert.ok(invalidated.outcomes.every(r=>!r.valid));assert.equal(invalidated.development_target_passed,false);writeFileSync(source,original);
  const configDrift=join(root,'config-drift');mkdirSync(configDrift);const savedId=config.tasks[0].id;const configRejected=await scoreRecoveryCampaign({...options,directory:configDrift,native_score:async args=>{config.tasks[0].id='mutated';return native_score(args);}});assert.equal(configRejected.post_score_integrity_verified,false);assert.equal(configRejected.outcomes.length,8);assert.equal(configRejected.outcomes[0].task_id,savedId);assert.equal(configRejected.development_target_passed,false);config.tasks[0].id=savedId;
  const failed=join(root,'native-failed');mkdirSync(failed);let failedCalls=0;const stopped=await scoreRecoveryCampaign({...options,directory:failed,native_score:async()=>{failedCalls++;throw Error('synthetic native failure');}});assert.equal(failedCalls,1);assert.equal(stopped.outcomes.length,8);assert.equal(stopped.gates.all_eight_valid,false);assert.equal(stopped.known_tokens,5040);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('quality and15percent full-token gates remain separate with fixed denominators',()=>{
 const task_ids=['a','b','c','d'],outcomes=task_ids.flatMap(task_id=>['control','treatment'].map(arm=>({task_id,arm,valid:true,metrics:{span_f1:1,file_f1:1},usage:{model_calls:10,total_tokens:arm==='control'?12000:10000},request_verification:{verified:true}})));
 const args={task_ids,outcomes,known_tokens:88000,unknown_usage_calls:0};assert.equal(summarizeRecoveryScores(args).development_target_passed,true);assert.equal(summarizeRecoveryScores(args).campaign_goal_achieved,false);
 const failed=structuredClone(args);failed.outcomes[1].metrics.file_f1=.9;assert.equal(summarizeRecoveryScores(failed).gates.treatment_each_task_perfect,false);
 const costly=structuredClone(args);for(const r of costly.outcomes)if(r.arm==='treatment')r.usage.total_tokens=11000;costly.known_tokens=92000;assert.equal(summarizeRecoveryScores(costly).gates.at_least_15_percent_reduction,false);
 assert.throws(()=>summarizeRecoveryScores({...args,outcomes:outcomes.slice(1)}),/denominator/);
});
