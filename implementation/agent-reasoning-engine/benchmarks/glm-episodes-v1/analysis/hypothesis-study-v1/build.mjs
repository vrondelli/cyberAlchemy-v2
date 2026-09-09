import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createResearchHypothesis, verifyEvolutionRecord} from '../../../../packages/evolution-runtime/index.mjs';
const root = new URL('../../../../', import.meta.url);
const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const sha = x => createHash('sha256').update(x).digest('hex');
const check = (ok, why) => {if (!ok) throw Error(why);};
export function layers(nodes, edges) {
  const ids = new Set(nodes.map(n => n.id));
  check(ids.size === nodes.length, 'duplicate node');
  const pending = new Map(nodes.map(n => [n.id, new Set()]));
  const unique = new Set();
  for (const e of edges) {
    check(ids.has(e.from) && ids.has(e.to), 'unresolved edge');
    check(!unique.has(JSON.stringify([e.from,e.to])), 'duplicate edge');
    unique.add(JSON.stringify([e.from,e.to])); pending.get(e.to).add(e.from);
  }
  const result=[];
  while(pending.size) {
    const ready=[...pending].filter(([,deps]) => deps.size===0).map(([id])=>id).sort();
    check(ready.length, 'cycle'); result.push(ready);
    for(const id of ready) pending.delete(id);
    for(const deps of pending.values()) for(const id of ready) deps.delete(id);
  }
  return result;
}
export function build() {
  const sourceText=read('sources.json'), definitionText=read('hypotheses.json');
  const sources=JSON.parse(sourceText), definitions=JSON.parse(definitionText);
  for(const s of sources.local) check(sha(readFileSync(new URL(s.path,root)))===s.sha256,'source drift: '+s.path);
  check(definitions.length===7 && new Set(definitions.map(h=>h.id)).size===7,'seven unique alternatives required');
  const records=definitions.map(h=>{
    for(const key of ['id','title','statement','mechanism','falsifier','baseline','treatment','prediction']) check(typeof h[key]==='string'&&h[key].trim(),'missing '+key);
    for(const key of ['evidence','counterevidence','controls','metrics','open_questions']) check(Array.isArray(h[key])&&h[key].length&&h[key].every(x=>typeof x==='string'&&x.trim()),'missing '+key);
    const record=createResearchHypothesis({hypothesis_key:h.id,statement:h.statement,mechanism:h.mechanism,falsifier:h.falsifier,
      scope:'GLM small-window behavior; prospective untested explanation. No causal conclusion or activation.',metrics:h.metrics,
      provenance_refs:sources.local.map(s=>s.path+'#sha256='+s.sha256),
      experiment_template:{research_question:h.statement,baseline_ref:'unbound-design:'+h.id+':baseline',treatment_ref:'unbound-design:'+h.id+':treatment',
        dataset_refs:['unbound-design:'+h.id+':frozen-fixtures'],required_repetitions:3,
        success_criteria:{prediction:h.prediction,baseline:h.baseline,treatment:h.treatment,controls:h.controls,
          sample_size_status:'unbound; three repetitions is a design minimum, not a powered sample size',
          exact_candidate_and_fixture_binding_required:true,thresholds_and_analysis_plan_required:true,held_out_evaluation_required:h.kind!=='audit'},
        stop_conditions:['Stop on source or fixture drift; retain receipts.','No live execution until exact candidate, fixtures, sample size, thresholds and physical-call cap are bound.','Never expand the declared attempt cap to replace failures.']}});
    check(verifyEvolutionRecord(record,'are.research-hypothesis/v1').ok,'invalid hypothesis');return record;
  });
  const nodes=[{id:'evidence',kind:'completed-analysis',status:'available'},...records.map((r,i)=>({id:definitions[i].id,record_ref:r.record_id,kind:'untested-hypothesis',status:'candidate'})),
    {id:'audit',kind:'offline-audit-task',status:'planned',owner:'ARE evaluator'},
    ...definitions.filter(h=>h.kind==='model').map(h=>({id:'design-'+h.id,kind:'experiment-design-task',status:'unbound',owner:'ARE researcher'})),
    {id:'comparison',kind:'future-evidence-review',status:'not-run',owner:'ARE evaluator'}];
  const edges=definitions.map(h=>({from:'evidence',to:h.id}));edges.push({from:'H1',to:'audit'});
  for(const h of definitions.filter(h=>h.kind==='model')) edges.push({from:h.id,to:'design-'+h.id},{from:'audit',to:'design-'+h.id},{from:'design-'+h.id,to:'comparison'});
  return {schema_version:'are.glm-prospective-hypothesis-study/v1',authority_effect:'none',registration_status:'not-registered',
    ontology_ref:'packages/evolution-runtime/ontology/research-learning-v1.json',selected_definitions:['ARE-RL-D01','ARE-RL-D03','ARE-RL-D07','ARE-RL-D08'],
    input_hashes:{sources:sha(sourceText),definitions:sha(definitionText),builder:sha(read('build.mjs'))},records,definitions,
    projection:{kind:'prospective-dependency-projection',nodes,edges,dependency_layers:layers(nodes,edges)},
    observations:[],learning_decisions:[],next_task:'audit',open_questions_ref:'README.md#open-questions'};
}
export function verifySaved() {
  check(read('bundle.json')===JSON.stringify(build(),null,2)+'\n','saved bundle drift');
  return {ok:true,hypotheses:7,observations:0,authority_effect:'none'};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
  check(process.argv.length===3&&['--write','--check'].includes(process.argv[2]),'use --write or --check');
  if(process.argv[2]==='--write') writeFileSync(new URL('bundle.json',import.meta.url),JSON.stringify(build(),null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(verifySaved()));
}
