import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve('agent-reasoning-engine/research/contextbench-v1');
const round=Number(process.argv[2]??53);
const taskRoot=resolve(`implementation/agent-reasoning-engine/benchmarks/contextbench-v1/confirmation-tasks-round${round}`);
const read=path=>JSON.parse(readFileSync(path));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const write=(name,value)=>writeFileSync(resolve(root,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});

const development=read(resolve(root,'round52-matrix.json'));
const outcome=read(resolve(root,'round52-outcome.json'));
const selection=read(resolve(root,`round${round}-task-selection.json`));
const inventory=read(resolve(root,`round${round}-repository-inventory.json`));
const manifest=read(resolve(taskRoot,'manifest.json'));
if(outcome.status!=='complete-accounted-canary-passed'||selection.status!=='selected-untouched-scoreable-independent-confirmation'||inventory.status!=='ready')throw Error('round53.predecessor');
if(manifest.tasks.length!==8||selection.tasks.length!==8||inventory.repositories.length!==8)throw Error('round53.shape');

const plan={
  schema_version:'are.contextbench-confirmation-plan/v1',round,status:'registered-independent-confirmation',
  enduring_objective:'Improve reusable ARE reasoning, useful continuity, recovery, correctness and completed outcomes within cumulative model input plus output tokens.',
  initial_objective:'Finish GLM-5.3-flash qualification, beginning with small context windows and useful reasoning-state recovery under pressure.',
  current_milestone:'Confirm the successful Round 52 8K mechanism on untouched identities before clearing the small-window ContextBench chapter.',
  research_method:'objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor',
  gap:round>=55?'Round 54 exposed a nonterminal output-pressure prefix that cannot test terminal handles. It must remain a symmetric zero while later independent tasks continue. Round 52 may still reflect cohort variance.':round===54?'Round 53 exposed an instrument gap: a fully known zero-model tokenizer failure stopped the cohort instead of becoming a symmetric fixed zero. Round 52 may still reflect cohort variance.':'Round 52 is a successful development canary but may reflect cohort variance.',
  question:'Does H72 replicate on an untouched, independently selected eight-task GLM-5.3-flash 8K cohort under the identical frozen treatment and thresholds?',
  hypotheses:[
    {ref:development.hypothesis_ref,role:'selected',statement:'Request-local terminal evidence handles improve context selection per token and replicate outside the development cohort.'},
    {ref:'CB117-H0-R53',role:'alternative',statement:'The Round 52 gain is cohort variance and will not replicate under the same gates.'}
  ],
  predecessor_refs:round>=55?['round52-outcome.json','round53-interrupted-outcome.json','round54-interrupted-outcome.json']:round===54?['round52-outcome.json','round53-interrupted-outcome.json']:['round52-outcome.json','freeze-round52-execution.json'],
  selection_ref:`round${round}-task-selection.json`,
  success_criteria:development.success_criteria,
  decision_rule:'Clear the GLM 8K ContextBench benchmark only if the independent confirmation passes every frozen instrument, semantic, and token gate. Otherwise retain Round 52 as development evidence and select a successor hypothesis from the confirmation observations.',
  claim_ceiling:'Independent 8K confirmation; a pass clears only the GLM-5.3-flash 8K ContextBench context-selection milestone.',
  authority_effect:'none',open_questions:['Will H72 replicate?', 'Does the treatment remain token-nondegrading on unseen repositories?']
};
write(`round${round}-confirmation-plan.json`,plan);

const template=structuredClone(development.prefixes[0]);
const tasks=selection.tasks.map((row,index)=>{
  const item=manifest.tasks.find(x=>x.instance_id===row.instance_id),path=resolve(taskRoot,item.file),task=read(path);
  if(sha(path)!==item.sha256||item.sha256!==row.task_sha256)throw Error('round53.task-sha:'+row.instance_id);
  return {instance_id:task.instance_id,original_inst_id:task.original_inst_id,repo:task.repo,repo_url:task.repo_url,base_commit:task.base_commit,source:task.source,language:task.language,locked_order:index+1};
});
const prefixes=[],branches=[];
for(const [index,task] of tasks.entries()){
  const n=String(index+1).padStart(2,'0');
  const common={...template,...task,cell_id:undefined,prefix_cell_id:undefined,repetition:1};
  delete common.cell_id;delete common.prefix_cell_id;
  const prefixId=`r${round}-${n}-terminal-prefix-8k`;
  prefixes.push({...common,cell_id:prefixId,cell_kind:'shared-prefix',state_arm:'prefix',repetition:0});
  const control={...common,cell_id:`r${round}-${n}-control-review-rep1-8k`,cell_kind:'branch',prefix_cell_id:prefixId,state_arm:'control',order_in_pair:index%2===0?1:2};
  const state={...common,cell_id:`r${round}-${n}-terminal-handles-rep1-8k`,cell_kind:'branch',prefix_cell_id:prefixId,state_arm:'state',order_in_pair:index%2===0?2:1,limits:{...common.limits,decision_state:true,decision_state_substitution:true,decision_state_handles:true}};
  branches.push(...(index%2===0?[control,state]:[state,control]));
}
const matrix={...development,
  schema_version:'are.contextbench-confirmation-matrix/v1',round:`contextbench-confirmation-round${round}`,evaluation_stage:'confirmation',
  tasks,prefixes,branches,cells:[...prefixes,...branches],task_manifest_ref:resolve(taskRoot,'manifest.json'),
  selection:'Eight untouched scoreable public identities from distinct repositories, selected only after Round 52 passed and without outcome-aware task choice.',
  protocol_ref:`round${round}-confirmation-plan.json`,continuity_ref:`round${round}-confirmation-plan.json`,
  claim_ceiling:plan.claim_ceiling,authority_effect:'none',open_questions_ref:`round${round}-confirmation-plan.json#open_questions`};
write(`round${round}-confirmation-matrix.json`,matrix);
console.log(JSON.stringify({status:'confirmation-matrix-ready',tasks:8,prefixes:8,branches:16,cells:24,hypothesis_ref:matrix.hypothesis_ref}));
