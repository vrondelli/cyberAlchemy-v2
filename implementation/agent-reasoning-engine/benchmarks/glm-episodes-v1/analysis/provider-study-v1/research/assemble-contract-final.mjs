// Complete-study versions join the existing research history. Open questions: NEXT.md.
import {readFileSync} from 'node:fs';import {resolve} from 'node:path';import {createHash} from 'node:crypto';
import {save} from '../controller.mjs';import {layers} from '../../hypothesis-study-v1/build.mjs';import {verifyEvolutionRecord} from '../../../../../packages/evolution-runtime/index.mjs';
const sources=[],records=new Map(),edges=[],seen=new Set();
function pin(p){const u=new URL(p,import.meta.url),b=readFileSync(u);sources.push({path:u.pathname,sha256:createHash('sha256').update(b).digest('hex')});return JSON.parse(b);}
function add(r){if(!verifyEvolutionRecord(r,r.schema_version).ok)throw Error('invalid record');if(records.has(r.record_id)&&JSON.stringify(records.get(r.record_id))!==JSON.stringify(r))throw Error('identity collision');records.set(r.record_id,r);}
const prior=pin('dag-live-67-prepared.json'),final=pin('final-contract-study/research.json'),report=pin('final-contract-study/report.json');if(report.complete!==true||report.completed!==120)throw Error('full cohort required');prior.records.forEach(add);final.records.forEach(add);
function edge(from,to){if(!records.has(from)||!records.has(to))throw Error('unresolved dependency');const k=from+' '+to;if(!seen.has(k)){seen.add(k);edges.push({from,to});}}
prior.projection.edges.forEach(e=>edge(e.from,e.to));
for(const r of final.records){
 if(r.parent_hypothesis_ref)edge(r.parent_hypothesis_ref,r.record_id);
 if(r.schema_version==='are.research-experiment/v1'){edge(r.hypothesis_ref,r.record_id);for(const o of r.observation_refs)edge(r.record_id,o);}
 if(r.schema_version==='are.hypothesis-observation/v1')edge(r.hypothesis_ref,r.record_id);
 if(r.schema_version==='are.learning-decision/v1'){if(r.experiment_ref)edge(r.experiment_ref,r.record_id);for(const o of r.observation_refs)edge(o,r.record_id);}
}
const frontier=pin('metadata-frontier-63.json').records.find(r=>r.schema_version==='are.learning-decision/v1');for(const r of final.records.filter(r=>r.schema_version==='are.research-experiment/v1'))edge(frontier.record_id,r.record_id);
const nodes=[...records.values()].map(r=>({id:r.record_id,kind:r.schema_version}));save(resolve(process.argv[2]),{kind:'explicit-research-version-dag',registration_status:'not-registered',records:[...records.values()],sources,projection:{nodes,edges,dependency_layers:layers(nodes,edges)},authority_effect:'none',open_questions_ref:'NEXT.md'});console.log(JSON.stringify({records:records.size,edges:edges.length}));
