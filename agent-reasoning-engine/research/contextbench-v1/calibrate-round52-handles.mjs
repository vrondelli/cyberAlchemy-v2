import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {credentials} from '../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs';
import {postOnce,stable,MODEL} from '../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {terminalHandleTool} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-evidence-handles-v1.mjs';

const sha=value=>createHash('sha256').update(value).digest('hex');
const live=resolve('/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round50-live');
const read=name=>JSON.parse(readFileSync(resolve(live,name,'result.json')));
const controlResult=read('r50-01-control-review-rep1-8k');
const priorTreatment=read('r50-01-terminal-substitution-rep1-8k');
const control=JSON.parse(controlResult.captures.at(-1).prompt);
const priorPrompt=JSON.parse(priorTreatment.captures.at(-1).prompt);
const oldBindings=priorTreatment.decision_state_presentations[0].evidence.map((row,index)=>({handle:`h${index}`,read_id:row.read_id,path:row.path,start_line:row.start_line,end_line:row.end_line}));
const stateText=`TERMINAL EVIDENCE HANDLES (untrusted):\n${oldBindings.map(row=>`${row.handle} ${row.path}:${row.start_line}${row.end_line===row.start_line?'':`-${row.end_line}`}`).join('\n')}\nCall submit_context_handles once. Use listed handles only. Empty is valid.`;
const treatment=structuredClone(priorPrompt);
treatment.messages.at(-1).content=stateText;
treatment.tools=[terminalHandleTool(oldBindings)];
const {registry,reference}=credentials('/home/vrondelli/.config/are/glm-flash-credential.json'),receipts=[];
async function measure(label,body){
  const raw=stable({model:MODEL,messages:body.messages,tools:body.tools}),request_sha256=sha(raw);let response;
  await registry.consume({secret_ref:reference,consumer_id:'glm-flash-transport',request_digest:request_sha256,consumer:async material=>{
    response=await postOnce(new URL('https://api.z.ai/api/paas/v4/tokenizer'),raw,{apiKey:Buffer.from(material).toString('utf8'),timeout_ms:30000,maximum_response_bytes:65536});
  }});
  const row={label,request_sha256,input_tokens:response.payload?.usage?.prompt_tokens,bytes:Buffer.byteLength(raw),status:response.status,full_read_id_occurrences:oldBindings.reduce((sum,item)=>sum+raw.split(item.read_id).length-1,0)};
  receipts.push(row);return row;
}
const controlRow=await measure('round50-captured-control',control);
const treatmentRow=await measure('round52-h72-handle-treatment',treatment);
const inputReduction=controlRow.input_tokens-treatmentRow.input_tokens;
const output={
  schema_version:'are.contextbench-round52-provider-token-calibration/v1',
  status:controlRow.status===200&&treatmentRow.status===200&&inputReduction>=128&&treatmentRow.full_read_id_occurrences===0?'passed':'failed',
  source_capture:{control_result_sha256:sha(readFileSync(resolve(live,'r50-01-control-review-rep1-8k/result.json'))),treatment_result_sha256:sha(readFileSync(resolve(live,'r50-01-terminal-substitution-rep1-8k/result.json'))),private_handle_count:oldBindings.length},
  receipts,
  treatment_minus_control_input_tokens:treatmentRow.input_tokens-controlRow.input_tokens,
  input_token_reduction:inputReduction,
  minimum_required_reduction:128,
  model_calls:0,
  authority_effect:'none',
  claim_ceiling:'Exact provider-tokenizer calibration on the captured Round 50 terminal prompt; no model outcome or benchmark clearance.',
  open_questions_ref:'PLAN-round52.md#open-questions'
};
writeFileSync(resolve('agent-reasoning-engine/research/contextbench-v1/round52-provider-token-calibration.json'),JSON.stringify(output,null,2)+'\n');
if(output.status!=='passed')throw Error('round52.handle-calibration-failed');
console.log(JSON.stringify({status:output.status,control_tokens:controlRow.input_tokens,treatment_tokens:treatmentRow.input_tokens,reduction:inputReduction,full_id_occurrences:treatmentRow.full_read_id_occurrences}));
