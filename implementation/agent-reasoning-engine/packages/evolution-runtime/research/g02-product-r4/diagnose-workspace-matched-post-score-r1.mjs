// Post-score diagnostics only; never alters admission, predictions or metrics.
// Open Questions: evidence/G02-NATIVE-CANDIDATE-WORKSPACE-R1.md.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {diagnoseAcquisitionCommitment} from './workspace-acquisition-commitment-r1.mjs';
const root='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006';
const sha=x=>createHash('sha256').update(x).digest('hex');
const read=p=>JSON.parse(readFileSync(p));
const requireIt=(v,r)=>{if(!v)throw Error('commitment-diagnostic.'+r);};
requireIt(!existsSync(join(root,'ACQUISITION-COMMITMENT-DIAGNOSTIC.json')),'no-overwrite');
const qualityBytes=readFileSync(join(root,'QUALITY-RESULT.json')),quality=JSON.parse(qualityBytes);
const sealBytes=readFileSync(join(root,'PRE-SCORE-CAMPAIGN-SEAL.json'));
requireIt(quality.campaign_seal_sha256===sha(sealBytes),'quality-campaign-seal');
const rows=[];
for(const caseResult of quality.rows){
 for(const arm of ['control','workspace']){
  const name=caseResult.pair+'-'+arm,path=join(root,name),scoreBytes=readFileSync(join(path,'NATIVE-SCORE.json'));
  requireIt(sha(scoreBytes)===caseResult[arm].score_sha256,'score-seal');
  const score=JSON.parse(scoreBytes),bundleBytes=readFileSync(join(root,'score-bundles',name,'BUNDLE.json'));
  requireIt(score.bundle_sha256===sha(bundleBytes),'bundle-seal');
  const bundle=JSON.parse(bundleBytes);
  rows.push({pair:caseResult.pair,arm,...diagnoseAcquisitionCommitment(score.native),
   absent_native_reference_paths:bundle.missing_source_paths,
   costs:caseResult[arm],interpretation:'Coverage attribution only. An unacquired reference may be unavailable in base source; retention is not semantic correctness or a reason to select every read.'});
 }
}
requireIt(rows.length===24,'complete-denominator');
const report={schema_version:'are.g02-acquisition-commitment-diagnostic/v1',quality_result_sha256:sha(qualityBytes),
 status:'post-score-development-attribution',rows,
 aggregate:Object.fromEntries(['control','workspace'].map(arm=>{
  const rs=rows.filter(r=>r.arm===arm),average=key=>rs.reduce((n,r)=>n+r.file[key],0)/rs.length;
  return [arm,{mean_unacquired_file_coverage:average('unacquired_coverage'),
   mean_acquired_but_unselected_file_coverage:average('acquired_but_unselected_coverage'),
   cases_with_absent_native_reference:rs.filter(r=>r.absent_native_reference_paths.length>0).length}];
 })),
 claim_ceiling:'No new confirmation, causal attribution, gate revision, metric correction or superiority.',
 authority_effect:'none',open_questions_owner:'G02-NATIVE-CANDIDATE-WORKSPACE-R1.md'};
writeFileSync(join(root,'ACQUISITION-COMMITMENT-DIAGNOSTIC.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:report.status,aggregate:report.aggregate,sha256:sha(readFileSync(join(root,'ACQUISITION-COMMITMENT-DIAGNOSTIC.json')))}));
