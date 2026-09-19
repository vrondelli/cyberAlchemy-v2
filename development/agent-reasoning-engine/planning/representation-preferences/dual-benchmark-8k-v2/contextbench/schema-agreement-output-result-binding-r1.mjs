// Admission of reviewed tokenizer evidence only. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),need=(v,m)=>{if(!v)throw Error('ranked-output-binding.'+m);};
export function verifyRankedOutputQualification({qualification_path,qualification_sha256,schedule}){
 const bytes=readFileSync(qualification_path);need(hash(bytes)===qualification_sha256,'file-drift');
 const q=JSON.parse(bytes),report=q.measurement_report,s=q.process_settlement;
 need(q.qualified===true&&s?.local_settled===true&&s.process_group_absent===true&&s.forced===false&&s.exit_code===0,'settlement');
 need(report?.schema==='are.ranked-read-output-campaign/v1'&&report.qualified===true&&report.model_calls===0&&report.schedule_sha256===schedule.schedule_sha256&&report.rows?.length===4&&schedule.slots.length===4,'report');
 for(const [i,row]of report.rows.entries()){
  const slot=schedule.slots[i],r=row.result;
  need(row.qualified===true&&row.model_calls===0&&row.slot_id===slot.slot_id&&r?.qualified===true&&r.model_calls===0&&r.cell_sha256===slot.cell_sha256,'slot');
  need(r.source_output_visible===true&&Number.isSafeInteger(r.returned_windows)&&r.returned_windows>0&&r.returned_windows<=5&&r.returned_windows<=r.raw_returned_windows,'visible-source');
  need(Number.isSafeInteger(r.projected_tokens)&&r.projected_tokens<7999,'window');
  need(Array.isArray(r.receipts)&&r.receipts.length>=1&&r.receipts.length<=5&&r.receipts.every(x=>x.kind==='tokenizer')&&Array.isArray(r.index_receipts)&&r.index_receipts.every(x=>x.kind==='index-tokenizer'),'receipt-family');
  need(providerAttemptHealth([...r.receipts,...r.index_receipts]).healthy,'provider-health');
  const digest=hash(stable({model:'glm-5.3-flash',messages:r.prompt?.messages,tools:r.prompt?.tools}));
  need(digest===r.tokenizer_request_sha256&&r.receipts.some(x=>x.status===200&&x.dispatched===true&&Number.isSafeInteger(x.input_tokens)&&x.input_tokens>=0&&x.request_sha256===digest&&x.input_tokens+slot.cell.provider_profile.token_margin+slot.cell.limits.output_cap===r.projected_tokens),'measurement-binding');
  need(hash(stable(bodyForReceipt(stable(r.prompt),{model:'glm-5.3-flash',reasoning_effort:slot.cell.provider_profile.reasoning_effort,output_cap:slot.cell.limits.output_cap})))===r.request_sha256,'request-binding');
 }
 return true;
}
