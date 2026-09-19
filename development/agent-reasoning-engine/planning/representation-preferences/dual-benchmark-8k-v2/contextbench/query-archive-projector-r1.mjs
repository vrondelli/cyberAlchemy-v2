// Exact exchange recall only; no tool execution or delivery claim.
// Open questions: QUERY-ARCHIVE-CANDIDATE-R1.md.
import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('query-archive.'+m);};
const stop=new Set('the and for with from this that then into have does not are was what how when where which file path query read search tool result content true false null'.split(' '));
const terms=text=>new Set((text.toLowerCase().match(/[\p{L}\p{N}_]+/gu)??[]).filter(t=>t.length>1&&!stop.has(t)));
function exchanges(history){
 const groups=[];
 for(let i=0;i<history.length;){
  const assistant=history[i],calls=assistant?.tool_calls;
  need(assistant?.role==='assistant'&&Array.isArray(calls)&&calls.length>0,'complete-exchange-required');
  const ids=calls.map(c=>c?.id);
  need(ids.every(id=>typeof id==='string'&&id.length>0)&&new Set(ids).size===ids.length,'exchange-call-identities');
  need(calls.every(c=>c.type==='function'&&typeof c.function?.name==='string'&&c.function.name.length>0&&typeof c.function.arguments==='string'),'tool-function');
  const replies=history.slice(i+1,i+1+calls.length);
  need(replies.length===calls.length&&replies.every(r=>r?.role==='tool'&&ids.includes(r.tool_call_id)&&typeof r.content==='string')&&new Set(replies.map(r=>r.tool_call_id)).size===ids.length,'incomplete-exchange');
  const messages=history.slice(i,i+calls.length+1);
  groups.push({index:groups.length,ids,messages,terms:terms(calls.map(c=>c.function.arguments).join(' ')+' '+replies.map(r=>r.content).join(' '))});
  i+=messages.length;
 }
 return groups;
}

/** measure_request(history) must measure the full assembled request, including
 * tools, output reservation and margins. This pure projection does not dispatch,
 * admit, truncate or promote observations. Caller performs actual admission and
 * receipt binding after selection. The latest complete exchange is mandatory.
 */
export async function projectQueryArchive({history,task,measure_request,request_limit=8000,max_recalled_exchanges=4,max_candidates=16}){
 need(Array.isArray(history)&&typeof task==='string'&&typeof measure_request==='function','input');
 need(Number.isSafeInteger(request_limit)&&request_limit>0&&request_limit<=8000,'request-limit');
 need(Number.isSafeInteger(max_recalled_exchanges)&&max_recalled_exchanges>=0&&max_recalled_exchanges<=16,'recall-limit');
 need(Number.isSafeInteger(max_candidates)&&max_candidates>=0&&max_candidates<=64,'candidate-limit');
 const original=structuredClone(history),groups=exchanges(original),latest=groups.at(-1);
 const latestTerms=terms(latest?.messages[0].tool_calls.map(c=>c.function.arguments).join(' ')??'');
 const taskTerms=terms(task),selected=latest?[latest]:[],skipped=[],probes=[];
 const assemble=rows=>rows.slice().sort((a,b)=>a.index-b.index).flatMap(g=>g.messages);
 async function measure(rows){
  const messages=assemble(rows),digest=hash(messages),tokens=await measure_request(structuredClone(messages));
  need(Number.isSafeInteger(tokens)&&tokens>=0,'invalid-measurement');
  probes.push({history_sha256:digest,request_tokens:tokens});return tokens;
 }
 let total=await measure(selected);need(total<=request_limit,'latest-exchange-over-budget');
 const ranked=groups.slice(0,-1).map(g=>({...g,score:[...g.terms].reduce((sum,t)=>sum+(latestTerms.has(t)?3:0)+(taskTerms.has(t)?1:0),0)}))
  .filter(g=>g.score>0).sort((a,b)=>b.score-a.score||b.index-a.index);
 let considered=0;
 for(const g of ranked){
  if(selected.length-Number(Boolean(latest))>=max_recalled_exchanges||considered>=max_candidates)break;
  considered++;
  const used=new Set(selected.flatMap(s=>s.ids));
  if(g.ids.some(id=>used.has(id))){skipped.push({index:g.index,reason:'call-id-collision'});continue;}
  const measured=await measure([...selected,g]);
  if(measured>request_limit){skipped.push({index:g.index,reason:'request-budget'});continue;}
  selected.push(g);total=measured;
 }
 const output=assemble(selected);
 return {history:structuredClone(output),projection:{policy:'query-archive-r1',archive_sha256:hash(original),output_sha256:hash(output),
  archive_exchanges:groups.length,selected_indices:selected.map(g=>g.index).sort((a,b)=>a-b),ranked_candidates:ranked.length,
  considered_candidates:considered,skipped,measurement_probes:probes,request_tokens:total,request_limit,
  latest_exchange_preserved:Boolean(latest),delivery_confirmed:false,dispatch_admitted:false}};
}
