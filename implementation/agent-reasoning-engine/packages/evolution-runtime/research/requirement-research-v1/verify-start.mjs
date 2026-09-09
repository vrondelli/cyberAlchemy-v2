import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve, dirname, join} from 'node:path';
import {digest} from '../../../request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../src/research-dag.mjs';
import {materializeResearchPlan, replayResearchWork} from '../../src/research-work.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '../../../../../../..');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const input = json(resolve(directory, '../../plans/requirement-research-v1.json'));
const registrations = input.registration_digests.map(id => {
  assert.match(id, /^[a-f0-9]{64}$/);
  const record = json(resolve(directory, '../../research-records', id + '.json'));
  assert.equal(record.registration_digest, id);
  return record;
});
const research_dag = materializeResearchDag({registrations});
assert.equal(research_dag.dag_digest, input.research_dag_digest);
const plan = materializeResearchPlan({research_dag, registrations, tasks: input.tasks});
const names = ['input-composition-001.json', 'replication-design-001.json'];

export function validateArtifact(a) {
  assert.equal(a.schema_version, 'are.research-task-artifact/v1');
  assert.equal(a.plan_digest, plan.plan_digest);
  assert.equal(a.authority_effect, 'none');
  assert.ok(a.sources.length);
  for (const source of a.sources) {
    assert.ok(source.path.startsWith('cyberAlchemy-v2/'));
    assert.ok(!source.path.split('/').includes('..'));
    assert.equal(createHash('sha256').update(readFileSync(join(root, source.path))).digest('hex'), source.sha256);
  }
  if (a.task_id === 'latency.inspect') {
    assert.equal(a.criterion_id, 'input-composition-report');
    const result = json(join(root, a.sources[0].path));
    const fields = {explicit_prompt_bytes:r=>r.input_bytes,input_tokens:r=>r.token_usage.total.inputTokens,
      cached_input_tokens:r=>r.token_usage.total.cachedInputTokens,output_tokens:r=>r.token_usage.total.outputTokens,
      reasoning_tokens:r=>r.token_usage.total.reasoningOutputTokens,first_text_ms:r=>r.first_text_ms,
      turn_ms:r=>r.elapsed_ms,startup_ms:r=>r.startup_ms};
    const statistics = {};
    assert.equal(result.runs.length, 16);
    for (const variant of ['full','compact']) {
      const runs = result.runs.filter(r=>r.variant===variant);
      assert.equal(runs.length, 8);
      statistics[variant] = Object.fromEntries(Object.entries(fields).map(([key,get])=> {
        const xs = runs.map(get); assert.ok(xs.every(Number.isFinite));
        return [key,{min:Math.min(...xs),max:Math.max(...xs),mean:xs.reduce((x,y)=>x+y,0)/xs.length}];
      }));
    }
    assert.deepEqual(a.statistics, statistics);
    assert.ok(a.limitations.length > 0);
  } else {
    assert.equal(a.task_id, 'replication.design');
    assert.equal(a.criterion_id, 'independent-replication-design');
    assert.equal(a.cases.length, 24);
    assert.equal(new Set(a.cases.map(c=>c.id)).size, 24);
    assert.equal(new Set(a.cases.map(c=>c.domain)).size, 6);
    const prior = json(join(root,a.sources[0].path));
    const pairs = new Map();
    for (const c of a.cases) {
      assert.ok(!prior.cases.some(p=>p.request===c.request));
      const [domain,operation,presence] = c.id.split('.');
      assert.equal(domain,c.domain);
      assert.ok(['add','remove'].includes(operation));
      assert.ok(['present','absent'].includes(presence));
      assert.equal(c.requirements.length,presence==='present'?1:0);
      assert.equal(c.resulting_requirements.length,operation==='add'?1:0);
      if(operation==='add' && presence==='present') assert.deepEqual(c.requirements,c.resulting_requirements);
      assert.equal(c.expected,JSON.stringify(c.requirements)===JSON.stringify(c.resulting_requirements)?'continue':'refine');
      assert.equal(c.pair_id,domain+'.'+operation);
      pairs.set(c.pair_id,[...(pairs.get(c.pair_id)||[]),c]);
    }
    assert.equal(pairs.size,12);
    for(const pair of pairs.values()) {
      assert.equal(pair.length,2);
      assert.equal(pair[0].request,pair[1].request);
      assert.equal(pair[0].objective,pair[1].objective);
      assert.notEqual(pair[0].expected,pair[1].expected);
    }
    assert.deepEqual(a.protocol.variants,['baseline','treatment']);
    assert.equal(a.protocol.repetitions,3);
    assert.equal(a.protocol.total_planned_model_turns,a.cases.length*2*3);
  }
  return true;
}

export function produceProgress() {
  const artifacts = names.map(name=>({name,value:json(join(directory,name))}));
  const events = artifacts.flatMap(({name,value})=>[
    {event_id:value.task_id+'.start.001',task_id:value.task_id,action:'start'},
    {event_id:value.task_id+'.complete.001',task_id:value.task_id,action:'complete',evidence:[{
      criterion_id:value.criterion_id,artifact_ref:name,artifact_digest:digest(value)}]}
  ]);
  const verify_evidence = binding => {
    assert.ok(names.includes(binding.artifact_ref));
    const a = json(join(directory,binding.artifact_ref));
    validateArtifact(a);
    assert.equal(binding.plan_digest,a.plan_digest);
    assert.equal(binding.task_id,a.task_id);
    assert.equal(binding.criterion_id,a.criterion_id);
    assert.equal(binding.validator_ref,'are.research-artifact-validator/v1');
    assert.equal(binding.artifact_digest,digest(a));
    return {ok:true,binding};
  };
  return replayResearchWork({plan,registrations,events,verify_evidence});
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const state = produceProgress();
  if(process.argv.includes('--check-saved')) assert.deepEqual(state,json(join(directory,'progress-001.json')));
  console.log(JSON.stringify(state,null,2));
}
