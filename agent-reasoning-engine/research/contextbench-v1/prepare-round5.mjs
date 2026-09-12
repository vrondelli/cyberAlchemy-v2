// Materialize the selected H9 component review and six-cell development matrix.
// Open questions: PLAN-round5.md. No provider requests.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
const root=resolve('agent-reasoning-engine/research/contextbench-v1'),path=n=>resolve(root,n),read=n=>JSON.parse(readFileSync(path(n)));
const write=(name,value)=>{const target=path(name),bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round5.artifact-drift:'+name);return;}writeFileSync(target,bytes,{flag:'wx'});};
const fileSha=p=>sha(readFileSync(p));
export function prepare(){
  const log='/tmp/are-r5-terminal-tests.log',text=readFileSync(log,'utf8');if(!text.includes('ℹ tests 125')||!text.includes('ℹ pass 125')||!text.includes('ℹ fail 0'))throw Error('round5.tests');
  const persisted=path('terminal-submission-tests-v1.log');if(!existsSync(persisted))writeFileSync(persisted,readFileSync(log),{flag:'wx'});else if(fileSha(persisted)!==fileSha(log))throw Error('round5.test-log-drift');
  const sources=['implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode.mjs','implementation/agent-reasoning-engine/benchmarks/contextbench-v1/final-selection.mjs','implementation/agent-reasoning-engine/benchmarks/contextbench-v1/episode-terminal-submission.test.mjs',persisted];
  const review={schema_version:'are.contextbench-terminal-submission-review/v1',status:'offline-integration-passed',authority_effect:'none',hypothesis_ref:read('hypotheses-round5.json').selection.selected,
    verification:{tests:125,passed:125,failed:0,provider_model_calls:0,targeted_tests:7},sources:sources.map(p=>({path:p,sha256:fileSha(p)})),
    findings:['A valid schema-bound submission is accepted as the successful terminal model response without another model acknowledgement.','The terminal action never reaches the repository executor. Mixed terminal and mutation calls are rejected with zero mutation effects.','Free-form output receives one structured correction; invalid current-source provenance can still trigger base evidence retrieval during exploration.','Finalization exposes only submit_context_selection; repository tools remain unavailable.','Default free-form behavior and cumulative token denial remain unchanged.'],
    claim_ceiling:'Offline scripted-model instrument behavior and native export only; no live completion gain, semantic retention, repair correctness, transfer or benchmark claim.',continuity_ref:'round5-continuity.json',open_questions_ref:'PLAN-round5.md#open-questions'};
  write('terminal-submission-component-review-v1.json',review);
  const prior=read('development-matrix-v4.json'),failures=[
    {instance_id:'Multi-SWE-Bench__go__maintenance__bugfix__6e022940',arm:'baseline',source_cell_ref:'r4-03-baseline-8k'},
    {instance_id:'SWE-Bench-Verified__python__maintenance__bugfix__8cceb60d',arm:'baseline',source_cell_ref:'r4-06-baseline-8k'},
    {instance_id:'SWE-PolyBench__typescript__maintenance__bugfix__18d389e5',arm:'index',source_cell_ref:'r4-08-index-8k'}];
  const tasks=failures.map(f=>prior.tasks.find(t=>t.instance_id===f.instance_id));
  const cells=[];failures.forEach((f,i)=>{
    const source=prior.cells.find(c=>c.instance_id===f.instance_id&&c.arm===f.arm),order=i%2===0?['freeform','structured']:['structured','freeform'];
    for(const terminal_arm of order)cells.push({...source,cell_id:`r5-${String(i+1).padStart(2,'0')}-${terminal_arm}-8k`,terminal_arm,source_cell_ref:f.source_cell_ref,limits:{...source.limits,terminal_submission:terminal_arm==='structured'}});
  });
  const matrix={schema_version:'are.contextbench-terminal-development-matrix/v1',status:'prepared-not-frozen',authority_effect:'none',round:'contextbench-development-round5',
    selection:'Outcome-selected exposed development diagnostic: exactly the three invalid terminal cells from frozen round four. No reserved confirmation identity is used.',tasks,cells,
    maximum_model_calls:cells.reduce((n,c)=>n+c.limits.maximum_calls,0),maximum_total_model_tokens:cells.reduce((n,c)=>n+c.limits.total_tokens,0),
    acceptance_sha256:fileSha(path('acceptance.json')),predecessor_closeout_ref:'round4-closeout.json',protocol_ref:'PLAN-round5.md',continuity_ref:'round5-continuity.json',
    treatment:'Only limits.terminal_submission differs within each pair; original evidence arm, tools, source, context, cumulative model-token cap, deferral, correction, finalization, provider and scorer remain matched.',
    stopping_rules:['No within-round changes, replacements or source refresh.','Pause unstarted cells on shared provider or instrument failure; retain every attempted outcome.','Terminal submission performs no repository effect and receives no free acknowledgement.','No acceptance or selection changes from observed outcomes.'],
    success_criteria:{structured_valid_completions_minimum:2,structured_minus_freeform_valid_completions_minimum:1,false_source_credit:0,terminal_repository_effects:0,unknown_model_usage:0,per_cell_total_model_token_cap:96000},
    claim_ceiling:'Three-task exposed terminal-shape development diagnostic at 8K only; no H1, retention, correctness, confirmation or clearance claim.',open_questions_ref:'PLAN-round5.md#open-questions'};
  write('development-matrix-v5.json',matrix);
  return {tests:125,cells:cells.length,tasks:tasks.length,maximum_model_calls:matrix.maximum_model_calls,maximum_total_model_tokens:matrix.maximum_total_model_tokens};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(prepare()));
