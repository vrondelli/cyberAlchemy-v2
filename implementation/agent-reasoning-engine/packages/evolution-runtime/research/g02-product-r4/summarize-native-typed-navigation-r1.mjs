// Full exposed development denominator; archived comparators are diagnostics.
// Open Questions: evidence/G02-TYPED-NAVIGATION-R2.json.
import{readFileSync,writeFileSync,existsSync}from'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';
import{mean,f1,signFlipPValue}from'./matched-workspace-statistics-r1.mjs';
const root='/home/vlad_/are-benchmark-archive/g02-typed-navigation-native-exposed-r1-20261006',prior='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(p)),need=(v,r)=>{if(!v)throw Error('navigation-summary.'+r);};
need(!existsSync(join(root,'QUALITY-RESULT.json')),'no-overwrite');
const frozenBytes=readFileSync(join(root,'FREEZE.json')),freeze=JSON.parse(frozenBytes),seal=read(join(root,'PRE-SCORE-CAMPAIGN-SEAL.json'));
need(seal.freeze_sha256===sha(frozenBytes)&&seal.results.length===12,'complete-seal');
const priorQualityBytes=readFileSync(join(prior,'QUALITY-RESULT.json'));
need(sha(priorQualityBytes)==='0d63c7c73b1183c52a875c79a70169148b68fdef5a79ba5f04ee709a50623a1e','archived-comparator-pin');
const priorQuality=JSON.parse(priorQualityBytes),rows=[];
for(const c of freeze.cases){
 const dir=join(root,c.pair+'-navigation'),resultBytes=readFileSync(join(dir,'RESULT.json')),result=JSON.parse(resultBytes),identity=seal.results.find(r=>r.pair===c.pair);
 need(identity?.result_sha256===sha(resultBytes)&&result.status==='matched-arm-passed'&&result.unknown_model_usage===0,'arm-result');
 const scoreBytes=readFileSync(join(dir,'NATIVE-SCORE.json')),score=JSON.parse(scoreBytes);
 need(read(join(dir,'SCORE-TERMINAL.json')).score_sha256===sha(scoreBytes)&&score.native.instance_id===c.instance_id&&!score.native.error,'score');
 const old=priorQuality.rows.find(r=>r.pair===c.pair);need(old?.instance_id===c.instance_id,'comparator-instance');
 rows.push({pair:c.pair,instance_id:c.instance_id,navigation:{span_f1:f1(score.native.final.span),file_f1:f1(score.native.final.file),known_model_tokens:result.known_model_tokens,model_calls:result.model_calls,score_sha256:sha(scoreBytes),native_export:result.native_export,navigation_calls:result.navigation_calls,navigation_successes:result.navigation_successes},control:old.control,archived_dsh:old.archived_dsh});
}
need(rows.length===12,'full-denominator');
const metrics=Object.fromEntries(['navigation','control','archived_dsh'].map(arm=>[arm,{mean_span_f1:mean(rows.map(r=>r[arm].span_f1)),mean_file_f1:mean(rows.map(r=>r[arm].file_f1)),...(arm==='archived_dsh'?{}:{known_model_tokens:rows.reduce((n,r)=>n+r[arm].known_model_tokens,0),model_calls:rows.reduce((n,r)=>n+r[arm].model_calls,0)})}]));
const g=freeze.advancement_gate,n=metrics.navigation,c=metrics.control,d=metrics.archived_dsh;
const checks={all12_valid_exports:rows.every(r=>r.navigation.native_export),span_vs_control:n.mean_span_f1-c.mean_span_f1>=g.mean_span_f1_gain_vs_each_diagnostic_comparator_at_least,span_vs_archived_dsh:n.mean_span_f1-d.mean_span_f1>=g.mean_span_f1_gain_vs_each_diagnostic_comparator_at_least,file_vs_control:n.mean_file_f1>=c.mean_file_f1,file_vs_archived_dsh:n.mean_file_f1>=d.mean_file_f1,cost:n.known_model_tokens<=c.known_model_tokens*g.total_generation_token_ratio_vs_native_control_at_most};
const passed=Object.values(checks).every(Boolean),report={status:passed?'exposed-development-gate-passed':'exposed-development-gate-failed',freeze_sha256:sha(frozenBytes),prior_quality_sha256:sha(priorQualityBytes),metrics,checks,rows,
 navigation_calls:rows.reduce((n,r)=>n+r.navigation.navigation_calls,0),navigation_successes:rows.reduce((n,r)=>n+r.navigation.navigation_successes,0),paired_span_sign_flip_p_diagnostic:signFlipPValue(rows.map(r=>r.navigation.span_f1-r.control.span_f1)),
 next:passed?'Independently audit, then freeze fresh matched comparators and untouched confirmation.':'Reject advancement of the frozen policy; inspect uptake, acquired useful spans and precision before selecting a distinct hypothesis.',
 claim_ceiling:'Exposed development only; historical controls are not contemporaneous. No superiority regardless of development gains or diagnostic p-value.',authority_effect:'none',open_questions_owner:'G02-TYPED-NAVIGATION-R2.json'};
writeFileSync(join(root,'QUALITY-RESULT.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({status:report.status,metrics,checks,navigation_successes:report.navigation_successes,sha256:sha(readFileSync(join(root,'QUALITY-RESULT.json')))}));
