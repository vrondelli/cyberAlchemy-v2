import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {createCodexAppServerWrapper, createAppServerRpcClient, spawnAppServerRpcTransport, loadRepositoryProfile, protocolBindingCheck} from '../../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs';
import {createCanaryTransport,prompts,scoreOutput} from './harness.mjs';
const base=import.meta.dirname, root=resolve(base,'../../../../../../..');
const outputPath=resolve(base,'LIVE-RESULT.json');
if(existsSync(outputPath)) throw Error('Recorded run exists; preserve it. A new authorized epoch needs a new output path.');
const loaded=loadRepositoryProfile(resolve(base,'canary-profile.json'),root);
const profile=JSON.parse(readFileSync(resolve(root,'cyberAlchemy-v2/implementation/agent-reasoning-engine/benchmarks/real-reasoning-v1/profile.json')));
const version=execFileSync('codex',['--version'],{encoding:'utf8',timeout:10000}).trim();
const binding=loaded.ok?protocolBindingCheck(loaded.value.protocol_binding,version):loaded;
const report={schema_version:'are.interaction-learning-live/v2',status:'NOT_RUN',quality_status:'not_evaluable',configured_model:profile.live.model,
  observed_binary:version,turn_start_calls:0,optional_provider_calls:0,model_judge_calls:0,tool_events:[],threads:[],runs:[],usage:[],reason_codes:binding.reason_codes??[],authority_effect:'none'};
const save=()=>writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');
if(binding.ok){
  const scratch=mkdtempSync(resolve(tmpdir(),'are-learning-01531-')),deadline=Date.now()+30*60*1000;
  report.status='RUNNING';save();
  try{
    for(const variant of ['V0','V1','V2','V3']){
      let supplied={},summary=null;
      const wrapper=createCodexAppServerWrapper({loaded_profile:{...loaded.value,interaction_learning:{...loaded.value.interaction_learning,enabled:variant!=='V0',policy:{mode:variant==='V1'?'observe':'apply-scoped'}}},
        decision_profile:loaded.decision_profile,definition_catalog:loaded.definition_catalog,ontology_snapshot:loaded.ontology_snapshot,source_snapshot:loaded.source_snapshot,interaction_input_provider:()=>supplied});
      const raw=spawnAppServerRpcTransport({command:'codex',args:['app-server','--stdio','--disable','shell_tool','--disable','multi_agent']});
      const transport=createCanaryTransport(raw,wrapper,{onDispatch:message=>{
        if(Date.now()>=deadline||report.turn_start_calls>=24)throw Error('canary.dispatch-budget-exhausted');
        report.turn_start_calls++;report.last_dispatch={variant,id:message.id,sha256:createHash('sha256').update(JSON.stringify(message)).digest('hex')};save();
      },onServer:message=>{
        if(message.method==='thread/tokenUsage/updated')report.usage.push({variant,...message.params});
        if(message.method==='item/started' && !['userMessage','agentMessage','reasoning'].includes(message.params?.item?.type)){
          report.tool_events.push({variant,type:message.params?.item?.type});throw Error('canary.unexpected-tool-or-item');
        }
      }});
      const client=createAppServerRpcClient({transport,request_timeout_ms:60000,completion_timeout_ms:120000,thread_start_timeout_ms:60000});
      try{
        await client.initialize({clientInfo:{name:'are-interaction-learning-canary',version:'2'},capabilities:{experimentalApi:true}});
        client.notify('initialized');
        const thread=await client.startThread({cwd:scratch,ephemeral:true,model:profile.live.model,allowProviderModelFallback:false,approvalPolicy:'never',sandbox:'read-only',
          baseInstructions:'You are participating in a short text-only context-management test. Answer the user in one short paragraph. Do not use tools or delegate. Current explicit user instructions override earlier preferences.'});
        report.threads.push({variant,thread_id:thread.thread.id,observed_model:thread.model??null});save();
        if(thread.model!==profile.live.model)throw Error('canary.model-not-confirmed');
        for(let i=0;i<prompts.length;i++){
          supplied={};
          if(i===1 && variant!=='V0'){
            const prior=Object.values(wrapper.inspectLearningState({detail:true}).turns).at(-1);
            if(!prior?.outcome)throw Error('canary.prior-outcome-missing');
            supplied.feedback={episode_ref:prior.request_ref,quote:'Avoid jargon',instruction:'Avoid jargon in explanations.',target:'response',posture:'explicit',retention_scope:'current-interaction',correction_kind:'new-preference',expected_checks:[{check_id:'plain',kind:'excludes',value:'jargon'}]};
          }
          if(i===0||i===3)supplied.checks=[{check_id:'explicit-word',kind:'includes',value:'jargon'}];
          if(i===1)supplied.checks=[{check_id:'plain',kind:'excludes',value:'jargon'}];
          if(i===2)summary='Avoid jargon in explanations.';
          const params={threadId:thread.thread.id,input:[{type:'text',text:prompts[i]}],approvalPolicy:'never',sandboxPolicy:{type:'readOnly',networkAccess:false},
            ...(variant==='V1'&&summary?{additionalContext:{'canary.generic-summary':{kind:'application',value:summary}}}:{})};
          const started=performance.now();
          const done=await client.runTurn(params);
          const status=done.completed?.turn?.status;
          report.runs.push({variant,turn:i+1,request:prompts[i],turn_id:done.completed?.turn?.id,status,response:done.text,latency_ms:performance.now()-started,
            quality:scoreOutput(i,done.text,status),learning:wrapper.inspectLearningState(),applications:wrapper.inspectLearningState({detail:true}).applications});
          save();console.error(`${variant} turn ${i+1}/6 ${status}; literal-check=${report.runs.at(-1).quality.passed}`);
          if(status!=='completed')throw Error(`canary.turn-${status??'unknown'}`);
        }
      }finally{await client.close();await transport.close();}
    }
    report.status='PASS';report.quality_status=report.runs.every(r=>r.quality.passed)?'PASS':'FAIL';
    report.variant_scores=Object.fromEntries(['V0','V1','V2','V3'].map(v=>{const rows=report.runs.filter(r=>r.variant===v);return[v,{passed:rows.filter(r=>r.quality.passed).length,total:rows.length}];}));
    report.v3_minus_v0=report.variant_scores.V3.passed-report.variant_scores.V0.passed;
    report.learning_improvement=report.v3_minus_v0>0?'candidate-signal-only':'not-demonstrated';
  }catch(error){report.status='FAIL';report.reason_codes=[error.message];}
  finally{rmSync(scratch,{recursive:true,force:true});}
}
report.claim_limit='One six-turn scenario per variant, fixed order; literal compliance only. V2/V3 use the same explicit preference; this scenario does not isolate inferred learning. Usage is provider-reported only. No product approval or activation.';
save();console.log(JSON.stringify({status:report.status,quality:report.quality_status,turn_start_calls:report.turn_start_calls,reason_codes:report.reason_codes,result:outputPath}));
if(report.status==='FAIL')process.exitCode=1;
