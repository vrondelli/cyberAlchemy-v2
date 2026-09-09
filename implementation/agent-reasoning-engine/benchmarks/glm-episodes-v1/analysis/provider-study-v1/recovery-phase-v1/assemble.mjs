// Explicit candidate research DAG only. Open questions: H18.md.
import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {layers} from '../../hypothesis-study-v1/build.mjs';
import {verifyEvolutionRecord} from '../../../../../packages/evolution-runtime/index.mjs';
const root=new URL('./',import.meta.url),sources=[],records=new Map(),edges=[],seen=new Set();
const pin=p=>{const b=readFileSync(new URL(p,root));sources.push({path:p,sha256:createHash('sha256').update(b).digest('hex')});return JSON.parse(b);};
const prior=pin('../research/dag-fact-65-final.json'),newRecords=[pin('hypothesis.json'),pin('experiment.json'),...pin('research.json').records,...pin('frontier.json').records];
for(const r of [...prior.records,...newRecords]){if(!verifyEvolutionRecord(r,r.schema_version).ok)throw Error('invalid canonical record');records.set(r.record_id,r);}
const edge=(from,to)=>{if(!records.has(from)||!records.has(to))throw Error('unresolved dependency');const k=from+' '+to;if(!seen.has(k)){seen.add(k);edges.push({from,to});}};
prior.projection.edges.forEach(e=>edge(e.from,e.to));
for(const r of newRecords){if(r.parent_hypothesis_ref)edge(r.parent_hypothesis_ref,r.record_id);if(r.hypothesis_ref)edge(r.hypothesis_ref,r.record_id);if(r.experiment_ref)edge(r.experiment_ref,r.record_id);for(const ref of r.observation_refs??[])edge(r.schema_version==='are.research-experiment/v1'?r.record_id:ref,r.schema_version==='are.research-experiment/v1'?ref:r.record_id);for(const ref of r.provenance_refs??[])if(records.has(ref))edge(ref,r.record_id);}
edge(pin('experiment.json').record_id,pin('research.json').records.find(r=>r.schema_version==='are.research-experiment/v1').record_id);
const nodes=[...records.values()].map(r=>({id:r.record_id,kind:r.schema_version}));
writeFileSync(new URL('../research/dag-recovery-66-final.json',root),JSON.stringify({kind:'explicit-research-version-dag',registration_status:'not-registered',records:[...records.values()],sources,projection:{nodes,edges,dependency_layers:layers(nodes,edges)},authority_effect:'none',open_questions_ref:'../recovery-phase-v1/LIVE-DESIGN.md'},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({records:records.size,edges:edges.length}));
