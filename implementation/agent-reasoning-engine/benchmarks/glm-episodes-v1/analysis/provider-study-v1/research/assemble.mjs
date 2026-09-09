// Join immutable research versions with explicit lineage. Open questions: README.md#open-questions.
import {readFileSync,existsSync} from 'node:fs';import {createHash} from 'node:crypto';import {resolve} from 'node:path';
import {save} from '../controller.mjs';import {layers} from '../../hypothesis-study-v1/build.mjs';import {verifyEvolutionRecord} from '../../../../../packages/evolution-runtime/index.mjs';
const sources=[],records=new Map(),edges=[],keys=new Set();
const add=record=>{if(!verifyEvolutionRecord(record,record.schema_version).ok)throw Error('invalid research record');const old=records.get(record.record_id);if(old&&JSON.stringify(old)!==JSON.stringify(record))throw Error('record identity collision');records.set(record.record_id,record);};
for(const path of ['../../hypothesis-study-v1/bundle.json','blocks-0-3/research.json','b3-baseline-audit/research.json',...['pressure','pressure-v2','pressure-v3','pressure-v4','pressure-v5'].map(p=>'../'+p+'/evaluation.json')]){
 const u=new URL(path,import.meta.url);if(!existsSync(u))throw Error('required review missing: '+path);const bytes=readFileSync(u),r=JSON.parse(bytes);sources.push({path:u.pathname,sha256:createHash('sha256').update(bytes).digest('hex')});r.records.forEach(add);
}
const edge=(from,to)=>{if(!records.has(from)||!records.has(to))throw Error('unresolved dependency: '+from+' -> '+to);const key=from+' '+to;if(!keys.has(key)){keys.add(key);edges.push({from,to});}};
for(const r of records.values()){
 if(r.parent_hypothesis_ref)edge(r.parent_hypothesis_ref,r.record_id);
 if(r.schema_version==='are.research-experiment/v1'){edge(r.hypothesis_ref,r.record_id);for(const o of r.observation_refs)edge(r.record_id,o);}
 if(r.schema_version==='are.hypothesis-observation/v1')edge(r.hypothesis_ref,r.record_id);
 if(r.schema_version==='are.learning-decision/v1'){if(r.experiment_ref)edge(r.experiment_ref,r.record_id);for(const o of r.observation_refs){if(r.experiment_ref)edge(r.experiment_ref,o);edge(o,r.record_id);}}
}
const nodes=[...records.values()].map(r=>({id:r.record_id,kind:r.schema_version}));
save(resolve(process.argv[2]),{kind:'explicit-research-version-dag',registration_status:'not-registered',ontology_ref:'packages/evolution-runtime/ontology/research-learning-v1.json',selected_definitions:['ARE-RL-D01','ARE-RL-D02','ARE-RL-D03','ARE-RL-D04','ARE-RL-D07'],records:[...records.values()],projection:{nodes,edges,dependency_layers:layers(nodes,edges)},sources,authority_effect:'none',open_questions_ref:'README.md#open-questions'});console.log(JSON.stringify({records:records.size,edges:edges.length}));
