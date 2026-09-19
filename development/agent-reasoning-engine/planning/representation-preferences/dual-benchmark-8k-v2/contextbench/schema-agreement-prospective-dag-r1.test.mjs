// Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {buildProspectiveDag,verifyProspectiveDag} from './schema-agreement-prospective-dag-r1.mjs';
const candidate=JSON.parse(readFileSync(new URL('./SCHEMA-AGREEMENT-RESEARCH-R1.json',import.meta.url))),parent=JSON.parse(readFileSync(candidate.parent_ref));
test('prospective hypotheses, selection, experiment and all gates have complete acyclic linkage',()=>{
 const graph=buildProspectiveDag({candidate,parent});assert.equal(verifyProspectiveDag({graph,candidate,parent}),true);
 const positions=new Map(graph.dependency_layers.flatMap((layer,i)=>layer.map(id=>[id,i])));
 for(const e of graph.edges)assert.ok(positions.get(e.from)<positions.get(e.to));
 for(const h of candidate.records)assert.ok(graph.edges.some(e=>e.from===parent.registration.question.record_id&&e.to===h.record_id));
 assert.equal(graph.nodes.filter(n=>n.kind==='task-gate').length,parent.work.tasks.length);
 assert.ok(!graph.nodes.some(n=>['observation','implementation'].includes(n.kind)));
});
test('missing prospective records, changed selections and missing graph edges fail closed',()=>{
 for(const mutate of [c=>c.records.pop(),c=>c.selection.selected=c.selection.counterhypotheses[0],c=>c.selection.counterhypotheses.pop()]){const c=structuredClone(candidate);mutate(c);assert.throws(()=>buildProspectiveDag({candidate:c,parent}));}
 const graph=buildProspectiveDag({candidate,parent});graph.edges.pop();assert.throws(()=>verifyProspectiveDag({graph,candidate,parent}));
});
test('task cycles, unknown prerequisites and unrelated question references fail closed',()=>{
 for(const mutate of [p=>p.work.tasks[0].depends_on.push(p.work.tasks[0].task_id),p=>p.work.tasks[0].depends_on.push('missing'),p=>p.work.tasks[0].question_ref='unrelated']){const p=structuredClone(parent);mutate(p);const c={...candidate,work:p.work};assert.throws(()=>buildProspectiveDag({candidate:c,parent:p}));}
});
