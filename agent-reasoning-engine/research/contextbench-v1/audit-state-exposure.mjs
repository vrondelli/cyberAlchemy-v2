// Verify model-facing state exposure from immutable request receipts. No model
// calls or repository effects. A recycle without a dispatched state prompt is
// not an exposure opportunity.
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {basename,join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {bodyForReceipt,stable} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';

const marker='POST-RECYCLE OBSERVED TASK STATE';
const digest=value=>sha(Buffer.from(stable(value)));

export function auditStateExposure(liveRoot){
  const root=resolve(liveRoot);
  if(!existsSync(root))throw Error('state-exposure.live-root-missing');
  const rows=[];
  for(const cellId of readdirSync(root).filter(name=>/-state-rep\d+-\d+k$/.test(name)).sort()){
    const resultPath=join(root,cellId,'result.json');
    if(!existsSync(resultPath))continue;
    const result=JSON.parse(readFileSync(resultPath));
    const modelReceipts=result.receipts.filter(receipt=>receipt.kind==='model'&&receipt.dispatched);
    const dispatchedStateGenerations=[...new Set(modelReceipts.flatMap(receipt=>
      result.captures.filter(capture=>digest(bodyForReceipt(capture.prompt,receipt))===receipt.request_sha256&&capture.prompt.includes(marker))
        .map(capture=>capture.generation)))].sort((a,b)=>a-b);
    const presentedGenerations=[...new Set((result.task_state_presentations??[]).map(item=>item.generation))].sort((a,b)=>a-b);
    const missing=dispatchedStateGenerations.filter(generation=>!presentedGenerations.includes(generation));
    const unexpected=presentedGenerations.filter(generation=>!dispatchedStateGenerations.includes(generation));
    rows.push({cell_id:cellId,result_sha256:sha(readFileSync(resultPath)),recycles:result.recycling?.recycles??null,
      dispatched_state_generations:dispatchedStateGenerations,presented_generations:presentedGenerations,
      missing_dispatch_exposures:missing,unexpected_presentations:unexpected,exact:missing.length===0&&unexpected.length===0});
  }
  return {schema_version:'are.contextbench-state-exposure-audit/v1',live_root:root,cells:rows.length,
    raw_recycles:rows.reduce((sum,row)=>sum+(row.recycles??0),0),
    dispatched_state_generations:rows.reduce((sum,row)=>sum+row.dispatched_state_generations.length,0),
    presentations:rows.reduce((sum,row)=>sum+row.presented_generations.length,0),
    missing_dispatch_exposures:rows.reduce((sum,row)=>sum+row.missing_dispatch_exposures.length,0),
    unexpected_presentations:rows.reduce((sum,row)=>sum+row.unexpected_presentations.length,0),
    all_exact:rows.every(row=>row.exact),rows,authority_effect:'none',
    open_questions:['Should future result schemas expose projection-eligible and dispatched-state generation counts directly?']};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  if(!process.argv[2])throw Error('live-root required');
  console.log(JSON.stringify(auditStateExposure(process.argv[2]),null,2));
}
