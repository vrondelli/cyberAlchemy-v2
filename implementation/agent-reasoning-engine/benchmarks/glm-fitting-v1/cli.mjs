import { readFile, open } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createLiveQaAdapter, validateLiveManifest } from './live-adapter.mjs';
import { validateDataset, runDataset, sha256 } from './benchmark.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'../../../..');
try {
  const [command,output,split='train']=process.argv.slice(2);
  const dataset=JSON.parse(await readFile(resolve(here,'dataset.json'),'utf8'));
  if (command==='validate' && !output) {
    const {counts}=await validateDataset(root,dataset);
    console.log(JSON.stringify({ok:true,tasks:48,counts,claim:'Dataset structure and pinned source bytes only; no model evaluation.'}));
  } else if (command==='live' && output && process.argv.length===5) {
    const manifest=validateLiveManifest(JSON.parse(await readFile(resolve(output),'utf8')));
    await validateDataset(root,dataset);
    if (sha256(JSON.stringify(dataset))!==manifest.dataset_sha256) throw new Error('Live dataset digest mismatch');
    if (manifest.task_ids.some(id=>!dataset.tasks.some(t=>t.id===id && t.split==='train'))) throw new Error('Invalid training task selection');
    const file=await open(resolve(split),'wx',0o600);
    try {
      const adapter=createLiveQaAdapter({manifest,fixture_root:root});
      const result=await runDataset({root,dataset,config:manifest.config,task_ids:manifest.task_ids,adapter,onAttempt:async record=>{await file.write(JSON.stringify(record)+'\n');await file.sync();}});
      console.log(JSON.stringify({...result,attempts:undefined,artifact:resolve(split)}));
      process.exitCode=result.summary.failed>0?1:0;
    } finally {await file.close();}
  } else if (command==='smoke' && output && process.argv.length<=5) {
    const config={split,repeats:1,max_attempts:48,max_input_bytes:65536,context_limit_tokens:16384,recycle_at_tokens:5000,output_reserve_tokens:2048,token_margin:256,policy:'clear-v1',model:'scripted-abstainer-not-glm',adapter_kind:'offline-scripted'};
    // Exclusive creation avoids silently overwriting earlier evidence.
    const file=await open(output,'wx',0o600);
    try {
      const result=await runDataset({root,dataset,config,onAttempt:async record=>{await file.write(JSON.stringify(record)+'\n');await file.sync();},adapter:async()=>({text:'{"abstain":true,"reason":"not_in_provided_source"}',tool_events:[],usage:{model_calls:0,tokenizer_calls:0,input_tokens:null,output_tokens:null,cache_tokens:null,recycles:0},finish_reason:'scripted'})});
      console.log(JSON.stringify({...result,attempts:undefined,artifact:resolve(output)}));
    } finally {await file.close();}
  } else throw new Error('Usage: node cli.mjs validate | smoke <new-output.jsonl> [train|dev|heldout] | live <manifest.json> <new-output.jsonl>');
} catch(error) {console.error(process.argv[2]==='live'?'Live QA failed; inspect the private attempt artifact and manifest.':error.message);process.exitCode=1;}
