// Native episode + real recycler + synthetic receipts. No provider or gold.
// Open Questions: evidence/G02-NATIVE-CANDIDATE-WORKSPACE-R1.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {buildNativeWorkspaceOverlay} from './build-native-workspace-overlay-r1.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../coding-agent-runtime/context-recycling.mjs';
import {stable,bodyForReceipt,bindDelivery} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const project=resolve(here,'../../../../../..');
const canonical=join(project,'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/episode-recovery-v2.mjs');
const archived='/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002/pairs/01-pr11-mixed-01/raw/code/episode-recovery-v2.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const batchPolicy=join(dirname(canonical),'../full-cycle-79/snapshot/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/tool-batch-policy.mjs');

async function exercise({badQuote=false,oversize=false}={}){
  const dir=mkdtempSync(join(tmpdir(),'g02-workspace-native-'));const base=join(dir,'base');mkdirSync(base);
  const utf8='function alpha() { return 2; }\n';writeFileSync(join(base,'alpha.js'),utf8);
  const snapshot={path:'alpha.js',utf8,source_sha256:sha(utf8)};
  let overlay=buildNativeWorkspaceOverlay(readFileSync(archived,'utf8'),
    {moduleSpecifier:pathToFileURL(join(here,'candidate-workspace-r1.mjs')).href});
  // Only the local test materialization relocates the pinned native imports.
  assert.equal(sha(readFileSync(batchPolicy)),'a7e21ab77b111bfde17da1bc4b4084e9137039782eee4509acfa900d1151c1df');
  overlay=overlay.replace(/from '([^']+)'/g,(m,s)=>s.startsWith('.')
    ?`from '${pathToFileURL(s==='../tool-batch-policy.mjs'?batchPolicy:resolve(dirname(canonical),s)).href}'`:m);
  const module=join(dir,'episode.mjs');writeFileSync(module,overlay,{flag:'wx'});
  const {runEpisode}=await import(pathToFileURL(module));
  const receipts=[],prompts=[],events=[];let requests=0;
  const call=(name,args)=>({id:'call-'+requests,type:'function',function:{name,arguments:stable(args)}});
  const transport=createStatelessRecyclingTransport({adapter_id:'workspace-fixture',source_ref:'native-workspace-overlay-r1.test.mjs',maximum_output_tokens:512,
    measure_request:async({prompt})=>oversize&&JSON.parse(prompt).messages.some(m=>m.content?.includes('"generation":1'))?7900:200,
    request_once:async({prompt})=>{
      requests++;const p=JSON.parse(prompt);prompts.push(p);let message,finish_reason='tool_calls';
      if(p.tools.some(t=>t.function.name==='submit_context_handles_v2')){
        message={role:'assistant',tool_calls:[call('submit_context_handles_v2',{summary:'Selected original source.',context_handles:['h0']})]};
      }else if(requests===1){
        message={role:'assistant',tool_calls:[call('read_file',{path:'alpha.js',start_line:1,line_count:1,revision:'base'})]};
      }else if(requests===2){
        const read=bindDelivery({captures:[{prompt,prompt_sha256:sha(prompt)}],receipts:[]});
        // Obtain the exact delivered read ID from the public read envelope.
        const envelope=p.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.content)).find(v=>v.output?.read_id);
        assert.ok(envelope);assert.equal(read.read_observations.length,0,'tokenizer capture is not delivery');
        message={role:'assistant',tool_calls:[call('update_candidate',{path:'alpha.js',status:'plausible',reason:'Implements the return shown by this fixture.',question:'',evidence:[{
          read_id:envelope.output.read_id,start_line:1,end_line:1,quote:badQuote?'return 9':'return 2'}]})]};
      }else{
        message={role:'assistant',content:stable({summary:'Ready for native review.',context_read_ids:[]})};finish_reason='stop';
      }
      const receipt={kind:'model',dispatched:true,status:200,model:'glm-5.3-flash',reasoning_effort:'low',output_cap:512,input_tokens:200,output_tokens:10,finish_reason};
      receipt.request_sha256=sha(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);
      return {receipt,final_bytes:stable({message,finish_reason})};
    }});
  const recycler=openContextRecycling({transport,fixture_root:base,scope:{request:'Inspect alpha return.'},
    options:{directory:join(dir,'state'),context_limit:8000,recycle_at:7000,safety_margin:1000,
      state:{objective:'Inspect alpha return.',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['base']}}});
  try{
    const result=await runEpisode({task:{instance_id:'fixture',problem_statement:'Inspect alpha return.'},arm:'baseline',client:{receipts,maximum_model_retries:0},recycler,
      tools:[{type:'function',function:{name:'read_file',parameters:{type:'object'}}}],execute_tool:async(name)=>{
        assert.equal(name,'read_file','workspace updates must not reach repository executor');
        return {ok:true,output:{...snapshot,utf8:utf8.trimEnd(),start_line:1,end_line:1}};},
      source_context:()=>({snapshots:[snapshot],repoRoot:base,patch:''}),measure_index_tokens:async text=>Math.ceil(text.length/4),
      limits:{maximum_calls:5,output_cap:512,total_tokens:80000,index_entries:8,index_tokens:1024,
        terminal_submission:true,terminal_content_fallback:true,maximum_terminal_corrections:0,incomplete_output_corrections:0,
        terminal_evidence_review:true,terminal_evidence_version:'base-valid-handles-v2',terminal_evidence_max_handles:32,
        terminal_evidence_max_state_bytes:8192,terminal_evidence_max_state_tokens:2048,compact_representation:true,discovery_retention:false},
      run_id:'fixture',on_event:async e=>events.push(e)});
    return {result,prompts,events,requests};
  }finally{recycler.close();rmSync(dir,{recursive:true,force:true});}
}

test('overlay rejects source drift before materialization',()=>{
  assert.throws(()=>buildNativeWorkspaceOverlay('different source'),/base-drift/);
});
test('native loop records cited workspace and retains native terminal selection',async()=>{
  const r=await exercise();assert.equal(r.result.status,'final_context_selected',r.result.error);
  assert.equal(r.requests,4);assert.equal(r.result.candidate_workspace.generation,1);
  assert.equal(r.events.filter(e=>e.kind==='candidate-workspace-update').length,1);
  assert.equal(r.result.selection.final_read_ids.length,1);
  assert.ok(r.prompts[2].messages.some(m=>m.content?.includes('"generation":1')));
  assert.ok(r.prompts.at(-1).messages.some(m=>m.content?.includes('"generation":1')));
  assert.ok(!r.prompts.at(-1).tools.some(t=>t.function.name==='update_candidate'));
  assert.equal(r.result.receipts.reduce((n,r)=>n+r.input_tokens+r.output_tokens,0),4*210);
});
test('invented quote returns rejected update without changing native evidence',async()=>{
  const r=await exercise({badQuote:true});assert.equal(r.result.status,'final_context_selected',r.result.error);
  assert.equal(r.result.candidate_workspace.generation,0);
  const update=r.result.events.find(e=>e.tool==='update_candidate');assert.equal(update.output.ok,false);
  assert.match(update.output.error,/quote-not-in-cited-lines/);assert.equal(r.result.selection.final_read_ids.length,1);
});
test('workspace projection cannot bypass actual request admission',async()=>{
  const r=await exercise({oversize:true});assert.equal(r.requests,2);
  assert.equal(r.result.status,'context_budget_stopped',r.result.error);
  assert.equal(r.result.selection,null);assert.equal(r.result.candidate_workspace.generation,1);
});
