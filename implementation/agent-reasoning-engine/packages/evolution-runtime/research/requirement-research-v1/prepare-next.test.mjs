import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildManifest,nextProgress,validateHypotheses} from './prepare-next.mjs';
test('144 deterministic turns with balanced arm order and no label leakage',()=>{
  const m=buildManifest();assert.deepEqual(m,buildManifest());assert.equal(m.schedule.length,144);
  const counts=new Map();let baselineFirst=0;
  for(let i=0;i<m.schedule.length;i+=2) {
    const [a,b]=m.schedule.slice(i,i+2);assert.equal(a.case_id,b.case_id);assert.equal(a.repetition,b.repetition);
    assert.notEqual(a.variant,b.variant);if(a.variant==='baseline')baselineFirst++;
  }
  assert.equal(baselineFirst,36);
  for(const r of m.schedule) {
    const key=r.case_id+':'+r.variant;counts.set(key,(counts.get(key)||0)+1);
    const payload=JSON.parse(r.prompt.slice(m.prompts[r.variant].length));
    assert.deepEqual(Object.keys(payload),['objective','requirements','request']);
  }
  assert.equal(counts.size,48);assert.ok([...counts.values()].every(n=>n===3));
});
test('hypothesis evidence unlocks latency registration but not replication execution',()=>{
  const p=nextProgress();assert.deepEqual(p,nextProgress());
  assert.deepEqual(p.frontier.product_construction,['latency.register']);
  assert.equal(p.tasks.find(t=>t.task_id==='replication.register').state,'running');
  assert.equal(p.tasks.find(t=>t.task_id==='replication.run').state,'planned');
});
test('hypotheses without falsification or with invented priority are rejected',()=>{
  const read=()=>JSON.parse(readFileSync(new URL('latency-hypotheses-001.json',import.meta.url),'utf8'));
  const a=read();delete a.hypotheses[0].falsification;assert.throws(()=>validateHypotheses(a));
  const b=read();b.priority[0]='invented';assert.throws(()=>validateHypotheses(b));
});
