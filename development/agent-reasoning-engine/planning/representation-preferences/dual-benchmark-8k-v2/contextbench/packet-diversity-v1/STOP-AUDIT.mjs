// Read-only receipt recovery followed by one additive audit; no evaluator/providers.
// Open questions: infrastructure diagnosis and separately reviewed successor.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {hash} from './prepare.mjs';
import {verifyLiveFreeze} from './live.mjs';
import {accountReceipts} from '../discovery-v1/run.mjs';
export function auditStopped(freezePath,directory){
 directory=resolve(directory);const verified=verifyLiveFreeze(freezePath),bindings=[];
 const read=path=>{const raw=readFileSync(path);bindings.push({path,sha256:hash(raw)});return JSON.parse(raw);};
 const started=read(join(directory,'started.json'));assert.equal(started.freeze_sha256,verified.freeze_sha256);assert.equal(existsSync(join(directory,'GENERATION-SEAL.json')),false,'normal generation seal already exists');
 const slots=[];
 for(const job of verified.jobs)for(const variant of ['legacy','diversity']){
  const cell=join(directory,'pairs',job.donor.donor_id,variant),ledgerPath=join(cell,'state/glm-transport-ledger.json'),resultPath=join(cell,'result.json'),requestPath=join(cell,'request-result.json');
  const result=existsSync(resultPath)?read(resultPath):null,request=existsSync(requestPath)?read(requestPath):null,ledger=existsSync(ledgerPath)?read(ledgerPath):null;
  let suffix=[],pending=false,phase=null;
  if(ledger){const {ledger_digest,...body}=ledger;assert.equal(hash(body),ledger_digest,'ledger digest');const prefix=read(join(cell,'prefix-derivation.json'));assert.equal(prefix.prefix_receipts_sha256,job.donor.prefix_receipts_sha256);assert.equal(hash(ledger.receipts.slice(0,prefix.historical_receipts)),job.donor.prefix_receipts_sha256);suffix=ledger.receipts.slice(prefix.historical_receipts);phase=ledger.phase;pending=phase==='model-pending';
   for(const artifact of [result,request].filter(Boolean)){assert.deepEqual(artifact.receipts,ledger.receipts,'terminal receipt/ledger disagreement');assert.equal(artifact.suffix_receipt_start,prefix.historical_receipts);}
  }else{assert.ok(!result&&!request,'missing authoritative ledger');}
  const usage=accountReceipts(suffix);if(pending){usage.unknown_usage=true;usage.unknown_usage_calls++;usage.conservative_total_tokens+=8000;}
  if(request)for(const key of ['prompt_tokens','completion_tokens','total_tokens','model_calls'])assert.equal(usage[key],request.usage[key],'known cost mismatch');
  slots.push({donor_id:job.donor.donor_id,variant,status:result?.status??(pending?'externally-stopped-model-pending':phase?'externally-stopped-'+phase:'not-started-external-stop'),original_error:result?.error??request?.error??null,ledger_phase:phase,new_usage:usage,pending_model_reservation:pending?8000:0,prefix_tokens:job.donor.prefix_usage.total_tokens,receipt_hashes:suffix.map(r=>({kind:r.kind,sha256:hash(r)}))});
 }
 const totals={};for(const key of ['prompt_tokens','completion_tokens','total_tokens','model_calls','unknown_usage_calls','conservative_total_tokens'])totals[key]=slots.reduce((n,s)=>n+s.new_usage[key],0);totals.unknown_usage=slots.some(s=>s.new_usage.unknown_usage);
 const logical=Object.fromEntries(['legacy','diversity'].map(v=>[v,{known_tokens:slots.filter(s=>s.variant===v).reduce((n,s)=>n+s.prefix_tokens+s.new_usage.total_tokens,0),conservative_tokens:slots.filter(s=>s.variant===v).reduce((n,s)=>n+s.prefix_tokens+s.new_usage.conservative_total_tokens,0)}]));
 for(const b of bindings)assert.equal(hash(readFileSync(b.path)),b.sha256,'audit drift');
 const audit={schema:'are.packet-external-stop-audit/v1',terminal:true,external_stop:{signal:'SIGINT',exit_code:130,evidence:'Coordinator observed exec session133193 exit130; remote pending completion unknown.'},freeze_sha256:verified.freeze_sha256,planned_slots:16,slots,physical_new_usage:totals,physical_historical_prefix_tokens:verified.jobs.reduce((n,j)=>n+j.donor.prefix_usage.total_tokens,0),logical_costs:logical,classification:'inconclusive',reason:'External stop following native export infrastructure failure; pending usage reserved, no gold or hypothesis rejection.',generation_seal_for_scoring:false,gold_accessed:false,provider_calls:0,source_bindings:bindings,open_questions:['Resolve missing base path required for native export; preserve this failed attempt.','A model-pending receipt does not reveal terminal remote usage; retain8000 reservation unless independently reconciled.']};
 writeFileSync(join(directory,'STOP-AUDIT.json'),JSON.stringify(audit,null,2)+'\n',{flag:'wx',mode:0o600});return audit;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const r=auditStopped(process.argv[2],process.argv[3]);console.log(JSON.stringify({slots:r.slots.length,usage:r.physical_new_usage,classification:r.classification}));}
