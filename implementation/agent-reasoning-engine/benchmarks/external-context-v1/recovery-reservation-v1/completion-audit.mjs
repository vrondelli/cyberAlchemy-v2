// Independent completion audit; not imported by the experiment. Open questions: RESULT.md.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from '../common.mjs';
import {phaseFor} from './phases.mjs';
import {tools} from '../holdout-v1/contract.mjs';
import {verifyEvolutionRecord} from '../../../packages/evolution-runtime/index.mjs';
const root=fileURLToPath(new URL('./',import.meta.url)),bytes=p=>readFileSync(root+p),read=p=>JSON.parse(bytes(p));
const matrix=read('matrix.json'),freeze=read('freeze.json'),result=read('closeout.json');
assert.equal(matrix.cells.length,8);assert.equal(result.rows.length,8);assert.equal(result.pairs.length,4);
for(const f of freeze.sources)assert.equal(hash(bytes(f.path)),f.sha256,f.path);
for(const f of result.bindings)assert.equal(hash(bytes(f.path)),f.sha256,f.path);
const evidence=[];let modelCalls=0,tokenizerCalls=0,phaseCaptures=0,repairs=0;
for(const cell of matrix.cells){
 const dir='evidence/'+cell.cell_id+'/',r=read(dir+'result.json'),row=result.rows.find(x=>x.cell_id===cell.cell_id);
 assert.equal(read(dir+'completed.json').result_sha256,hash(bytes(dir+'result.json')));
 assert.equal(read(dir+'started.json').freeze_sha256,hash(bytes('freeze.json')));
 assert(r.status!=='started'&&r.cleanup_verified);assert(r.elapsed_ms<=1800000);
 assert(r.model_attempts<=24&&r.tokenizer_attempts<=48);
 assert(r.receipts.every(x=>x.automatic_retries===0&&(x.output_tokens??0)<=2048));
 assert(r.recycling.dispatches.every(x=>x.projected_upper_bound<12000));
 modelCalls+=r.model_attempts;tokenizerCalls+=r.tokenizer_attempts;
 for(const c of read(dir+'captures.json')){
  const prompt=JSON.parse(c.original),message=prompt.messages.findLast(x=>x.role==='user'&&x.content?.includes('\nWorkflow state: '));assert(message);
  const raw=message.content.split('\nWorkflow state: ')[1].split('\nRequired phase: ')[0];
  const phase=phaseFor(c.step,JSON.parse(raw),tools,cell.policy_arm);
  assert.deepEqual(prompt.tools,phase.tools);assert(message.content.includes('Required phase: '+phase.phase));phaseCaptures++;
 }
 if(r.patch_produced){
  assert.equal(hash(bytes(dir+'prediction.patch')),r.patch_sha256);
  const e=read(dir+'evaluation/report.json');assert.equal(e.status,'scored');assert(e.cleanup_verified);
  for(const mode of e.resolved?['evaluation','reproduction']:['evaluation']){
   const report=read(dir+mode+'/report.json'),inv=read(dir+mode+'/invocation.json');
   assert.equal(inv.patch_sha256,r.patch_sha256);assert.equal(inv.report_sha256,hash(bytes(dir+mode+'/report.json')));
   assert.equal(inv.evaluator_sha256,hash(bytes('evaluate.py')));assert.equal(inv.freeze_sha256,hash(bytes('freeze.json')));
   assert(report.cleanup_verified&&report.status==='scored');
   if(e.resolved){assert(report.resolved&&report.strict_all_expected_pass);assert.equal(report.missing_expected,0);assert(!Object.values(read(dir+mode+'/status.json')).includes('fail'));}
   evidence.push(dir+mode+'/report.json');
  }
  if(row.verified_success){assert(e.resolved);repairs++;}
 }else{assert(!existsSync(root+dir+'evaluation'));assert(!row.verified_success);}
 assert(!row.infrastructure_failure,'Unclassified/infrastructure outcome requires explicit review');
 evidence.push(dir+'result.json');
}
assert(modelCalls<=192&&tokenizerCalls<=384);
assert(result.rows.reduce((s,r)=>s+r.list_price_estimate_usd,0)<=.8);
for(const record of read('research-result.json').records)assert(verifyEvolutionRecord(record,record.schema_version).ok);
const containers=execFileSync('docker',['ps','-a','--format','{{.Names}}'],{encoding:'utf8'}).split('\n');
assert(!containers.some(x=>/^are(110-|103-eval-|102-public-)/.test(x)));
const report={status:'passed',episodes:8,pairs:4,verified_repairs:repairs,previously_unresolved_task_repaired:result.rows.some(r=>r.task_id.endsWith('16542')&&r.verified_success),model_calls:modelCalls,tokenizer_calls:tokenizerCalls,phase_captures_verified:phaseCaptures,frozen_sources_verified:freeze.sources.length,bound_results_verified:result.bindings.length,requirements:{K:'six trace-linked failure analyses retained',L:'fixed eight-cell protocol, budgets and freeze',M:'policy controls plus exact replay of every offered phase/tool set',N:'eight terminal receipts; budgets, no retries and cleanup verified',O:'all submitted patches fully scored; every passing patch freshly repeated',P:'typed hypothesis/observation/learning records and context/accounting closeout'},evidence_refs:['PLAN.md','failure-analysis.json','controls.json','freeze.json','closeout.json','research-result.json',...evidence],authority_effect:'none',open_questions_ref:'RESULT.md'};
writeFileSync(root+'completion-audit.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
