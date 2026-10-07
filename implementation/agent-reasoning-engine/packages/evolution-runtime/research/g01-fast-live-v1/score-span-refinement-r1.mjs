// Score a sealed source-only G01 exposed-development transform. Never update
// the frozen campaign or reinterpret this diagnostic as a prospective holdout.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const sha=x=>createHash('sha256').update(x).digest('hex');
const need=(x,code)=>{if(!x)throw Error(`g01-refinement-score.${code}`);};
const read=p=>JSON.parse(readFileSync(p));
const f1=x=>{const {coverage,precision}=x;return coverage+precision?2*coverage*precision/(coverage+precision):0;};
const mean=(rows,key)=>rows.reduce((n,row)=>n+row[key],0)/rows.length;

export function scoreSealedRefinement({campaignRoot,stagedRoot,sealSha256,transformScriptPath}){
  need([campaignRoot,stagedRoot,transformScriptPath].every(x=>typeof x==='string'&&x.startsWith('/')&&resolve(x)===x),'absolute-paths');
  const sealPath=join(stagedRoot,'PREDICTION-SEAL.json'),resultPath=join(stagedRoot,'DEVELOPMENT-RESULT.json');
  need(!existsSync(resultPath)&&sha(readFileSync(sealPath))===sealSha256,'seal-drift-or-result-exists');
  const seal=read(sealPath);
  need(seal.schema_version==='are.g01-exposed-span-refinement/v1'&&seal.status==='sealed-before-native-scoring'&&
    seal.script_sha256===sha(readFileSync(transformScriptPath))&&seal.claim_ceiling.includes('Exposed development only'),'seal-or-script');
  const freezePath=join(campaignRoot,'CAMPAIGN-FREEZE.json');
  need(sha(readFileSync(freezePath))===seal.campaign_freeze_sha256,'campaign-drift');
  const frozen=read(freezePath),planIds=frozen.ordered_tasks.map(x=>x.slug);
  need(seal.rows.length===planIds.length&&seal.rows.every((x,i)=>x.slug===planIds[i]),'row-order-or-count');
  const rows=[];
  for(const row of seal.rows){
    const pair=join(campaignRoot,row.slug),oldResult=read(join(pair,'PAIR-RESULT.json'));
    if(row.status==='no-native-prediction'){
      need(!existsSync(join(pair,'candidate/runs/00/prediction.json')),'unsealed-native-prediction');
      rows.push({slug:row.slug,status:oldResult.status,changed:false,
        ...(oldResult.status==='scored'?{control_span_f1:oldResult.control.span_f1,old_candidate_span_f1:oldResult.candidate.span_f1,new_candidate_span_f1:oldResult.candidate.span_f1,
          control_file_f1:oldResult.control.file_f1,old_candidate_file_f1:oldResult.candidate.file_f1,new_candidate_file_f1:oldResult.candidate.file_f1}:{}),
        scoring_basis:oldResult.candidate?.scoring_basis??null});
      continue;
    }
    need(row.status==='staged'&&oldResult.status==='scored'&&oldResult.candidate.scoring_basis==='pinned-native','staged-pair-status');
    const input=join(pair,'candidate/runs/00/prediction.json'),output=join(stagedRoot,row.slug,'prediction.json');
    need(sha(readFileSync(input))===row.input_prediction_sha256&&sha(readFileSync(output))===row.output_prediction_sha256&&
      oldResult.candidate.prediction_sha256===row.input_prediction_sha256,'prediction-binding');
    let newSpan=oldResult.candidate.span_f1,newFile=oldResult.candidate.file_f1,newScoreSha=oldResult.candidate.native_score_sha256;
    if(row.changes.length){
      const plan=read(join(pair,'PAIR-PLAN.json')),scorer=plan.scorer,scorePath=join(stagedRoot,row.slug,'native-score.json');
      need(scorer.image==='are-contextbench-scorer:g01-r1'&&!existsSync(scorePath),'scorer-or-existing-score');
      const args=['run','--rm','--network','host','-v',`${scorer.repo}:/repo:ro`,'-v',`${scorer.upstream}:/upstream:ro`,
        '-v',`${scorer.cache}:/cache`,'-v',`${join(stagedRoot,row.slug)}:/work`,scorer.image,'python',
        '/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py',
        '--upstream','/upstream','--gold','/upstream/data/full.parquet','--pred','/work/prediction.json',
        '--cache','/cache','--out','/work/native-score.json'];
      const run=spawnSync('docker',args,{encoding:'utf8',timeout:180000,maxBuffer:2*1024*1024});
      need(!run.error&&run.status===0&&existsSync(scorePath),'native-score-failed');
      need(sha(readFileSync(output))===row.output_prediction_sha256,'prediction-drift-after-score');
      const score=read(scorePath);newSpan=f1(score.native.final.span);newFile=f1(score.native.final.file);newScoreSha=sha(readFileSync(scorePath));
    }else{
      need(JSON.stringify(read(input))===JSON.stringify(read(output)),'unchanged-prediction-semantics');
      need(sha(readFileSync(join(pair,'candidate/runs/00/native-score.json')))===newScoreSha,'unchanged-native-score-drift');
    }
    rows.push({slug:row.slug,status:'scored',changed:row.changes.length>0,control_span_f1:oldResult.control.span_f1,
      old_candidate_span_f1:oldResult.candidate.span_f1,new_candidate_span_f1:newSpan,
      control_file_f1:oldResult.control.file_f1,old_candidate_file_f1:oldResult.candidate.file_f1,new_candidate_file_f1:newFile,
      new_native_score_sha256:newScoreSha,source_only_prediction_sha256:row.output_prediction_sha256,scoring_basis:'pinned-native'});
  }
  const scored=rows.filter(x=>x.status==='scored');need(scored.length===23,'denominator-drift');
  const receipt={schema_version:'are.g01-exposed-span-refinement-result/v1',status:'scored-development-only',
    campaign_freeze_sha256:seal.campaign_freeze_sha256,prediction_seal_sha256:sealSha256,scorer_script_sha256:sha(readFileSync(import.meta.filename)),
    rows,summary:{planned:rows.length,scored:scored.length,invalid:rows.length-scored.length,changed:rows.filter(x=>x.changed).length,
      control_span_f1_mean:mean(scored,'control_span_f1'),old_candidate_span_f1_mean:mean(scored,'old_candidate_span_f1'),new_candidate_span_f1_mean:mean(scored,'new_candidate_span_f1'),
      control_file_f1_mean:mean(scored,'control_file_f1'),old_candidate_file_f1_mean:mean(scored,'old_candidate_file_f1'),new_candidate_file_f1_mean:mean(scored,'new_candidate_file_f1')},
    claim_ceiling:'Post-hoc exposed-development transform only; no independence, no new model costs measured, no product superiority claim.',
    open_questions:['Does the same source-only rule retain quality on separately frozen, previously unexposed tasks?']};
  writeFileSync(resultPath,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
  return {path:resultPath,sha256:sha(readFileSync(resultPath)),summary:receipt.summary};
}

if(process.argv[1]===import.meta.filename){
  try{console.log(JSON.stringify(scoreSealedRefinement({campaignRoot:process.argv[2],stagedRoot:process.argv[3],sealSha256:process.argv[4],transformScriptPath:process.argv[5]})));}
  catch(error){console.error(JSON.stringify({status:'failed',error:String(error.message)}));process.exitCode=2;}
}
