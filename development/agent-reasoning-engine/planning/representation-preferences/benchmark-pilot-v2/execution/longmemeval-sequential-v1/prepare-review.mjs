import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
const dir=import.meta.dirname,json=p=>JSON.parse(readFileSync(join(dir,p)));
const result=json('live/result.json');
if(!['completed','stopped'].includes(result.status))throw Error('run still active');
const gold=json('../longmemeval/gold.json'),sources=json('../longmemeval/inputs.json');
const items=[],mapping=[];
for(const a of result.answers){
 const g=gold.find(x=>x.task_id===a.task_id),s=sources.find(x=>x.task_id===a.task_id),review_id=randomUUID();
 items.push({review_id,question:s.question,question_type:g.question_type,abstention:g.abstention,gold:g.answer,response:a.output});
 mapping.push({review_id,call_id:a.id});
}
items.sort((a,b)=>a.review_id.localeCompare(b.review_id));
writeFileSync(join(dir,'blind-review-packet.json'),JSON.stringify({rubric_ref:'../longmemeval/native-rubric.py',instructions:'Apply the exact pinned native rubric. Evaluate each answer independently, blind to arm, usage, notes and source state. Return review_id, pass boolean, short reason and any ambiguity. This is a sequential subset adaptation, not an official leaderboard score.',items},null,2)+'\n',{flag:'wx'});
writeFileSync(join(dir,'blind-review-mapping.json'),JSON.stringify(mapping,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({run_status:result.status,answers_for_review:items.length,planned_answers:16}));
