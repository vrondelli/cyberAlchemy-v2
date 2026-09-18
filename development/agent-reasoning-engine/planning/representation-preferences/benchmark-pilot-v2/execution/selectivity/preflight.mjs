import {mkdirSync,writeFileSync,existsSync,statfsSync} from 'node:fs';
import {join} from 'node:path';
import {prepareTasks} from './adapter.mjs';
import {createProvider,sha,MODEL} from '../shared/provider.mjs';
import {buildSchedule,admitSchedule} from '../shared/schedule.mjs';
const directory=join(import.meta.dirname,'preflight');
if(existsSync(directory)) throw Error('preflight already exists; inspect receipts before any successor');
const disk=statfsSync(import.meta.dirname);if(disk.bavail*disk.bsize<2*1024**3)throw Error('disk floor');
mkdirSync(directory);
const tasks=await prepareTasks();
const schedule=buildSchedule(tasks);
writeFileSync(join(directory,'tasks.json'),JSON.stringify(tasks,null,2)+'\n',{flag:'wx'});
writeFileSync(join(directory,'schedule.json'),JSON.stringify(schedule,null,2)+'\n',{flag:'wx'});
const provider=createProvider({directory}),counts={},receipts=[];
for(const row of schedule) {
 if(counts[row.input_digest]!==undefined)continue;
 const receipt=await provider.tokenize('input-'+row.input_digest.slice(0,16),row.messages);
 counts[row.input_digest]=receipt.usage.prompt_tokens;
 receipts.push({id:receipt.id,input_digest:row.input_digest,request_sha256:receipt.request_sha256,input_tokens:receipt.usage.prompt_tokens});
 writeFileSync(join(directory,'progress.json'),JSON.stringify({counts,receipts},null,2)+'\n');
 console.log(JSON.stringify(receipts.at(-1)));
}
const admission=admitSchedule(schedule,counts);
const result={status:'completed',model:MODEL,model_generation_calls:0,tokenizer_calls:receipts.length,schedule_sha256:sha(schedule),admission,counts,receipts,authority_effect:'none'};
writeFileSync(join(directory,'result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(admission));
