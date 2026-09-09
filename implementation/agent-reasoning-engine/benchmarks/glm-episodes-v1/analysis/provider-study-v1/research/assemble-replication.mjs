// Append exact versions, preserve predecessor edges. Open questions: NEXT.md.
import {readFileSync,existsSync} from 'node:fs';import {resolve} from 'node:path';import {createHash} from 'node:crypto';
import {save} from '../controller.mjs';import {layers} from '../../hypothesis-study-v1/build.mjs';import {verifyEvolutionRecord} from '../../../../../packages/evolution-runtime/index.mjs';
const sources=[],records=new Map(),edges=[],keys=new Set();
function pin(p){const u=new URL(p,import.meta.url),b=readFileSync(u);sources.push({path:u.pathname,sha256:createHash('sha256').update(b).digest('hex')});return JSON.parse(b);}
function add(r){if(!verifyEvolutionRecord(r,r.schema_version).ok)throw Error('invalid canonical record');if(records.has(r.record_id)&&JSON.stringify(records.get(r.record_id))!==JSON.stringify(r))throw Error('identity collision');records.set(r.record_id,r);}
const previous=pin('dag-source-62-final.json');previous.records.forEach(add);
const final=new URL('../source-replication-v1/review-final/research.json',import.meta.url);
if(existsSync(final))pin('../source-replication-v1/review-final/research.json').records.forEach(add);
else for(const p of ['../source-replication-v1/hypothesis.json','../source-replication-v1/prepared/experiment.json'])add(pin(p));
function edge(from,to){if(!records.has(from)||!records.has(to))throw Error('unresolved dependency');const k=from+' '+to;if(!keys.has(k)){keys.add(k);edges.push({from,to});}}
for(const e of previous.projection.edges)edge(e.from,e.to);
for(const r of records.values()){
 if(r.parent_hypothesis_ref)edge(r.parent_hypothesis_ref,r.record_id);
 if(r.schema_version==='are.research-experiment/v1')edge(r.hypothesis_ref,r.record_id);
 if(r.schema_version==='are.hypothesis-observation/v1')edge(r.hypothesis_ref,r.record_id);
 if(r.schema_version==='are.learning-decision/v1'){if(r.experiment_ref)edge(r.experiment_ref,r.record_id);for(const o of r.observation_refs){if(r.experiment_ref)edge(r.experiment_ref,o);edge(o,r.record_id);}}
}
const lineage=pin('../source-replication-v1/lineage.json');edge(lineage.predecessor_observation_ref,lineage.hypothesis_ref);
const nodes=[...records.values()].map(r=>({id:r.record_id,kind:r.schema_version}));save(resolve(process.argv[2]),{kind:'explicit-research-version-dag',registration_status:'not-registered',records:[...records.values()],sources,projection:{nodes,edges,dependency_layers:layers(nodes,edges)},authority_effect:'none',open_questions_ref:'NEXT.md'});console.log(JSON.stringify({records:records.size,edges:edges.length,replication_observed:existsSync(final)}));
