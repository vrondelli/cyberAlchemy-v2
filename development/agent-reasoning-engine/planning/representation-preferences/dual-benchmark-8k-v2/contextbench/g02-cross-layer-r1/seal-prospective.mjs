// Seal both source-only predictions and costs before native gold is opened.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

const suffix=process.env.G02_PAIR_SUFFIX??'groups-r1';
if(!/^[a-z0-9-]+$/.test(suffix))throw Error('g02-pair-seal.invalid-target');
const root='/opt/are-benchmark-runs/g02-cross-layer-'+suffix;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const parse=path=>JSON.parse(readFileSync(join(root,path)));
const need=(value,reason)=>{if(!value)throw Error('g02-pair-seal.'+reason);};
need(!existsSync(join(root,'PAIR-PRE-SCORE-SEAL.json')),'already-sealed');
const freeze=parse('FREEZE.json'),binding=parse('tasks/binding.json');
for(const [path,digest] of Object.entries(freeze.source_hashes))need(sha(readFileSync(join(root,path)))===digest,'source-drift:'+path);
const are=parse('evidence/RESULTS.json'),areSettlement=parse('ARE-SETTLEMENT.json');
const control=parse('dsh-export/EXPORT.json'),dshSettlement=parse('dsh-control/SETTLEMENT.json');
need(are.status==='final_context_selected'&&areSettlement.exit_code===0,'are-invalid');
need(control.status==='final_context_selected'&&dshSettlement.exit_code===0,'dsh-invalid');
need(control.accounting.known_total_tokens>0&&are.known_total_tokens>0,'usage-missing');
const paths={are:'evidence/run/prediction.json',dsh:'dsh-export/prediction.json'};
const predictions={};
for(const [arm,path] of Object.entries(paths)){
  const bytes=readFileSync(join(root,path)),prediction=JSON.parse(bytes);
  need(prediction.instance_id===binding.instance_id&&prediction.commit===binding.base_commit,'prediction-identity:'+arm);
  predictions[arm]={path,sha256:sha(bytes),pred_files:prediction.traj_data?.pred_files?.length??null};
}
need(predictions.dsh.sha256===control.prediction_sha256,'control-export-drift');
const seal={schema_version:'are.g02-pair-pre-score-seal/v1',status:'both-valid-predictions-and-costs-sealed-before-scoring',
  instance_id:binding.instance_id,freeze_sha256:sha(readFileSync(join(root,'FREEZE.json'))),predictions,
  known_model_tokens:{are:are.known_total_tokens,dsh:control.accounting.known_total_tokens},
  arm_seconds:{are:areSettlement.elapsed_seconds,dsh:dshSettlement.elapsed_seconds},
  model_calls:{are:are.model_calls,dsh:control.accounting.model_calls??null},
  score_posture:'native scorer not invoked at seal time; no gold was read for candidate selection'};
writeFileSync(join(root,'PAIR-PRE-SCORE-SEAL.json'),JSON.stringify(seal,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify(seal));
