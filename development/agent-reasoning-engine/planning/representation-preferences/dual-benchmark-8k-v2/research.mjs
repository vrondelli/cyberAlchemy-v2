// Candidate D01/D03 records; never grants live dispatch. Open questions: PLAN.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createResearchHypothesis,createResearchExperiment,verifyEvolutionRecord,verifyResearchContinuity} from '../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../..'),prefix=relative(root,dir),old=prefix.replace(/v2$/,'v1');
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const bind=p=>({path:p,sha256:createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')});
const emit=(p,x)=>writeFileSync(resolve(dir,p),JSON.stringify(x,null,2)+'\n');
const prior=read(old+'/continuity.json'),policy=read(prior.policy_ref),contract=policy.required_hypothesis_continuity_values;
const specs=[
 {key:'C-discovery',benchmark:'contextbench',statement:'A task-derived ledger of unresolved evidence needs improves discovery of relevant source before terminal selection without adding unbounded exploration.',
 mechanism:'Identify bounded evidence needs from the public task and model plan, record tool outcomes deterministically, and revisit unresolved needs before repeated editing or finalization; no gold-derived obligations.',
 null_statement:'The additional plan or ledger consumes tokens without finding the missing relevant source, or confuses native context coverage with repair correctness.',
 baseline:'v1-compact-full-trajectory',treatment:'proposed-task-derived-evidence-needs-ledger',dataset:old+'/contextbench/config.json',repetitions:2},
 {key:'C-input',benchmark:'contextbench',statement:'Reducing repeated input or unnecessary earlier calls achieves the remaining full-task token reduction without losing native quality or completion.',
 mechanism:'Prospectively select one input-retention or earlier-stop policy after actual cost attribution; retain exact recoverable evidence and account for every recovery call.',
 null_statement:'Smaller requests buy more calls until the same token stop, or omitted information and earlier stopping degrade quality.',
 baseline:'v1-compact-full-trajectory',treatment:'proposed-earlier-input-or-stop-ablation-not-yet-selected',dataset:old+'/contextbench/config.json',repetitions:2},
 {key:'C-state',benchmark:'contextbench',statement:'Receipt-bound base-valid terminal handles reduce empty and invalid source selections after context recycling.',
 mechanism:'Recover candidates from confirmed archive receipts, exclude whole reads containing edited lines, and present an explicitly versioned terminal schema.',
 null_statement:'Candidates are irrelevant, too coarse, omitted or insufficient for accurate source selection despite valid provenance.',
 baseline:'v1-compact-full-trajectory',treatment:'v2-compact-plus-held-terminal-review',dataset:old+'/contextbench/config.json',repetitions:2},
 {key:'L-scope',benchmark:'longmemeval',statement:'A generic policy preserves the scope of applicable preferences already retained and improves recommendation correctness.',
 mechanism:'Change only the common answer policy, keeping exact evidence projection, question, model, output cap and context admission unchanged.',
 null_statement:'The remaining error is stochastic reasoning or missing evidence; scope guidance does not improve replicated correctness.',
 baseline:'v1-retrievalMessages',treatment:'v2-scopeMessages',dataset:old+'/longmemeval/manifest-measured.json',repetitions:1}
];
const records=[],experiments=[],branch_selections=[];
for(const s of specs){
 const template={research_question:s.statement,baseline_ref:s.baseline,treatment_ref:s.treatment,dataset_refs:[s.dataset],required_repetitions:s.repetitions,
  success_criteria:{stage:'candidate-protocol-not-live-freeze',mechanism:s.benchmark==='contextbench'?'all assigned selections completed and natively valid without source substitution':'every assigned answer completed and native-judge correct',
   maximum_request_input_plus_reserved_output:8000,complete_accounting:true,no_gold_in_generator:true,
   campaign_gate:{minimum_relative_token_reduction_each_benchmark:0.15,every_longmemeval_answer_correct:true,every_contextbench_metric_each_task:1,all_assigned_complete:true,untouched_confirmation_required:true},
   limits_notice:'Full trajectory cohort/call/cost freeze and independent review remain required. Policy-only or terminal-only diagnostics cannot pass campaign efficiency.'},
  stop_conditions:['No provider generation until exact immutable manifest and review gate pass','No automatic retry, replacement or dropped outcome','Unknown usage holds reservation and forbids success','Every actual request must be tokenized and admitted within 8000','Disk and provider capacity gates before dispatch']};
 const hs=[false,true].map(isNull=>createResearchHypothesis({hypothesis_key:'dual8k-v2-'+s.key+'-'+(isNull?'H0':'H1'),statement:isNull?s.null_statement:s.statement,
  mechanism:s.mechanism,falsifier:isNull?'Replicated quality improvement with native validity, all assigned outcomes and full cost accounted.':'No replicated improvement, incomplete or invalid output, quality loss, or uncontrolled costs.',
  scope:'GLM-5.3-flash8K (8000 exact) development study; preserve ContextBench acceptance and original small-window objective. Diagnostic findings do not prove full-benchmark perfection.',
  metrics:['cumulative-model-input-plus-output','native-quality','completion','confirmed-delivered-evidence','unknown-usage'],
  provenance_refs:[prefix+'/continuity.json',prefix+'/PLAN.md',old+'/AMENDED-RESULTS.json'],continuity_contract:contract,experiment_template:template}));
 records.push(...hs);branch_selections.push({benchmark:s.benchmark,selected:hs[0].record_id,null:hs[1].record_id});
 experiments.push(createResearchExperiment({...template,hypothesis_ref:hs[0].record_id,metrics:hs[0].metrics}));
}
const hypotheses={records,selection:{selected:records[0].record_id,alternatives:records.slice(1).map(x=>x.record_id)},branch_selections,authority_effect:'none'};
emit('hypotheses.json',hypotheses);emit('experiments.json',{status:'planned-not-dispatchable',records:experiments,authority_effect:'none'});
const tasks=[['A',[],'Verify fixed objectives and predecessor'],['B',['A'],'Register competing hypotheses and continuity'],['S',['A'],'Repair group admission, storage and usage guards'],['C',['B'],'Receipt-bound terminal evidence candidate'],['L',['B'],'Generic preference-scope policy ablation'],['LF',['S','L'],'Review and freeze independent LongMemEval diagnostic'],['LT',['LF'],'Execute four paired LongMemEval tasks at two workers'],['LJ',['LT'],'Blind native judging and complete diagnostic accounting'],['LD',['LJ'],'Review LongMemEval diagnostic successor'],['R',['C'],'Replay real archived failures'],['I',['R'],'Integrate terminal boundary and independent export'],['U',['R'],'Audit archive-coverage and token-saving ceilings'],['E',['U'],'Select and implement one bounded discovery/input ablation'],['F',['S','I','L','E'],'Review actual request admission, scope and budgets'],['P',['F'],'Freeze exact canary manifest and source hashes'],['T',['P'],'Execute at two workers per benchmark'],['J',['T'],'Score all outcomes and costs'],['D',['J'],'Reviewed decision and successor'],['H',['D'],'Untouched long-task confirmation if justified']];
emit('implementation-dag.json',{tasks:tasks.map(([id,depends_on,title])=>({id,depends_on,title})),authority_effect:'none',open_questions_ref:'PLAN.md'});
const binding={...prior,binding_ref:prefix+'/continuity.json',objective_contribution:'Close remaining completion, source-validity and preference-scope failures while preserving 8K admission, separate >=15% full-task savings and the active perfect-score goal.',
 predecessor_refs:[bind(old+'/AMENDED-RESULTS.json'),bind(old+'/AMENDED-FINAL-REVIEW.json'),bind(old+'/contextbench/FAILURE-ANALYSIS.json'),bind(old+'/contextbench/STAGE2-OUTPUT-FAILURE.json'),bind(prefix+'/contextbench/TOKEN-ANALYSIS.json'),bind(prefix+'/contextbench/REPLAY.json'),bind(prefix+'/contextbench/REPRESENTATION-CEILING.json')],
 question_and_hypotheses:{question:'Can reusable evidence retention and preference-scope improvements close the observed gaps without abandoning token efficiency?',records_ref:prefix+'/hypotheses.json',...hypotheses.selection},
 experiment_and_task_refs:{plan_ref:prefix+'/PLAN.md',tasks:tasks.map(t=>t[0]),unresolved:'Offline terminal episode integration and ceiling audits completed. Discovery/input ablation choice and implementation, actual full-prompt admission, exact cohort/call/token freeze and independent live review remain pending.'},
 measurement_mapping:{...prior.measurement_mapping,native:'LongMemEval native judge correctness and ContextBench per-task span/file quality stay distinct; judge yes is not independent truth proof.',
 tokens:'Count cumulative model input plus output, reasoning, failures, ingestion and judging; diagnostic calls counted as research costs but not falsely treated as complete-task efficiency.',
 transfer:'Exposed four-task pilot and one >8K LongMemEval source do not establish full benchmark perfection; confirm on untouched long tasks.'},
 acceptance_and_scope:{...prior.acceptance_and_scope,pilot_protocol:prefix+'/PLAN.md'},
 retained_counterevidence:[...prior.retained_counterevidence,'V1 amended LongMemEval 7/8 correct with68.28% savings; ContextBench4/8 valid with9.41% savings. Neither proves campaign goal.',
 'Compact per-request representation can buy extra calls until the same token stop.','Preference failure retained all user turns; more history alone is not a supported remedy.','Wider handles do not prove sufficient archive coverage; representation ceiling audit isolates discovery from terminal selection.', 'Receipt diagnosis: treatment inputs544208 of567202 tokens; additional35001 needed, exceeding all last-call tokens28811. Terminal-only changes cannot meet the fixed15% goal on these trajectories.'],
 successor_rule:'Keep every failure and fixed score denominator. Diagnostic success admits a reviewed next experiment, never full-benchmark clearance. Preserve >=15% each benchmark and per-task perfect native quality; use untouched confirmation.',
 continuity_review:{reviewer:'coordinator continuity audit; independent implementation review in REVIEW.md',reviewed_artifacts:[bind(prefix+'/PLAN.md'),bind(prefix+'/hypotheses.json')],
 criterion_verdicts:Object.fromEntries(policy.required_review_criteria.map(k=>[k,'Canonical objective hierarchy/method preserved; predecessor counterevidence retained. Candidate only; integration and frozen live limits remain unresolved.'])),passed_for_candidate_plan:true,run_ready:false},authority_effect:'none'};
emit('continuity.json',binding);
const validation=verifyResearchContinuity({binding,policy,hypotheses,phase:'final',root});emit('continuity-validation.json',validation);assert.ok(validation.ok,JSON.stringify(validation.reason_codes));
assert.ok([...records,...experiments].every(r=>verifyEvolutionRecord(r).ok));
console.log(JSON.stringify({hypotheses:records.length,experiments:experiments.length,continuity:validation.ok,live_ready:false}));
