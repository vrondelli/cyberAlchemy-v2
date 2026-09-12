// Read-only audit of selected research artifacts. Open questions: AUDIT.md.
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
const root=resolve(fileURLToPath(new URL('../../../',import.meta.url)));
const external='implementation/agent-reasoning-engine/benchmarks/external-context-v1';
const old='implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/research';
const paths=[`${old}/dag-payload-live-87-final.json`,'agent-reasoning-engine/research/feedback-timing-v1/dag.json',`${external}/recovery-reservation-v1/dag.json`,'agent-reasoning-engine/research/tool-state-audit-v1/dag.json'];
for(const d of readdirSync(resolve(root,external),{withFileTypes:true}).filter(x=>x.isDirectory()))for(const f of readdirSync(resolve(root,external,d.name)))if(/^(research|research-result|reviewed-research-result)\.json$/.test(f))paths.push(`${external}/${d.name}/${f}`);
const result=[];
for(const path of paths){const bytes=readFileSync(resolve(root,path)),x=JSON.parse(bytes), records=x.records??[],counts={};
 for(const r of records)counts[r.schema_version]=(counts[r.schema_version]??0)+1;
 const invalid=records.filter(r=>!verifyEvolutionRecord(r,r.schema_version).ok).map(r=>r.record_id);
 const nodes=x.projection?.nodes??x.nodes??records.map(r=>({id:r.record_id}));const ids=new Set(nodes.map(n=>typeof n==='string'?n:n.node_id??n.record_id??n.id));
 // Planning dependency lists and explicit projections are separate formats.
 const edges=x.projection?.edges??nodes.flatMap(n=>(n.depends_on??[]).map(from=>({from,to:n.id})));
 const unresolved=edges.filter(e=>!ids.has(e.from)||!ids.has(e.to));const incoming=new Map([...ids].map(i=>[i,0]));for(const e of edges)if(incoming.has(e.from)&&incoming.has(e.to))incoming.set(e.to,incoming.get(e.to)+1);
 const queue=[...ids].filter(i=>incoming.get(i)===0);let seen=0;while(queue.length){const id=queue.shift();seen++;for(const e of edges.filter(e=>e.from===id)){if(!incoming.has(e.to))continue;incoming.set(e.to,incoming.get(e.to)-1);if(incoming.get(e.to)===0)queue.push(e.to);}}
 result.push({path,sha256:createHash('sha256').update(bytes).digest('hex'),record_count:records.length,schemas:counts,invalid_records:invalid,node_count:ids.size,edge_count:edges.length,unresolved_edges:unresolved,internal_edges_acyclic:seen===ids.size,standalone_graph_closed:unresolved.length===0,hypotheses:records.filter(r=>r.schema_version==='are.research-hypothesis/v1').map(r=>({id:r.record_id,key:r.hypothesis_key,parent:r.parent_hypothesis_ref??null,provenance:r.provenance_refs})),decisions:records.filter(r=>r.schema_version==='are.learning-decision/v1').map(r=>({id:r.record_id,hypothesis:r.hypothesis_ref,disposition:r.disposition,next_action:r.next_action})),question_bound_work_tasks:(x.tasks??x.nodes??[]).filter(n=>n.question_ref&&n.validator_ref&&n.completion_criteria).length});
}
const out={schema_version:'are.research-method-audit-checks/v1',scope:'Selected terminal H23 DAG, shallow external research bundles, and three recent planning DAGs; record verification is structural/integrity evidence, not proof of causal validity or historical preregistration.',files:result,open_questions_ref:'AUDIT.md#open-questions',authority_effect:'none'};
writeFileSync(new URL('record-checks.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({files:result.length,records:result.reduce((s,r)=>s+r.record_count,0),invalid:result.reduce((s,r)=>s+r.invalid_records.length,0),unresolved:result.reduce((s,r)=>s+r.unresolved_edges.length,0),internal_cycles:result.filter(r=>!r.internal_edges_acyclic).map(r=>r.path)}));
