// Prospective dependency evidence only. Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import assert from 'node:assert/strict';
import {digest} from '../../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {verifyEvolutionRecord} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
export function buildProspectiveDag({candidate,parent}){
 const hypotheses=candidate.records, experiment=candidate.experiment, question=parent.registration.question;
 assert.equal(hypotheses.length,3);assert.equal(new Set(hypotheses.map(h=>h.record_id)).size,3);
 for(const h of hypotheses){assert.equal(h.schema_version,'are.research-hypothesis/v1');assert.equal(verifyEvolutionRecord(h).ok,true);}
 assert.equal(verifyEvolutionRecord(experiment).ok,true);assert.equal(experiment.schema_version,'are.research-experiment/v1');
 assert.equal(experiment.hypothesis_ref,candidate.selection.selected);
 assert.ok(hypotheses.some(h=>h.record_id===candidate.selection.selected));
 assert.deepEqual([...candidate.selection.counterhypotheses].sort(),hypotheses.filter(h=>h.record_id!==candidate.selection.selected).map(h=>h.record_id).sort());
 assert.deepEqual(candidate.work,parent.work);assert.equal(candidate.dispatch_admitted,false);
 const selectionId='selection:'+digest(candidate.selection);
 const nodes=[{id:question.record_id,kind:'parent-question',source_digest:digest(question)},
 ...hypotheses.map(h=>({id:h.record_id,kind:'hypothesis',source_digest:digest(h),state:'proposed'})),
 {id:selectionId,kind:'selection',source_digest:digest(candidate.selection)},
 {id:experiment.record_id,kind:'experiment',source_digest:digest(experiment),state:'not-run'},
 ...parent.work.tasks.map(t=>({id:t.task_id,kind:'task-gate',source_digest:digest(t),state:'unverified',lane:t.lane}))];
 const edges=[];const add=(from,to,kind)=>edges.push({from,to,kind});
 for(const h of hypotheses){add(question.record_id,h.record_id,'informs');add(h.record_id,selectionId,h.record_id===candidate.selection.selected?'selected':'competing');}
 add(selectionId,experiment.record_id,'selects-experiment');add(candidate.selection.selected,experiment.record_id,'tests');
 for(const t of parent.work.tasks){assert.equal(t.question_ref,question.record_id);add(experiment.record_id,t.task_id,'requires-gate');for(const d of t.depends_on)add(d,t.task_id,'prerequisite');}
 const ids=new Set(nodes.map(n=>n.id));assert.equal(ids.size,nodes.length);
 for(const e of edges){assert.ok(ids.has(e.from)&&ids.has(e.to));assert.notEqual(e.from,e.to);}
 const pending=new Set(ids),layers=[];
 while(pending.size){const ready=[...pending].filter(id=>!edges.some(e=>e.to===id&&pending.has(e.from))).sort();assert.ok(ready.length,'prospective-dag.cycle');layers.push(ready);for(const id of ready)pending.delete(id);}
 const body={schema:'are.prospective-research-overlay/v1',parent_dag_digest:parent.research_dag.dag_digest,question_ref:question.record_id,nodes,edges,dependency_layers:layers,claim_ceiling:'Prospective logical dependencies only; task gates are unverified, no observations or completed implementation are asserted.',dispatch_admitted:false,authority_effect:'none',open_questions_ref:'RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md'};
 return {...body,dag_digest:digest(body)};
}
export function verifyProspectiveDag({graph,...inputs}){assert.deepEqual(graph,buildProspectiveDag(inputs));return true;}
