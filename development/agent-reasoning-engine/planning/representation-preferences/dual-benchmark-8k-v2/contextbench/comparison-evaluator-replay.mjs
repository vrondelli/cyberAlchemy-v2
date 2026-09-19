// Retained-evidence evaluator replay, not a new experiment. Open questions: COMPARISON-EVALUATOR-REPLAY.md.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,existsSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {scoreNativeBounded} from './packet-diversity-v1/scorer-bridge-bounded-v4.mjs';
import {createStageOutputGuard,MAXIMUM_STAGE_BYTES} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
import {recoveryMetrics} from './score-recovery-campaign.mjs';
const root=import.meta.dirname,output=join(root,'comparison-evaluator-replay-r1');
const inputs={config:join(root,'discovery-v1/live-config.json'),prediction:join(root,'recovery-trajectory-r1-partial-score/contextbench-2-control/prediction.json'),prior_score:join(root,'recovery-trajectory-r1-partial-score/contextbench-2-control/native-score.json'),binding:join(root,'../storage-host-binding.json')};
const hashes=()=>Object.fromEntries(Object.entries(inputs).map(([k,p])=>[k,createHash('sha256').update(readFileSync(p)).digest('hex')]));
const pins=hashes(),config=JSON.parse(readFileSync(inputs.config)),prediction=JSON.parse(readFileSync(inputs.prediction)),prior=JSON.parse(readFileSync(inputs.prior_score)),binding=JSON.parse(readFileSync(inputs.binding));
assert.equal(existsSync(output),false,'exclusive replay stage');
const storage=guardStorage({binding,output,growth_reservation_bytes:MAXIMUM_STAGE_BYTES});
mkdirSync(output,{mode:0o700});
const guard=createStageOutputGuard({root:output}),persistence=createStagePersistence({stage_root:output,stage_guard:guard});
persistence.writeJson(join(output,'PLAN.json'),{schema:'are.comparison-evaluator-replay/v1',inputs,pins,storage,new_provider_calls:0,new_benchmark_run:false});
let result;
try{
 const score=await scoreNativeBounded({config,prediction,directory:join(output,'evaluation'),stage_root:output,stage_guard:guard,persistence});
 assert.deepEqual(hashes(),pins,'input drift');assert.deepEqual(recoveryMetrics(score),recoveryMetrics(prior),'retained native metric mismatch');
 assert.equal(existsSync(join(output,'evaluation/private-base')),false,'private source cleanup');
 result={status:'passed',metrics:recoveryMetrics(score),matches_retained_score:true,private_sources_cleaned:true};
}catch(error){result={status:'failed',error:String(error.message),diagnostic:error.diagnostic??null};}
result={...result,new_provider_calls:0,new_benchmark_run:false,benchmark_cleared:false,pins,stage_bytes:guard.snapshot().bytes};
persistence.writeJson(join(output,'RESULTS.json'),result,{final:true});console.log(JSON.stringify(result));if(result.status!=='passed')process.exitCode=1;
