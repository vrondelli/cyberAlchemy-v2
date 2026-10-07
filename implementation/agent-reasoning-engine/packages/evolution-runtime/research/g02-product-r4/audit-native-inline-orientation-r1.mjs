// Independent result arithmetic and delivery/usage reconstruction after scoring.
// Open Questions: evidence/G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json.
import{readFileSync,writeFileSync,existsSync}from'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';
import{bindDelivery}from'../../../../benchmarks/contextbench-v1/delivery.mjs';
const root='/home/vlad_/are-benchmark-archive/g02-inline-orientation-native-exposed-r1-20261006',prior='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006';
const bytes=p=>readFileSync(p),read=p=>JSON.parse(bytes(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const need=(v,r)=>{if(!v)throw Error('navigation-audit.'+r);},close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-12;
const f1=c=>c.pred_size+c.gold_size?2*c.intersection/(c.pred_size+c.gold_size):0;
need(!existsSync(join(root,'QUALITY-AUDIT.json')),'no-overwrite');
const reportBytes=bytes(join(root,'QUALITY-RESULT.json')),report=JSON.parse(reportBytes),freeze=read(join(root,'FREEZE.json')),seal=read(join(root,'PRE-SCORE-CAMPAIGN-SEAL.json'));
need(report.freeze_sha256===sha(bytes(join(root,'FREEZE.json')))&&seal.results.length===12&&report.rows.length===12,'all12-freeze');
const oldBytes=bytes(join(prior,'QUALITY-RESULT.json'));need(sha(oldBytes)===report.prior_quality_sha256,'comparator-pin');
const old=JSON.parse(oldBytes),sums={orientation:{span:0,file:0,tokens:0,calls:0},control:{span:0,file:0,tokens:0,calls:0},archived_dsh:{span:0,file:0}},rows=[];
for(const c of freeze.cases){
 const dir=join(root,c.pair+'-orientation'),rBytes=bytes(join(dir,'RESULT.json')),r=JSON.parse(rBytes),pre=read(join(dir,'PRE-SCORE-SEAL.json')),identity=seal.results.find(x=>x.pair===c.pair);
 need(identity?.result_sha256===sha(rBytes)&&pre.result_sha256===sha(rBytes)&&pre.prediction_sha256===sha(bytes(join(dir,'prediction.json')))&&r.native_export&&r.status==='matched-arm-passed'&&r.unknown_model_usage===0&&r.unchanged_base,'terminal-seal');
 const binding=bindDelivery({captures:r.result.captures,receipts:r.result.receipts});need(binding.unmapped.length===0&&binding.token_accounting.cost_complete,'delivery');
 const receipts=r.result.receipts.filter(x=>x.kind==='model'&&x.dispatched===true);
 need(receipts.length===r.model_calls&&binding.token_accounting.known_total_tokens===r.known_model_tokens,'usage-reconstruction');
 const scoreBytes=bytes(join(dir,'NATIVE-SCORE.json')),score=JSON.parse(scoreBytes);need(sha(scoreBytes)===read(join(dir,'SCORE-TERMINAL.json')).score_sha256&&!score.native.error&&score.native.instance_id===c.instance_id,'native-score-pin');
 const row=report.rows.find(x=>x.pair===c.pair),oldRow=old.rows.find(x=>x.pair===c.pair);
 const n={span:f1(score.native.final.span),file:f1(score.native.final.file),tokens:r.known_model_tokens,calls:receipts.length};
 need(close(n.span,row.orientation.span_f1)&&close(n.file,row.orientation.file_f1)&&n.tokens===row.orientation.known_model_tokens&&n.calls===row.orientation.model_calls,'navigation-row');
 const controlScoreBytes=bytes(join(prior,c.pair+'-control','NATIVE-SCORE.json')),controlScore=JSON.parse(controlScoreBytes);
 need(sha(controlScoreBytes)===oldRow.control.score_sha256,'control-score-pin');
 const arms={orientation:n,control:{span:f1(controlScore.native.final.span),file:f1(controlScore.native.final.file),tokens:oldRow.control.known_model_tokens,calls:oldRow.control.model_calls},archived_dsh:{span:oldRow.archived_dsh.span_f1,file:oldRow.archived_dsh.file_f1}};
 for(const [arm,a]of Object.entries(arms)){need(close(a.span,row[arm].span_f1)&&close(a.file,row[arm].file_f1),'comparator-row');for(const [k,v]of Object.entries(a))sums[arm][k]+=v;}
 rows.push({pair:c.pair,result_sha256:sha(rBytes),score_sha256:sha(scoreBytes),known_generation_tokens:n.tokens,zero_unmapped:true});
}
for(const [arm,a]of Object.entries(sums)){need(close(a.span/12,report.metrics[arm].mean_span_f1)&&close(a.file/12,report.metrics[arm].mean_file_f1),'mean');if(arm!=='archived_dsh')need(a.tokens===report.metrics[arm].known_model_tokens&&a.calls===report.metrics[arm].model_calls,'total-usage');}
const n=sums.orientation,c=sums.control,d=sums.archived_dsh,g=freeze.advancement_gate;
const checks={all12_valid_exports:true,span_vs_control:(n.span-c.span)/12>=g.mean_span_f1_gain_vs_each_diagnostic_comparator_at_least,span_vs_archived_dsh:(n.span-d.span)/12>=g.mean_span_f1_gain_vs_each_diagnostic_comparator_at_least,file_vs_control:n.file>=c.file,file_vs_archived_dsh:n.file>=d.file,cost:n.tokens<=c.tokens*g.total_generation_token_ratio_vs_native_control_at_most};
for(const [k,v]of Object.entries(checks))need(report.checks[k]===v,'gate-'+k);need(report.status===(Object.values(checks).every(Boolean)?'exposed-development-gate-passed':'exposed-development-gate-failed'),'disposition');
const audit={status:'independent-arithmetic-delivery-usage-audit-passed',quality_result_sha256:sha(reportBytes),rows,checks,claim_ceiling:'Report consistency/delivery/usage only; not independent native evaluator rerun or superiority.',authority_effect:'none',open_questions_owner:'G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json'};
writeFileSync(join(root,'QUALITY-AUDIT.json'),JSON.stringify(audit,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({status:audit.status,sha256:sha(bytes(join(root,'QUALITY-AUDIT.json')))}));
