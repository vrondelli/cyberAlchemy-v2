// Run the remaining frozen G02 source-only pairs. Pair failures are retained, never substituted.
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const planPath=process.argv[2]??'/opt/are/evolution-runtime/g02-product-replication-execution-r1.json';
const cohortPath='/opt/are/evolution-runtime/g02-product-replication-cohort-r1.json';
const node='/opt/cyberalchemy-are-tools/node-24.10.0/node';
const output=process.argv[3]??'/opt/are/evolution-runtime/g02-product-replication-driver-r1.json';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const plan=JSON.parse(readFileSync(planPath));
const tools=plan.tools_root;
const startIndex=Number(process.argv[4]??1);
if(plan.schema_version!=='are.g02-product-replication-execution/v1'||
  sha(readFileSync(cohortPath))!==plan.cohort_sha256||plan.ordered_pairs?.length!==24||
  !/^\/opt\/are\/evolution-runtime\/g02-product-replication-tools-r[12]$/.test(tools)||
  ![0,1].includes(startIndex)||
  sha(readFileSync(join(tools,'prepare-prospective.mjs')))!==plan.tool_bindings.prepare_prospective_sha256||
  sha(readFileSync(join(tools,'run-and-score-pair.mjs')))!==plan.tool_bindings.run_and_score_pair_sha256||
  existsSync(output)) throw Error('g02-product-replication.driver-binding-or-output');
const first=plan.ordered_pairs[0];
const repairRoot='/opt/are-benchmark-runs/g02-cross-layer-pr1fix-qut-7479b23c';
if(startIndex===1){
  const repaired=JSON.parse(readFileSync(join(repairRoot,'PAIR-DECISION.json')));
  if(repaired.instance_id!==first.instance_id||repaired.strict_four_gate_decision!=='pass')
    throw Error('g02-product-replication.first-task-repair-not-valid');
}
const ordered=plan.ordered_pairs.slice(startIndex);
const outcomes=[];
let cursor=0;
async function worker(){
  while(cursor<ordered.length){
    const pair=ordered[cursor++];
    const env={...process.env,...plan.env_policy,G02_TOOLS_ROOT:tools,G02_REPO:pair.repo,
      G02_INSTANCE:pair.instance_id,G02_PAIR_SUFFIX:pair.suffix};
    const started=new Date().toISOString();
    const status=await new Promise(resolve=>{
      const child=spawn(node,[join(tools,'run-and-score-pair.mjs'),pair.suffix,pair.instance_id],
        {env,stdio:['ignore','pipe','pipe']});
      let stdout='',stderr='';
      child.stdout.on('data',chunk=>{stdout+=chunk; if(stdout.length>16384)stdout=stdout.slice(-16384);});
      child.stderr.on('data',chunk=>{stderr+=chunk; if(stderr.length>16384)stderr=stderr.slice(-16384);});
      child.on('error',error=>resolve({exit_code:null,error:String(error),stdout,stderr}));
      child.on('exit',code=>resolve({exit_code:code,stdout,stderr}));
    });
    const decisionPath=join(pair.root,'PAIR-DECISION.json');
    const decision=existsSync(decisionPath)?JSON.parse(readFileSync(decisionPath)):null;
    const outcome={instance_id:pair.instance_id,repo:pair.repo,suffix:pair.suffix,started_at:started,
      ended_at:new Date().toISOString(),...status,decision:decision?.strict_four_gate_decision??null,
      decision_sha256:decision?sha(readFileSync(decisionPath)):null};
    outcomes.push(outcome);
    console.log(JSON.stringify({index:outcomes.length+1,instance_id:pair.instance_id,exit_code:status.exit_code,
      decision:outcome.decision}));
  }
}
await Promise.all([worker(),worker()]);
const receipt={schema_version:'are.g02-product-replication-driver/v1',status:'completed-dispatch',
  plan_sha256:sha(readFileSync(planPath)),cohort_sha256:sha(readFileSync(cohortPath)),
  first_task:startIndex===1?{instance_id:first.instance_id,original_root:first.root,original_decision:'unscored-invalid-arm',
    repair_root:repairRoot,repair_decision_sha256:sha(readFileSync(join(repairRoot,'PAIR-DECISION.json'))),
    reason:'new cache paths absent from ARE container git safe.directory; fixed before repair dispatch'}:null,
  remaining_outcomes:outcomes,claim_ceiling:'Execution receipt only; independent eligibility and score audit required'};
writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:receipt.status,decisions:outcomes.reduce((a,v)=>(a[v.decision??'missing']=(a[v.decision??'missing']??0)+1,a),{})}));
