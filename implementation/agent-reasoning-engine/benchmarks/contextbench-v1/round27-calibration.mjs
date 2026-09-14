import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {bindDelivery} from './delivery.mjs';
import {credentials} from '../glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs';
import {MODEL,postOnce,stable} from '../external-context-v1/holdout-v1/transport.mjs';

const hash=value=>createHash('sha256').update(typeof value==='string'?value:stable(value)).digest('hex');
const fileHash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const need=(value,code)=>{if(!value)throw Error(`round27.${code}`);};
const LIVE='/home/vrondelli/.cache/are/contextbench-round26-live';
const REVISION=process.argv.includes('--round27b')?'round27b':'round27';
const OUT=`/home/vrondelli/.cache/are/contextbench-${REVISION}-calibration`;
const RESEARCH='agent-reasoning-engine/research/contextbench-v1';
const AVAILABILITY=`${RESEARCH}/round27-oracle-availability.json`;
const MATRIX=`${RESEARCH}/development-matrix-v26.json`;
const FREEZE=`${RESEARCH}/freeze-${REVISION}-calibration.json`;
const CREDENTIAL='/home/vrondelli/.config/are/glm-flash-credential.json';
const OUTPUT_CAP=512;

export function placeboIds(cellId,observations,count){
  return [...observations].sort((a,b)=>hash(`round27-placebo-v1:${cellId}:${a.id}`).localeCompare(hash(`round27-placebo-v1:${cellId}:${b.id}`))).slice(0,count).map(x=>x.id);
}

export function buildPrompt(basePrompt,rankedIds,paddingCount=0){
  const prompt=JSON.parse(basePrompt);need(Array.isArray(prompt.messages)&&Array.isArray(prompt.tools),'prompt-shape');
  const submit=prompt.tools.find(x=>x?.function?.name==='submit_context_selection');need(submit,'submit-tool-missing');
  const instruction={role:'user',content:'Diagnostic evidence ranking. Reconsider the final context selection using only read IDs already delivered in this conversation. The ranking is advisory; select every delivered read needed for the best answer and never invent an ID. '+stable({ranked_read_ids:rankedIds})+`\nEqualization padding:${' x'.repeat(paddingCount)}`};
  const messages=[...prompt.messages];
  const at=Math.max(1,messages.length-1);messages.splice(at,0,instruction);
  return stable({messages,tools:[submit]});
}

export function parseSelection(payload,deliveredIds){
  const message=payload?.choices?.[0]?.message,finish=payload?.choices?.[0]?.finish_reason;
  let value;
  if(finish==='tool_calls'){
    const calls=message?.tool_calls??[];need(calls.length===1&&calls[0]?.function?.name==='submit_context_selection','terminal-tool-shape');
    try{value=JSON.parse(calls[0].function.arguments);}catch{throw Error('round27.terminal-json');}
  }else if(finish==='stop'){
    try{value=JSON.parse(message?.content);}catch{throw Error('round27.terminal-json');}
  }else throw Error('round27.terminal-finish');
  need(value&&typeof value.summary==='string'&&Array.isArray(value.context_read_ids),'terminal-schema');
  need(value.context_read_ids.every(x=>typeof x==='string')&&new Set(value.context_read_ids).size===value.context_read_ids.length,'terminal-ids');
  const allowed=new Set(deliveredIds);need(value.context_read_ids.every(x=>allowed.has(x)),'terminal-undelivered-id');
  return {summary:value.summary,context_read_ids:value.context_read_ids};
}

function candidates(){
  const availability=JSON.parse(readFileSync(AVAILABILITY)),matrix=JSON.parse(readFileSync(MATRIX)),rows=[];
  const attempted=new Set(REVISION==='round27b'?['r26-01-control-rep1-8k','r26-01-control-rep3-8k','r26-02-control-rep1-8k']:[]);
  for(const cell of matrix.branches.filter(x=>REVISION==='round27'||['control','state'].includes(x.state_arm))){
    const source=resolve(LIVE,cell.cell_id,'result.json'),oracle=availability.rows.find(x=>x.cell_id===cell.cell_id);
    if(attempted.has(cell.cell_id)){rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,state_arm:cell.state_arm,repetition:cell.repetition,status:'not-eligible',reason:'round27a-instrument-failure-no-rerun'});continue;}
    if(!existsSync(source)||!oracle?.selected_read_ids?.length){rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,repetition:cell.repetition,status:'not-eligible',reason:!existsSync(source)?'source-result-missing':'no-gold-positive-delivered-handle'});continue;}
    const result=JSON.parse(readFileSync(source)),binding=bindDelivery(result),captures=result.captures??[];
    if(!['final_context_selected','no_context_selected'].includes(result.status)||!captures.length){rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,repetition:cell.repetition,status:'not-eligible',reason:'no-completed-terminal-capture'});continue;}
    const observations=binding.read_observations.map(({id,path,start_line,end_line,source_sha256})=>({id,path,start_line,end_line,source_sha256}));
    const oracleIds=oracle.selected_read_ids,placebo=placeboIds(cell.cell_id,observations,oracleIds.length);
    need(oracleIds.every(id=>observations.some(x=>x.id===id)),'oracle-id-not-delivered');
    rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,state_arm:cell.state_arm,repetition:cell.repetition,status:'eligible',source_status:result.status,source_result_sha256:hash(readFileSync(source)),base_prompt_sha256:hash(captures.at(-1).prompt),oracle_read_ids:oracleIds,placebo_read_ids:placebo,oracle_placebo_overlap:oracleIds.filter(x=>placebo.includes(x)).length,observations});
  }
  return rows;
}

export function prepare(){
  need(!existsSync(FREEZE),'freeze-exists');
  const rows=candidates(),body={schema_version:'are.contextbench-round27-calibration-freeze/v1',revision:REVISION,status:'frozen',hypothesis_ref:'research-hypothesis:b70223450c9544b1fd4495f34af776286bfb5e9ab796d775dfa758670b6f6bb9',source_round:'contextbench-development-round26',model:MODEL,window_tokens:8192,maximum_output_tokens:OUTPUT_CAP,reasoning_effort:'low',arms:['oracle','placebo'],pairing:'same completed terminal capture; identical tools, history, output cap, exact tokenizer count, and verified equal actual chat input tokens',placebo_policy:'ascending SHA256(round27-placebo-v1:cell_id:read_id), independent of gold',oracle_policy:'sealed-gold rank from round27-oracle-availability.json; delivered read IDs only',scheduled_pairs:rows.length,eligible_pairs:rows.filter(x=>x.status==='eligible').length,missing_pairs:rows.filter(x=>x.status!=='eligible').length,success_criteria:{full_denominator_reported:true,exact_actual_chat_input_token_equality_every_dispatched_pair:true,unknown_model_usage:0,oracle_scheduled_span_f1_exceeds_placebo:true,oracle_validity_non_degradation:true},rows,source_digests:{script:hash(readFileSync(new URL(import.meta.url))),availability:hash(readFileSync(AVAILABILITY)),matrix:hash(readFileSync(MATRIX))},claim_ceiling:'Causal diagnostic only; oracle behavior is not deployable and cannot clear ContextBench.',authority_effect:'none',open_questions:['If oracle wins, which observable non-gold features predict its choices?','If oracle loses, should state injection or the 8K model qualification target change?']};
  body.freeze_sha256=hash(body);writeFileSync(FREEZE,JSON.stringify(body,null,2)+'\n',{flag:'wx'});return body;
}

async function main(){
  if(process.argv.includes('--prepare')){const x=prepare();console.log(stable({status:x.status,eligible_pairs:x.eligible_pairs,missing_pairs:x.missing_pairs,freeze_sha256:x.freeze_sha256}));return;}
  need(process.argv.includes('--run'),'mode-required');
  const freeze=JSON.parse(readFileSync(FREEZE)),resume=process.argv.includes('--resume');
  if(resume){const continuation=JSON.parse(readFileSync(`${RESEARCH}/freeze-round27b-continuation-v2.json`));need(REVISION==='round27b'&&continuation.predecessor_freeze_sha256===freeze.freeze_sha256&&continuation.source_digests.script===fileHash(new URL(import.meta.url)),'continuation-freeze-drift');}
  else need(freeze.source_digests.script===hash(readFileSync(new URL(import.meta.url))),'freeze-drift');
  need(freeze.source_digests.availability===hash(readFileSync(AVAILABILITY))&&freeze.source_digests.matrix===hash(readFileSync(MATRIX)),'freeze-drift');
  mkdirSync(OUT,{recursive:true,mode:0o700});need(!existsSync(`${OUT}/completed.json`),'already-completed');
  const prior=resume&&existsSync(`${OUT}/progress.json`)?JSON.parse(readFileSync(`${OUT}/progress.json`)):null;
  const {registry,reference}=credentials(CREDENTIAL),receipts=prior?.receipts??[],results=prior?.results??[];
  if(prior?.active)results.push({cell_id:prior.active.cell_id,instance_id:prior.active.instance_id,state_arm:prior.active.state_arm,repetition:prior.active.repetition,status:'interrupted-pair-no-rerun',arms:prior.active.arms});
  const finished=new Set(results.map(x=>x.cell_id));
  const persist=(active=null)=>writeFileSync(`${OUT}/progress.json`,JSON.stringify({schema_version:'are.contextbench-round27-progress/v1',freeze_sha256:freeze.freeze_sha256,results,receipts,...(active?{active}:{}),authority_effect:'none'},null,2)+'\n');
  async function send(kind,body,timeout){
    const raw=stable(body),receipt={kind,request_sha256:hash(raw),dispatched:false,status:null,response_bytes:0};receipts.push(receipt);let response;
    try{await registry.consume({secret_ref:reference,consumer_id:'glm-flash-transport',request_digest:receipt.request_sha256,consumer:async material=>{receipt.dispatched=true;response=await postOnce(new URL(kind==='tokenizer'?'https://api.z.ai/api/paas/v4/tokenizer':'https://api.z.ai/api/paas/v4/chat/completions'),raw,{apiKey:Buffer.from(material).toString('utf8'),timeout_ms:timeout,maximum_response_bytes:262144});}});receipt.status=response.status;receipt.response_bytes=response.bytes??0;if(response.status!==200)throw Error(`http-${response.status}`);return response.payload;}
    catch(error){receipt.failure_code=error?.code??error?.message??'request-failed';throw error;}
  }
  const tokenCache=new Map();
  async function tokens(prompt){const key=hash(prompt);if(tokenCache.has(key))return tokenCache.get(key);const p=JSON.parse(prompt),payload=await send('tokenizer',{model:MODEL,messages:p.messages,tools:p.tools},30000),n=payload?.usage?.prompt_tokens;need(Number.isSafeInteger(n),'tokenizer-count');tokenCache.set(key,n);receipts.at(-1).input_tokens=n;return n;}
  async function equalize(base,oracleIds,placebo){
    const ids={oracle:oracleIds,placebo};
    const initial={oracle:await tokens(buildPrompt(base,oracleIds,0)),placebo:await tokens(buildPrompt(base,placebo,0))};
    async function find(arm,target){
      let n=Math.max(0,target-initial[arm]);
      for(let tries=0;tries<10;tries++){
        const prompt=buildPrompt(base,ids[arm],n),count=await tokens(prompt);
        if(count===target)return {prompt,count,padding:n};
        n=Math.max(0,n+target-count);
      }
      for(let candidate=0;candidate<160;candidate++){
        const prompt=buildPrompt(base,ids[arm],candidate),count=await tokens(prompt);
        if(count===target)return {prompt,count,padding:candidate};
      }
      return null;
    }
    for(let round=0,target=Math.max(initial.oracle,initial.placebo)+8;round<8;round++,target+=8){
      const oracle=await find('oracle',target),placeboResult=await find('placebo',target);
      if(oracle&&placeboResult){need(target+OUTPUT_CAP<8192,'window-exceeded');return {prompts:{oracle:oracle.prompt,placebo:placeboResult.prompt},counts:{oracle:target,placebo:target},pads:{oracle:oracle.padding,placebo:placeboResult.padding}};}
    }
    throw Error('round27.equalization-failed');
  }
  for(const row of freeze.rows){
    if(finished.has(row.cell_id))continue;
    if(row.status!=='eligible'){results.push({...row,arms:{},status:'scheduled-zero'});continue;}
    const original=JSON.parse(readFileSync(resolve(LIVE,row.cell_id,'result.json'))),base=original.captures.at(-1).prompt,delivered=row.observations.map(x=>x.id),arms={};let eq;
    try{eq=await equalize(base,row.oracle_read_ids,row.placebo_read_ids);}
    catch(error){results.push({cell_id:row.cell_id,instance_id:row.instance_id,state_arm:row.state_arm,repetition:row.repetition,status:'local-failure',reason:error.message,arms:{}});persist();console.log(stable({cell_id:row.cell_id,status:'local-failure',reason:error.message}));continue;}
    const order=Number.parseInt(hash(`round27-order:${row.cell_id}`).slice(0,2),16)%2?['oracle','placebo']:['placebo','oracle'];
    for(const arm of order){
      const body={...JSON.parse(eq.prompts[arm]),model:MODEL,stream:false,max_tokens:OUTPUT_CAP,thinking:{type:'enabled',clear_thinking:false},reasoning_effort:'low'};let payload,selection,error=null;
      try{payload=await send('model',body,300000);const usage=payload?.usage,receipt=receipts.at(-1);need(Number.isSafeInteger(usage?.prompt_tokens)&&Number.isSafeInteger(usage?.completion_tokens),'usage');Object.assign(receipt,{input_tokens:usage.prompt_tokens,output_tokens:usage.completion_tokens,output_cap:OUTPUT_CAP,finish_reason:payload.choices?.[0]?.finish_reason});selection=parseSelection(payload,delivered);}
      catch(e){error=e.message;}
      const receipt=receipts.filter(x=>x.kind==='model').at(-1);
      arms[arm]={status:selection?'valid':'invalid',error,selection:selection??null,prompt_sha256:hash(eq.prompts[arm]),tokenizer_input_tokens:eq.counts[arm],actual_input_tokens:receipt?.input_tokens??null,output_tokens:receipt?.output_tokens??null,padding_count:eq.pads[arm]};
      persist({cell_id:row.cell_id,instance_id:row.instance_id,state_arm:row.state_arm,repetition:row.repetition,arms});
    }
    if(arms.oracle.actual_input_tokens!==arms.placebo.actual_input_tokens){arms.oracle.status='invalid';arms.placebo.status='invalid';arms.oracle.error=arms.placebo.error='round27.actual-input-token-mismatch';}
    results.push({cell_id:row.cell_id,instance_id:row.instance_id,repetition:row.repetition,status:'executed',observations:row.observations,arms});
    persist();
    console.log(stable({cell_id:row.cell_id,oracle:arms.oracle.status,placebo:arms.placebo.status,input_tokens:eq.counts.oracle}));
  }
  const complete={schema_version:'are.contextbench-round27-calibration-run/v1',status:'complete',freeze_sha256:freeze.freeze_sha256,results,receipts,authority_effect:'none'};writeFileSync(`${OUT}/completed.json`,JSON.stringify(complete,null,2)+'\n',{flag:'wx'});
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
