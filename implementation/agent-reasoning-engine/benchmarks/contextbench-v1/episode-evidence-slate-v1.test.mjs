// Offline H55 episode integration tests; no model-quality claim.
// Open questions: ../../../../agent-reasoning-engine/research/contextbench-v1/PLAN-round33.md#open-questions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {runEpisode} from './episode-evidence-slate-v1.mjs';
import {bodyForReceipt,stable} from './delivery.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');

async function exercise(evidence_slate){
  const root=mkdtempSync(join(tmpdir(),'are-slate-episode-')),baseRoot=join(root,'base');mkdirSync(baseRoot);const source='alpha parser\nbeta token\n';writeFileSync(join(baseRoot,'parser.js'),source);
  const receipts=[],prompts=[];let requests=0;
  const delivered=prompt=>prompt.messages.filter(message=>message.role==='tool').map(message=>{try{return JSON.parse(message.content)?.output?.read_id}catch{return null}}).filter(Boolean);
  const transport=createStatelessRecyclingTransport({adapter_id:'slate-episode-fixture',source_ref:'episode-evidence-slate-v1.test.mjs',maximum_output_tokens:1024,measure_request:async()=>300,request_once:async({prompt})=>{
    requests++;const parsed=JSON.parse(prompt);prompts.push(parsed);let message,finish_reason;
    if(requests<=2){message={role:'assistant',tool_calls:[{id:`read-${requests}`,type:'function',function:{name:'read_file',arguments:stable({path:'parser.js',start_line:1,line_count:2,revision:'base'})}}]};finish_reason='tool_calls';}
    else{message={role:'assistant',tool_calls:[{id:'submit',type:'function',function:{name:'submit_context_selection',arguments:stable({summary:'Selected parser source.',context_read_ids:delivered(parsed).slice(0,1)})}}]};finish_reason='tool_calls';}
    const receipt={kind:'model',model:'glm-5.3-flash',output_cap:1024,reasoning_effort:'low',dispatched:true,status:200,input_tokens:300,output_tokens:20,finish_reason};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);return{receipt,final_bytes:stable({message,finish_reason})};
  }});
  const task={instance_id:'fixture',repo_url:'https://github.com/example/fixture.git',base_commit:'a'.repeat(40),problem_statement:'Fix alpha parser token handling.'};
  const recycler=openContextRecycling({transport,fixture_root:baseRoot,scope:{request:task.problem_statement},options:{directory:join(root,'state'),context_limit:8000,recycle_at:7000,safety_margin:1000,state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['base']}}});
  try{return{result:await runEpisode({task,arm:'baseline',client:{receipts,maximum_model_retries:0},recycler,tools:[{type:'function',function:{name:'read_file',parameters:{type:'object'}}}],execute_tool:async()=>({ok:true,output:{path:'parser.js',start_line:1,end_line:2,utf8:source.trimEnd(),source_sha256:hash(source)}}),source_context:()=>({repoRoot:baseRoot,snapshots:[],patch:''}),measure_index_tokens:async text=>Math.ceil(Buffer.byteLength(text)/4),limits:{maximum_calls:4,output_cap:1024,total_tokens:96000,index_entries:8,index_tokens:1024,terminal_submission:true,finalization_reserve_tokens:3000,finalization_calls:2,evidence_slate,evidence_slate_candidates:8,evidence_slate_bytes:4096,evidence_slate_tokens:1024},run_id:'fixture'}),prompts};}
  finally{recycler.close();rmSync(root,{recursive:true,force:true});}
}

test('treatment presents one receipt-bound slate only during finalization',async()=>{const {result,prompts}=await exercise(true);assert.equal(result.status,'final_context_selected',result.error);assert.equal(result.evidence_slate_presentations.length,1);const presentation=result.evidence_slate_presentations[0];assert.equal(presentation.fit.retained_candidates,1);assert.equal(presentation.model_calls,0);assert.equal(presentation.model_tokens,0);assert.ok(presentation.measured_tokens<=1024);assert.ok(prompts[2].messages.some(message=>message.content?.includes('FINALIZATION EVIDENCE CANDIDATES')));assert.ok(!prompts[0].messages.some(message=>message.content?.includes('FINALIZATION EVIDENCE CANDIDATES')));assert.ok(!prompts[1].messages.some(message=>message.content?.includes('FINALIZATION EVIDENCE CANDIDATES')));});

test('control uses identical numeric policy without presenting a slate',async()=>{const {result,prompts}=await exercise(false);assert.equal(result.status,'final_context_selected',result.error);assert.deepEqual(result.evidence_slate_presentations,[]);assert.ok(prompts.every(prompt=>!prompt.messages.some(message=>message.content?.includes('FINALIZATION EVIDENCE CANDIDATES'))));});
