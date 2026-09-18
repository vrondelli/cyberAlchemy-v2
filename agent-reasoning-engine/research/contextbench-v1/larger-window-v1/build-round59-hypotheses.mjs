import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve('agent-reasoning-engine/research/contextbench-v1/larger-window-v1');
const base=JSON.parse(readFileSync(resolve(root,'hypotheses.json')));
const continuity=base.continuity;
const metrics=base.records[0].metrics;
const provenance_refs=['agent-reasoning-engine/research/contextbench-v1/larger-window-v1/continuity-binding.json','agent-reasoning-engine/research/contextbench-v1/larger-window-v1/round58-reviewed-decision.json'];
const record=(record_id,role,statement,mechanism,falsifier)=>({record_id,statement,mechanism,falsifier,scope:'GLM-5.3-flash ContextBench transfer from confirmed 8K to 10K; conditional development only.',metrics,provenance_refs,experiment_template:'One frozen eight-identity 10K paired development cohort; activate terminal handles only when the prefix yields three receipt-bound handles.',continuity_contract:continuity,role});
const records=[
  record('LW-H3a','selected','A three-handle prefix-only gate gains at least 0.05 macro Span-F1 with non-degrading secondary metrics and non-increasing aggregate tokens.','The full three-handle set identifies prefixes where compact evidence substitution is useful; lower-count prefixes retain the control review.','A causally valid frozen conditional cohort misses any semantic or aggregate-token gate.'),
  record('LW-H2','alternative','The larger native window dilutes the quality benefit even after handle-count conditioning.','Ten thousand native tokens retain enough evidence that compact terminal handles add little value.','The conditional policy passes every frozen development gate.'),
  record('LW-H3b','alternative','Handle count is only a proxy; another prefix-observable displacement signal is required.','Evidence usefulness depends on displacement or task structure not captured by the number of available handles.','The three-handle conditional policy passes and later confirms.'),
  record('LW-H0','null','No qualifying conditional quality gain exists within the token constraint.','The confirmed 8K mechanism does not transfer usefully to 10K.','The conditional policy passes development and fresh confirmation.')
];
const artifact={schema_version:'are.contextbench-larger-window-hypotheses/v1',status:'registered-round59-successor-hypotheses',question:'Does prefix-only three-handle activation recover a reusable 10K quality gain while retaining H72 token savings?',selected:'LW-H3a',hypotheses:records.map(({record_id:id,role,mechanism,statement:prediction,falsifier,scope})=>({id,role,mechanism,prediction,falsifier,scope})),continuity,predecessor_refs:['round58-reviewed-decision.json'],authority_effect:'none',open_questions_ref:'round58-reviewed-decision.json#open_questions',records,selection:{selected:'LW-H3a',alternatives:['LW-H2','LW-H3b','LW-H0'],reason:'Round 56 and Round 58 exploratory strata both associated three-handle prefixes with positive gains; this round tests that post-hoc observation prospectively.'}};
const path=resolve(root,'round59-hypotheses.json'),bytes=JSON.stringify(artifact,null,2)+'\n';
if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round59.hypotheses-drift');}else writeFileSync(path,bytes,{flag:'wx'});
console.log(JSON.stringify({status:artifact.status,selected:artifact.selected,records:records.length,model_calls:0}));
