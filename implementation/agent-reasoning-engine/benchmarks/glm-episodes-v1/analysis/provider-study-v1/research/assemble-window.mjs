// Explicit successor DAG; live completion is required for H14. Open questions: NEXT.md#open-questions.
import {readFileSync} from 'node:fs';import {resolve} from 'node:path';import {createHash} from 'node:crypto';import {save} from '../controller.mjs';import {layers} from '../../hypothesis-study-v1/build.mjs';import {verifyEvolutionRecord} from '../../../../../packages/evolution-runtime/index.mjs';
const sources=[],records=new Map(),edges=[],keys=new Set();
const pin=p=>{const u=new URL(p,import.meta.url),bytes=readFileSync(u);sources.push({path:u.pathname,sha256:createHash('sha256').update(bytes).digest('hex')});return JSON.parse(bytes);};
for(const path of ['dag.json','../window-study-v1/review-1/research.json','../contract-window-v1/review-final/research.json'])for(const r of pin(path).records){if(!verifyEvolutionRecord(r,r.schema_version).ok)throw Error('invalid record');if(records.has(r.record_id)&&JSON.stringify(records.get(r.record_id))!==JSON.stringify(r))throw Error('identity collision');records.set(r.record_id,r);}
for(const p of ['../source-instruction-v1/hypothesis.json','../source-instruction-v1/prepared/experiment.json']){const r=pin(p);if(!verifyEvolutionRecord(r,r.schema_version).ok)throw Error('invalid candidate record');records.set(r.record_id,r);}
const edge=(from,to)=>{if(!records.has(from)||!records.has(to))throw Error('unresolved edge');const key=from+' '+to;if(!keys.has(key)){keys.add(key);edges.push({from,to});}};
for(const r of records.values()){
 if(r.parent_hypothesis_ref)edge(r.parent_hypothesis_ref,r.record_id);
 if(r.schema_version==='are.research-experiment/v1'){edge(r.hypothesis_ref,r.record_id);for(const o of r.observation_refs)edge(r.record_id,o);}
 if(r.schema_version==='are.hypothesis-observation/v1')edge(r.hypothesis_ref,r.record_id);
 if(r.schema_version==='are.learning-decision/v1'){if(r.experiment_ref)edge(r.experiment_ref,r.record_id);for(const o of r.observation_refs){if(r.experiment_ref)edge(r.experiment_ref,o);edge(o,r.record_id);}}
}
const lineage=pin('../contract-window-v1/lineage.json');edge(lineage.predecessor_observation_ref,lineage.hypothesis_ref);
const nodes=[...records.values()].map(r=>({id:r.record_id,kind:r.schema_version}));save(resolve(process.argv[2]),{kind:'explicit-research-version-dag',registration_status:'not-registered',records:[...records.values()],sources,projection:{nodes,edges,dependency_layers:layers(nodes,edges)},authority_effect:'none',open_questions_ref:'NEXT.md#open-questions'});console.log(JSON.stringify({records:records.size,edges:edges.length}));
