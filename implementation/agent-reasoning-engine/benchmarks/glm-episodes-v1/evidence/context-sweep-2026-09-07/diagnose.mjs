import {readFileSync,writeFileSync} from 'node:fs';
import {parsePatchSetCandidate} from '/home/vrondelli/projects/cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/coding-agent-runtime/patch-set-runtime.mjs';
const p='/home/vrondelli/projects/cyberAlchemy-v2/implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/evidence/context-sweep-2026-09-07';
const result=JSON.parse(readFileSync(`${p}/result.json`));
const outcomes=[];
for(const trial of result.trials){
 const a=JSON.parse(readFileSync(`${p}/trial-${String(trial.index).padStart(2,'0')}/arm-0/visible-trace.json`));
 if(!a.reason_codes?.includes('glm.candidate-invalid'))continue;
 const parsed=parsePatchSetCandidate(a.final_response_evidence?.text??'');
 let candidate;try{candidate=JSON.parse(a.final_response_evidence?.text)}catch{}
 outcomes.push({index:trial.index,soft_limit:trial.soft_limit,policy:trial.policy,reason_codes:parsed.reason_codes??[],json_valid:!!candidate,top_level_keys:candidate?Object.keys(candidate):[],change_keys:candidate?.changes?.map(c=>Object.keys(c)),evidence_ref:`trial-${String(trial.index).padStart(2,'0')}/arm-0/visible-trace.json`});
}
writeFileSync(`${p}/candidate-diagnostics.json`,JSON.stringify({authority_effect:'none',posture:'post-run-read-only-diagnosis-no-candidate-repair',outcomes,open_questions_ref:'README.md#open-questions'},null,2)+'\n');
console.log(JSON.stringify(outcomes));
