import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {digest,sealed} from '../../../request-intent-runtime/src/canonical.mjs';
import {produceProgress,validateArtifact} from './verify-start.mjs';
import {materializeResearchDag} from '../../src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../src/research-work.mjs';
const read = name => JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
const design = read('replication-design-001.json');
const hypotheses = read('latency-hypotheses-001.json');
const input=read('../../plans/requirement-research-v1.json');
const registrations=input.registration_digests.map(id=>read('../../research-records/'+id+'.json'));
const plan=materializeResearchPlan({research_dag:materializeResearchDag({registrations}),registrations,tasks:input.tasks});

export function validateHypotheses(a) {
  assert.equal(a.schema_version,'are.research-task-artifact/v1');
  assert.equal(a.plan_digest,plan.plan_digest);
  assert.equal(a.task_id,'latency.hypothesize');
  assert.equal(a.criterion_id,'falsifiable-hypotheses');
  assert.equal(a.authority_effect,'none');
  assert.equal(a.status,'untested');
  assert.equal(a.evidence_ref,'input-composition-001.json');
  validateArtifact(read(a.evidence_ref));
  assert.equal(a.hypotheses.length,3);
  assert.equal(new Set(a.hypotheses.map(h=>h.id)).size,3);
  for(const h of a.hypotheses) {
    for(const k of ['id','claim','basis','intervention','primary_metric','success_rule','falsification']) assert.ok(typeof h[k]==='string' && h[k].trim());
    assert.ok(h.prerequisites.length && h.confounders.length);
  }
  assert.deepEqual([...a.priority].sort(),a.hypotheses.map(h=>h.id).sort());
}

export function buildManifest() {
  validateArtifact(design);
  const prompts={
    baseline:'Classify whether this request continues the recorded objective (continue) or changes its requirements (refine). Return only JSON with transition and resulting_requirements, the complete updated requirement string array. Do not use tools. Input: ',
    treatment:'Compare the requested requirements with the recorded set. Adding an absent requirement or removing a present requirement is refine. Repeating a present requirement or excluding an absent requirement is continue. Preserve every unremoved requirement. First account for retained, added and removed requirements. Return only JSON with transition, resulting_requirements (the complete updated string array), and requirement_delta containing retained, added and removed arrays. Copy existing requirements exactly; use concise noun phrases from the request for additions. Do not use tools. Input: '
  };
  const schedule=[];
  for(let repetition=0;repetition<3;repetition++) {
    const cases=[...design.cases].sort((a,b)=>{
      const x=digest(['requirement-replication-001',repetition,a.id]),y=digest(['requirement-replication-001',repetition,b.id]);return x<y?-1:x>y?1:0;
    });
    for(const [index,c] of cases.entries()) {
      const variants=(index+repetition)%2?['treatment','baseline']:['baseline','treatment'];
      for(const variant of variants) {
        // Only these three fields may enter the model input; never labels or case IDs.
        const prompt=prompts[variant]+JSON.stringify({objective:c.objective,requirements:c.requirements,request:c.request});
        schedule.push({ordinal:schedule.length+1,case_id:c.id,repetition:repetition+1,variant,prompt,prompt_digest:digest(prompt)});
      }
    }
  }
  return sealed('are.requirement-replication-preparation/v1',{
    experiment_id:'requirement-replication-001',plan_digest:plan.plan_digest,
    design_digest:digest(design),model:design.model,effort:design.effort,binary_version:design.binary_version,
    node_version:'v26.8.1',cases:design.cases,prompts,schedule,
    status:'prepared-not-runnable',
    scoring:{normalization:'trim and lowercase strings; reject duplicate normalized requirements',classification:'exact continue/refine label; malformed output counts as incorrect',sets:'exact normalized set equality; malformed output fails preservation',treatment_delta:'retained and removed partition the original set; additions are disjoint from it; retained plus added equals resulting set',improvement:'strictly more correct treatment labels across all 72 paired observations and all 72 treatment sets preserved',statistics:'report case-level paired discordances and all repetitions; no claim of 72 independent cases',latency:'report p50/p95 first-text, turn and startup separately; one-second boundary reported separately'},
    failure_policy:'Preserve partial output and stop on transport, model, effort or binary mismatch. No silent retries or post-output protocol tuning.',
    pending:['Implement and test exact result-registration adapter and scorer.','Bind runner, scorer and effective environment/configuration before execution.'],
    label_review:'Declared set transitions checked locally; independent linguistic review not performed.',
    execution_effect:'none'
  },'manifest_digest');
}

export function nextProgress() {
  const prior=produceProgress();
  assert.deepEqual(prior,read('progress-001.json'));
  validateHypotheses(hypotheses);
  const events=[...prior.events,
    {event_id:'latency.hypothesize.start.001',task_id:'latency.hypothesize',action:'start'},
    {event_id:'latency.hypothesize.complete.001',task_id:'latency.hypothesize',action:'complete',evidence:[{criterion_id:hypotheses.criterion_id,artifact_ref:'latency-hypotheses-001.json',artifact_digest:digest(hypotheses)}]},
    {event_id:'replication.register.start.001',task_id:'replication.register',action:'start'}];
  const verify_evidence=binding=>{
    assert.ok(['input-composition-001.json','replication-design-001.json','latency-hypotheses-001.json'].includes(binding.artifact_ref));
    const a=read(binding.artifact_ref);
    if(a.task_id==='latency.hypothesize')validateHypotheses(a);else validateArtifact(a);
    assert.equal(binding.plan_digest,a.plan_digest);assert.equal(binding.task_id,a.task_id);
    assert.equal(binding.criterion_id,a.criterion_id);assert.equal(binding.artifact_digest,digest(a));
    assert.equal(binding.validator_ref,'are.research-artifact-validator/v1');
    return {ok:true,binding};
  };
  return replayResearchWork({plan,registrations,events,verify_evidence});
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const output={manifest:buildManifest(),progress:nextProgress()};
  if(process.argv.includes('--check-saved')) {
    assert.deepEqual(output.manifest,read('replication-manifest-001.json'));
    assert.deepEqual(output.progress,read('progress-002.json'));
    console.log(JSON.stringify({ok:true,manifest_digest:output.manifest.manifest_digest,frontier:output.progress.frontier}));
  } else console.log(JSON.stringify(output,null,2));
}
