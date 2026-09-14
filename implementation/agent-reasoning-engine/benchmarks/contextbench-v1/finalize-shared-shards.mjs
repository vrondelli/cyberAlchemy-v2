// Verify and join deterministic shard completion ledgers without rerunning cells.
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {verifyFreeze} from './verify-freeze.mjs';
import {expectedShardCells} from './shared-shards.mjs';

const [freezePath,outRoot,countRaw]=process.argv.slice(2);if(countRaw===undefined)throw Error('freeze output-root shard-count required');
const shard_count=Number(countRaw),{matrix}=verifyFreeze(freezePath),sequence=resolve(outRoot,'sequence'),allPrefix=[],allBranch=[],skipped=[],unavailable=[],localFailures=[];
for(let shard_index=0;shard_index<shard_count;shard_index++){
  const path=resolve(sequence,`shard-${String(shard_index).padStart(2,'0')}`,'completed.json');if(!existsSync(path))throw Error('shards.completion-missing:'+shard_index);
  const row=JSON.parse(readFileSync(path)),expected=expectedShardCells(matrix,{shard_index,shard_count});
  if(row.shard_index!==shard_index||row.shard_count!==shard_count||row.completed_or_retained!==true)throw Error('shards.completion-invalid:'+shard_index);
  if(JSON.stringify(row.scheduled_prefix_ids)!==JSON.stringify(expected.prefixes.map(x=>x.cell_id))||JSON.stringify(row.scheduled_branch_ids)!==JSON.stringify(expected.branches.map(x=>x.cell_id)))throw Error('shards.schedule-drift:'+shard_index);
  allPrefix.push(...row.scheduled_prefix_ids);allBranch.push(...row.scheduled_branch_ids);skipped.push(...row.skipped);unavailable.push(...row.unavailable_prefixes);localFailures.push(...row.local_failures);
}
if(new Set(allPrefix).size!==matrix.prefixes.length||new Set(allBranch).size!==matrix.branches.length||allPrefix.length!==matrix.prefixes.length||allBranch.length!==matrix.branches.length)throw Error('shards.union-invalid');
const exact=(name,value)=>{const path=resolve(sequence,name),bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('shards.output-drift:'+name);}else writeFileSync(path,bytes,{flag:'wx'});};
exact('skipped.json',{rows:skipped,authority_effect:'none'});exact('input-unavailable.json',{rows:unavailable,model_calls:0,tokenizer_calls:0,authority_effect:'none'});exact('local-failures.json',{schema_version:'are.contextbench-local-failure-ledger/v1',rows:localFailures,recorded_failures:localFailures.length,authority_effect:'none'});
const completion={scheduled_prefixes:matrix.prefixes.length,scheduled_branches:matrix.branches.length,completed_or_retained:true,shard_count,skipped_prefixes:unavailable.length,skipped_branches:skipped.length,local_branch_failures:localFailures.length,benchmark_cleared:false,authority_effect:'none'};exact('completed.json',completion);console.log(JSON.stringify(completion));
