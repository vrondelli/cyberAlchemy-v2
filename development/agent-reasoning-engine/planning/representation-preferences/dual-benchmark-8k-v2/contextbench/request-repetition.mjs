// Offline, receipt-bound diagnostic. Open questions: EFFICIENCY-HYPOTHESES.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=x=>Buffer.byteLength(stable(x));
const need=(v,m)=>{if(!v)throw Error(m);};

export function analyze(result){
  const captures=new Map();
  for(const c of result.captures){
    need(hash(c.prompt)===c.prompt_sha256,'capture digest mismatch');
    captures.set(c.prompt_sha256,c.prompt);
  }
  const seen=new Set(),seenTools=new Set(),roles={};
  let input=0,output=0,toolBytes=0,repeatedToolBytes=0,messageBytes=0,repeatedMessageBytes=0;
  const calls=[];
  for(const [receiptIndex,r] of result.receipts.entries()){
    if(r.kind!=='model')continue;
    need(typeof r.dispatched==='boolean','unknown dispatch');
    if(!r.dispatched)continue;
    need(r.status===200&&!r.failure_code,'failed request requires separate accounting');
    need([r.input_tokens,r.output_tokens].every(n=>Number.isSafeInteger(n)&&n>=0),'unknown usage');
    const matches=[...captures.values()].filter(p=>hash(stable(bodyForReceipt(p,r)))===r.request_sha256);
    need(matches.length===1,'missing or ambiguous receipt-bound prompt');
    const request=JSON.parse(matches[0]);
    input+=r.input_tokens;output+=r.output_tokens;
    const tb=bytes(request.tools),th=hash(stable(request.tools));
    toolBytes+=tb;if(seenTools.has(th))repeatedToolBytes+=tb;seenTools.add(th);
    let mb=0,rb=0;const current=new Set();
    for(const m of request.messages){
      const n=bytes(m),h=hash(stable(m)),role=m.role;
      roles[role]??={bytes:0,previously_presented_bytes:0,occurrences:0};
      roles[role].bytes+=n;roles[role].occurrences++;mb+=n;
      if(seen.has(h)){rb+=n;roles[role].previously_presented_bytes+=n;}
      current.add(h);
    }
    for(const h of current)seen.add(h);
    messageBytes+=mb;repeatedMessageBytes+=rb;
    calls.push({receipt_index:receiptIndex,request_sha256:r.request_sha256,input_tokens:r.input_tokens,output_tokens:r.output_tokens,message_bytes:mb,previously_presented_message_bytes:rb,tools_bytes:tb});
  }
  return {calls: calls.length,input_tokens:input,output_tokens:output,total_tokens:input+output,message_bytes:messageBytes,previously_presented_message_bytes:repeatedMessageBytes,tools_bytes:toolBytes,previously_presented_tools_bytes:repeatedToolBytes,roles,requests:calls};
}

export function run(root,outputPath){
  const base='development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1';
  const bindings=[];
  const read=(path,expected)=>{const raw=readFileSync(resolve(root,path));const digest=hash(raw);need(!expected||digest===expected,'source drift');bindings.push({path,sha256:digest});return JSON.parse(raw);};
  const analysis=read(base+'/LIVE-FAILURE-ANALYSIS.json');
  const summary=read(base+'/LIVE-RESULTS.json');
  need(analysis.outcomes.length===8&&summary.outcomes.length===8,'fixed denominator mismatch');
  const outcomes=analysis.outcomes.map(o=>{
    const result=read(o.source_binding.path,o.source_binding.sha256),a=analyze(result);
    const matches=summary.outcomes.filter(s=>s.task_id===o.task_id&&s.arm===o.arm);
    need(matches.length===1,'outcome identity mismatch');
    const u=matches[0].usage;
    need(a.total_tokens===u.total_tokens&&a.input_tokens===u.prompt_tokens&&a.output_tokens===u.completion_tokens&&a.calls===u.model_calls&&!u.unknown_usage,'sealed usage mismatch');
    return {task_id:o.task_id,arm:o.arm,...a};
  });
  need(new Set(outcomes.map(o=>o.task_id+':'+o.arm)).size===8,'duplicate outcome');
  for(const b of bindings)need(hash(readFileSync(resolve(root,b.path)))===b.sha256,'post-analysis drift');
  const artifact={schema:'are.request-repetition/v1',status:'completed',outcomes,source_bindings:bindings,implementation_sha256:hash(readFileSync(new URL(import.meta.url))),model_calls:0,tokenizer_calls:0,gold_access:false,campaign_goal_achieved:false,limitations:['Serialized JSON bytes are not tokens or removable overhead.','Exact repeated messages can be essential continuity; this diagnostic does not recommend dropping them.','Counts are occurrence-weighted across separately dispatched requests; unsubmitted captures are excluded.','Tool-schema and message byte counts exclude outer framing and provider tokenization.','No causal or marginal token savings are established.'],open_questions_ref:'EFFICIENCY-HYPOTHESES.md'};
  const serialized=JSON.stringify(artifact,null,2)+'\n';need(Buffer.byteLength(serialized)<1048576,'output cap');
  writeFileSync(outputPath,serialized,{flag:'wx'});return artifact;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const r=run(process.cwd(),process.argv[2]);
  console.log(JSON.stringify(r.outcomes.map(({task_id,arm,calls,total_tokens,message_bytes,previously_presented_message_bytes,tools_bytes})=>({task_id,arm,calls,total_tokens,message_bytes,previously_presented_message_bytes,tools_bytes}))));
}
