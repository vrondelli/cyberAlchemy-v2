import {readFileSync,writeFileSync,mkdirSync,statfsSync} from 'node:fs';
import {join} from 'node:path';
import {chunkHistory,ingestionMessages,answerMessages} from './chunks.mjs';
import {createProvider,sha} from '../selectivity-v2/provider.mjs';
const dir=import.meta.dirname;
const rows=JSON.parse(readFileSync(join(dir,'../longmemeval/inputs.json'))).filter(r=>r.split==='development');
if(rows.length!==4)throw Error('four development tasks required');
const disk=statfsSync(dir);if(disk.bavail*disk.bsize<2*1024**3)throw Error('disk floor');
const out=join(dir,'preflight-compact-notes');mkdirSync(out);
const provider=createProvider({directory:out}),tasks=[],calls=[];
for(const row of rows){
 const chunked=chunkHistory(row);tasks.push(chunked);
 for(const arm of ['control','treatment'])for(const [index,chunk] of chunked.chunks.entries()){
  const messages=ingestionMessages(chunk,arm),id=`t${tasks.length}-${arm}-c${index}`;
  const r=await provider.tokenize(id,messages);
  calls.push({id,task_id:row.task_id,arm,phase:'ingestion',chunk:index,input_tokens:r.usage.prompt_tokens,carried_notes_reservation:512,output_reserve:512,input_digest:sha(messages)});
  console.log(JSON.stringify({id,input_tokens:r.usage.prompt_tokens}));
 }
 const messages=answerMessages(row),r=await provider.tokenize(`t${tasks.length}-answer`,messages);
 calls.push({id:`t${tasks.length}-answer`,task_id:row.task_id,arm:'both',phase:'answer',input_tokens:r.usage.prompt_tokens,carried_notes_reservation:512,output_reserve:1024,input_digest:sha(messages)});
 writeFileSync(join(out,'progress.json'),JSON.stringify({tasks,calls},null,2)+'\n');
}
const context_ok=calls.every(c=>c.input_tokens+c.carried_notes_reservation<=7168);
const maximum_tokens=calls.reduce((sum,c)=>sum+(c.input_tokens+c.carried_notes_reservation+c.output_reserve)*(c.arm==='both'?4:2),0);
const generation_calls=calls.reduce((sum,c)=>sum+(c.arm==='both'?4:2),0);
const result={status:'completed',admitted:context_ok&&maximum_tokens<=204800,context_ok,maximum_tokens,budget:204800,generation_calls,answer_calls:16,tokenizer_calls:calls.length,model_generation_calls:0,tasks,calls,limitations:['Carried-note reservation is conservative planning headroom; actual full prompts must be tokenized before each dispatch.','No benchmark quality result or freeze admission is claimed.'],authority_effect:'none'};
writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({admitted:result.admitted,maximum_tokens,generation_calls,context_ok}));
