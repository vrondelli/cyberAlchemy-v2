// Open Questions: evidence/G02-NATIVE-CANDIDATE-WORKSPACE-R1.md.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {mean,f1,signFlipPValue} from './matched-workspace-statistics-r1.mjs';
const root='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006';
const archive='/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002/pairs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const read=p=>JSON.parse(readFileSync(p));
const requireIt=(v,r)=>{if(!v)throw Error('matched-summary.'+r);};
requireIt(!existsSync(join(root,'QUALITY-RESULT.json')),'no-overwrite');
const sealBytes=readFileSync(join(root,'PRE-SCORE-CAMPAIGN-SEAL.json')),seal=JSON.parse(sealBytes);
const freezeBytes=readFileSync(join(root,'FREEZE.json')),freeze=JSON.parse(freezeBytes);
requireIt(sha(freezeBytes)===seal.freeze_sha256,'freeze-seal');
const rows=[];let updates=0;
for(const c of freeze.cases){
 const row={pair:c.pair,instance_id:c.instance_id};
 for(const arm of ['control','workspace']){
  const path=join(root,c.pair+'-'+arm),rBytes=readFileSync(join(path,'RESULT.json')),r=JSON.parse(rBytes);
  const identity=seal.results.find(x=>x.pair===c.pair&&x.arm===arm);
  requireIt(identity&&identity.result_sha256===sha(rBytes),'result-seal');
  const scoreBytes=readFileSync(join(path,'NATIVE-SCORE.json')),score=JSON.parse(scoreBytes);
  requireIt(sha(scoreBytes)===read(join(path,'SCORE-TERMINAL.json')).score_sha256,'score-seal');
  requireIt(score.native.instance_id===c.instance_id&&!score.native.error&&r.unknown_model_usage===0,'score-or-usage');
  row[arm]={span_f1:f1(score.native.final.span),file_f1:f1(score.native.final.file),
   known_model_tokens:r.known_model_tokens,model_calls:r.model_calls,elapsed_ms:r.elapsed_ms,
   request_tokenizers:r.request_tokenizers,index_tokenizers:r.index_tokenizers,
   native_export:r.native_export,score_sha256:sha(scoreBytes)};
  if(arm==='workspace')updates+=r.result?.candidate_workspace?.generation??0;
 }
 const dsh=read(join(archive,c.pair,'raw/dsh-export/native-score.json'));
 requireIt(dsh.native.instance_id===c.instance_id&&!dsh.native.error,'historical-dsh');
 row.archived_dsh={span_f1:f1(dsh.native.final.span),file_f1:f1(dsh.native.final.file)};
 rows.push(row);
}
requireIt(rows.length===12,'all-cases');
const metrics=Object.fromEntries(['control','workspace','archived_dsh'].map(arm=>[arm,{
 mean_span_f1:mean(rows.map(r=>r[arm].span_f1)),mean_file_f1:mean(rows.map(r=>r[arm].file_f1)),
 ...(arm==='archived_dsh'?{}:{known_model_tokens:rows.reduce((s,r)=>s+r[arm].known_model_tokens,0),
  model_calls:rows.reduce((s,r)=>s+r[arm].model_calls,0),mean_elapsed_ms:mean(rows.map(r=>r[arm].elapsed_ms))})}]));
const g=freeze.advancement_gate,c=metrics.control,w=metrics.workspace,d=metrics.archived_dsh;
const checks={all_24_valid_exports:rows.every(r=>r.control.native_export&&r.workspace.native_export),
 workspace_updates:updates>=g.workspace_updates_at_least,
 span_vs_control:w.mean_span_f1-c.mean_span_f1>=g.mean_span_f1_gain_vs_control_at_least,
 file_vs_control:w.mean_file_f1-c.mean_file_f1>=g.mean_file_f1_gain_vs_control_at_least,
 span_vs_archived_dsh:w.mean_span_f1-d.mean_span_f1>=g.mean_span_f1_gain_vs_archived_dsh_at_least,
 file_vs_archived_dsh:w.mean_file_f1-d.mean_file_f1>=g.mean_file_f1_gain_vs_archived_dsh_at_least,
 cost:w.known_model_tokens<=c.known_model_tokens*g.known_model_tokens_ratio_vs_control_at_most};
const passed=Object.values(checks).every(Boolean);
const report={status:passed?'exposed-development-gate-passed':'exposed-development-gate-failed',
 freeze_sha256:sha(freezeBytes),campaign_seal_sha256:sha(sealBytes),metrics,checks,workspace_updates:updates,rows,
 paired_span_sign_flip_p_diagnostic:signFlipPValue(rows.map(r=>r.workspace.span_f1-r.control.span_f1)),
 claim_ceiling:'Exposed/adaptively developed pilot. Historical DSH not matched. No superiority regardless of p-value.',
 next:passed?'Freeze new matched DSH comparison and untouched confirmation before any quality claim.':
  'Reject advancement of this exact policy; inspect sealed failure evidence and select a distinct mechanism without opening confirmation.',
 authority_effect:'none',open_questions_owner:'G02-NATIVE-CANDIDATE-WORKSPACE-R1.md'};
writeFileSync(join(root,'QUALITY-RESULT.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:report.status,metrics,checks,sha256:sha(readFileSync(join(root,'QUALITY-RESULT.json')))}));
