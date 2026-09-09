import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createCodexAppServerWrapper,createAppServerRpcClient,spawnAppServerRpcTransport,loadRepositoryProfile,protocolBindingCheck} from '../../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs';
import {createCanaryTransport} from '../live-compatibility-v2/harness-v3.mjs';
import {feedbackFor,prepareArm,score,hash} from './experiment.mjs';
const base=import.meta.dirname,root=resolve(base,'../../../../../../..'),out=resolve(base,'RESULT.json');
if(existsSync(out))throw Error('Result exists; no automatic retry or overwrite.');
const corpus=JSON.parse(readFileSync(resolve(base,'cases.json'))),manifest=JSON.parse(readFileSync(resolve(base,'MANIFEST.json')));
for(const entry of manifest.files){const bytes=readFileSync(resolve(root,entry.path));if(createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error(`Frozen input drift: ${entry.path}`);}
const loaded=loadRepositoryProfile(resolve(base,'../live-compatibility-v2/canary-profile.json'),root);
const version=execFileSync('codex',['--version'],{encoding:'utf8',timeout:10000}).trim();
if(!loaded.ok||!protocolBindingCheck(loaded.value.protocol_binding,version).ok)throw Error('Protocol binding unavailable');
const report={schema_version:'are.fresh-thread-result/v1',status:'RUNNING',quality_status:'not_evaluable',model:manifest.model,binary:version,manifest_digest:manifest.manifest_digest,
  model_calls:0,optional_provider_calls:0,model_judge_calls:0,threads:[],training:[],evaluation:[],dispatches:[],usage:[],tool_events:[],authority_effect:'none'};
const save=()=>writeFileSync(out,JSON.stringify(report,null,2)+'\n');save();
const startedAt=Date.now(),deadline=startedAt+30*60*1000,scratch=mkdtempSync(resolve(tmpdir(),'are-fresh-thread-'));
let supplied={},current=null,phase='initialize';
const wrapper=createCodexAppServerWrapper({loaded_profile:{...loaded.value,interaction_learning:{...loaded.value.interaction_learning,policy:{mode:'apply-scoped'}}},
 decision_profile:loaded.decision_profile,definition_catalog:loaded.definition_catalog,ontology_snapshot:loaded.ontology_snapshot,source_snapshot:loaded.source_snapshot,interaction_input_provider:()=>supplied});
const raw=spawnAppServerRpcTransport({command:'codex',args:['app-server','--stdio','--disable','shell_tool','--disable','multi_agent','--disable','memories','--disable','external_agent_memory_import']});
const transport=createCanaryTransport(raw,wrapper,{onDispatch:message=>{
 if(Date.now()>=deadline||report.model_calls>=24)throw Error('experiment.dispatch-budget-exceeded');
 const wire=JSON.stringify(message),view=JSON.parse(message.params.additionalContext['cyberalchemy.are.interaction-learning'].value);
 if(current?.arm==='A' && corpus.training.some(f=>wire.includes(f.instruction)))throw Error('experiment.baseline-memory-leak');
 report.model_calls++;report.dispatches.push({phase,current,thread_id:message.params.threadId,request:message.params.input,wire_digest:hash(wire),selected_lessons:view.items,assessments:view.assessments,
  memory_summary_present:Boolean(message.params.additionalContext['experiment.memory-summary'])});save();
},onServer:message=>{
 if(message.method==='thread/tokenUsage/updated')report.usage.push(message.params);
 if(message.method==='item/started'&&!['userMessage','agentMessage','reasoning'].includes(message.params?.item?.type)){report.tool_events.push(message.params?.item?.type);throw Error('experiment.unexpected-tool');}
}});
const client=createAppServerRpcClient({transport,request_timeout_ms:60000,thread_start_timeout_ms:240000,completion_timeout_ms:120000});
let heartbeat=setInterval(()=>console.error(`${phase}; calls=${report.model_calls}/24; completed=${report.training.length+report.evaluation.length}; elapsed=${Math.round((Date.now()-startedAt)/1000)}s`),30000);
async function freshThread(label){
 if(Date.now()>=deadline)throw Error('experiment.deadline-exceeded');phase=`thread/start ${label}`;
 const time=performance.now();const result=await client.startThread({cwd:scratch,ephemeral:true,model:manifest.model,allowProviderModelFallback:false,approvalPolicy:'never',sandbox:'read-only',
  baseInstructions:'Answer the current user concisely in plain text without markdown formatting. Do not use tools or delegate. Current explicit instructions take priority over retained preferences.'});
 if(result.model!==manifest.model)throw Error('experiment.model-not-confirmed');
 const id=result.thread.id;if(report.threads.some(t=>t.id===id)||result.thread.turns?.length)throw Error('experiment.thread-not-fresh');
 report.threads.push({id,label,method:'thread/start',model:result.model,returned_history_length:result.thread.turns?.length??null,startup_ms:performance.now()-time});save();return id;
}
async function turn(threadId,text,additionalContext){
 phase=`turn/start ${current?.case_id??current?.family??''} ${current?.arm??'training'}`;
 const before=performance.now();const result=await client.runTurn({threadId,input:[{type:'text',text}],approvalPolicy:'never',sandboxPolicy:{type:'readOnly',networkAccess:false},...(additionalContext?{additionalContext}:{})});
 const row={...current,thread_id:threadId,turn_id:result.completed?.turn?.id,status:result.completed?.turn?.status,request:text,response:result.text,latency_ms:performance.now()-before};
 if(row.status!=='completed'){report.failed_turn=row;save();throw Error(`experiment.turn-${row.status??'unknown'}`);}
 return row;
}
try{
 await client.initialize({clientInfo:{name:'are-fresh-thread-transfer',version:'1'},capabilities:{experimentalApi:true}});client.notify('initialized');
 for(const family of corpus.training){
  const id=await freshThread(`training:${family.id}`);current={family:family.id,stage:'initial'};supplied={};
  report.training.push(await turn(id,family.initial));save();
  const previous=Object.values(wrapper.inspectLearningState({detail:true}).turns).find(t=>t.interaction_ref===id);if(!previous?.outcome)throw Error('experiment.training-outcome-missing');
  current={family:family.id,stage:'correction'};supplied={feedback:feedbackFor(family,previous.request_ref)};
  report.training.push(await turn(id,family.correction));save();
 }
 const trained=wrapper.inspectLearningState({detail:true});
 if(Object.keys(trained.lessons).length!==3)throw Error('experiment.lesson-count-invalid');
 report.trained_lessons=Object.values(trained.lessons);report.frozen_lesson_digests=report.trained_lessons.map(l=>l.record_digest);save();
 for(const entry of corpus.evaluation)for(const arm of entry.arm_order){
  current={case_id:entry.id,family:entry.family,kind:entry.kind,arm};
  const prepared=prepareArm(wrapper,arm,entry,corpus.training,`${entry.id}:${arm}`);supplied=prepared.input;
  const id=await freshThread(`evaluation:${entry.id}:${arm}`);
  const row=await turn(id,entry.request,prepared.additionalContext);row.applications=wrapper.inspectLearningState({detail:true}).applications.filter(a=>a.request_ref===Object.values(wrapper.inspectLearningState({detail:true}).turns).find(t=>t.interaction_ref===id).request_ref);
  report.evaluation.push(row);save();console.error(`${entry.id} ${arm} completed`);
 }
 // Scoring reads the separate rubric only after all treatments have produced output.
 const rubric=JSON.parse(readFileSync(resolve(base,'rubric.json')));
 for(const row of report.evaluation)row.score=score(row.response,row.status,rubric[row.case_id]);
 report.arm_results=Object.fromEntries(['A','B','C'].map(arm=>{const rows=report.evaluation.filter(r=>r.arm===arm);return[arm,{applicable_passes:rows.filter(r=>r.kind==='applicable'&&r.score.passed).length,applicable_total:3,control_passes:rows.filter(r=>r.kind==='control'&&r.score.passed).length,control_total:3}];}));
 report.status='PASS';report.transfer_supported=report.arm_results.C.applicable_passes>report.arm_results.A.applicable_passes&&report.arm_results.C.control_passes===3;
 report.scoped_advantage_over_summary=report.arm_results.C.applicable_passes+report.arm_results.C.control_passes>report.arm_results.B.applicable_passes+report.arm_results.B.control_passes&&report.arm_results.C.control_passes===3;
 report.quality_status=report.transfer_supported?'PASS-transfer-only':'NO_TRANSFER_GAIN';
 if(JSON.stringify(Object.values(wrapper.inspectLearningState({detail:true}).lessons).map(l=>l.record_digest))!==JSON.stringify(report.frozen_lesson_digests))throw Error('experiment.test-time-lesson-mutation');
}catch(error){report.status='FAIL';report.reason=error.message;report.details=error.details??null;}
finally{
 clearInterval(heartbeat);report.elapsed_ms=Date.now()-startedAt;report.stderr_bytes=Buffer.byteLength(raw.inspect().stderr);report.stderr_digest=hash(raw.inspect().stderr);
 await client.close();await transport.close();rmSync(scratch,{recursive:true,force:true});
 report.claim_limit='Three synthetic explicit conventions, six unseen requests, one observation per arm/case. Host supplies typed feedback and scope. Tests retained-memory transfer, not autonomous discovery, weight learning or general product quality.';save();
}
console.log(JSON.stringify({status:report.status,quality_status:report.quality_status,model_calls:report.model_calls,reason:report.reason??null,result:out}));
if(report.status==='FAIL')process.exitCode=1;
