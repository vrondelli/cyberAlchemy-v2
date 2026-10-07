#!/usr/bin/env node
// Read-only diagnosis of the sealed r11 pair-13 DSH transport; writes one derived receipt.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';

const root='/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002';
const pair=resolve(root,'pairs/13-pr11-mixed-13/raw/dsh-control/transport');
const output=resolve(root,'TRANSPORT-DIAGNOSIS-R11.json');
const definition=resolve(root,'definition/DEFINITION.json');
const modulePath=resolve('development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-durable-transport.mjs');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fileSha=path=>sha(readFileSync(path));
const need=(value,reason)=>{if(!value)throw Error('g02-r11-transport-diagnosis.'+reason);};
need(fileSha(definition)==='0ec225f9df7cc0140dffeee53da9e57c4f2b92176b7b15c8c6fb48728bd46ddf','definition-drift');
const {reconcileTransport}=await import(pathToFileURL(modulePath).href);
const reconciled=reconcileTransport(pair);
const resultPath=resolve(pair,'RESULTS.json');
const seal=JSON.parse(readFileSync(resultPath,'utf8'));
for(const key of ['attempts','model_calls','known_total_tokens','unknown_usage_dispatched_requests','cost_complete','unsettled_attempts','bindings'])
  need(JSON.stringify(seal[key])===JSON.stringify(reconciled[key]),'seal-reconciliation-'+key);
need(seal.state?.closed===true&&seal.state?.poisoned===true&&
  reconciled.attempts===42&&reconciled.model_calls===41&&
  reconciled.known_total_tokens===969273&&reconciled.unknown_usage_dispatched_requests===0&&
  reconciled.cost_complete===true&&reconciled.unsettled_attempts.length===0,
  'terminal-accounting-shape');
const admissionPath=resolve(pair,'000290.json');
const receiptPath=resolve(pair,'000291.json');
const admission=JSON.parse(readFileSync(admissionPath,'utf8'));
const receipt=JSON.parse(readFileSync(receiptPath,'utf8'));
need(admission.seq===290&&admission.kind==='admission'&&admission.attempt===41&&
  admission.admitted===false&&admission.measured===52162&&admission.margin===512&&
  admission.cap===16384&&admission.reservation===69058&&
  admission.window===1000000&&admission.token_budget===1000000&&
  reconciled.known_total_tokens+admission.reservation>admission.token_budget,
  'budget-denial-shape');
need(receipt.seq===291&&receipt.kind==='receipt'&&receipt.attempt===41&&
  receipt.dispatched===false&&receipt.ok===false&&
  receipt.code==='dsh-transport.request-budget'&&receipt.unknown_usage===false,
  'terminal-receipt-shape');
need(!reconciled.bindings.some(({name})=>{
  const event=JSON.parse(readFileSync(resolve(pair,name),'utf8'));
  return event.attempt===41&&event.kind==='model-intent';
}), 'terminal-attempt-dispatched');
const diagnosis={
  schema_version:'are.g02-r11-transport-diagnosis/v1',
  status:'pre-dispatch-episode-budget-denial',
  definition_sha256:fileSha(definition),
  source_sha256:fileSha(fileURLToPath(import.meta.url)),
  transport_module_sha256:fileSha(modulePath),
  sealed_result_sha256:fileSha(resultPath),
  admission_sha256:fileSha(admissionPath),
  receipt_sha256:fileSha(receiptPath),
  accounting:{attempts:reconciled.attempts,model_calls:reconciled.model_calls,
    known_total_tokens:reconciled.known_total_tokens,
    unknown_usage_dispatched_requests:reconciled.unknown_usage_dispatched_requests,
    cost_complete:reconciled.cost_complete,unsettled_attempts:reconciled.unsettled_attempts,
    journal_files:reconciled.bindings.length},
  terminal_attempt:{attempt:41,measured_prompt_tokens:admission.measured,
    margin_tokens:admission.margin,output_cap_tokens:admission.cap,
    reservation_tokens:admission.reservation,
    known_plus_reservation:reconciled.known_total_tokens+admission.reservation,
    episode_budget_tokens:admission.token_budget,dispatched:false,
    receipt_code:receipt.code},
  interpretation:'The benchmark proxy translated its own episode-budget denial into the generic HTTP 502 seen by DSH; this terminal attempt was not sent to the model provider.',
  claim_ceiling:'r11 remains terminal failed; this diagnosis does not supply a missing DSH prediction or score',
  open_questions:['Can a future predeclared comparator budget and task policy avoid high-call episodes without changing the selection-only question?',
    'How should budget denials be reported to the coordinator without conflating them with provider failures?']
};
writeFileSync(output,JSON.stringify(diagnosis,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:diagnosis.status,receipt_sha256:fileSha(output),
  accounting:diagnosis.accounting,terminal_attempt:diagnosis.terminal_attempt}));
