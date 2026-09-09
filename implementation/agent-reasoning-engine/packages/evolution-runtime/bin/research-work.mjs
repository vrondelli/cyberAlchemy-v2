import {readFileSync} from "node:fs";
import {join} from "node:path";
import {BENCHMARK_RECORD_DIRECTORY} from "../src/benchmark-registration.mjs";
import {materializeResearchDag} from "../src/research-dag.mjs";
import {materializeResearchPlan,replayResearchWork} from "../src/research-work.mjs";
const input=JSON.parse(readFileSync(new URL('../plans/requirement-research-v1.json',import.meta.url),'utf8'));
const registrations=input.registration_digests.map(id=>{
  if(!/^[a-f0-9]{64}$/.test(id))throw Error('research-work.invalid-registration-selector');
  const record=JSON.parse(readFileSync(join(BENCHMARK_RECORD_DIRECTORY,id+'.json'),'utf8'));
  if(record.registration_digest!==id)throw Error('research-work.registration-selector-mismatch');
  return record;
});
const dag=materializeResearchDag({registrations});
if(dag.dag_digest!==input.research_dag_digest)throw Error('research-work.selected-source-drift');
const plan=materializeResearchPlan({research_dag:dag,registrations,tasks:input.tasks});
console.log(JSON.stringify({plan,state:replayResearchWork({plan,registrations})},null,2));
