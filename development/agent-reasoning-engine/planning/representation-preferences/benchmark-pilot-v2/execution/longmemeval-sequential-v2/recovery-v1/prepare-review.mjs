import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
const dir=import.meta.dirname,json=p=>JSON.parse(readFileSync(join(dir,p)));
const result=json('live/result.json');if(result.status!=='completed'||result.completed_answers!==16)throw Error('not complete');
const prior=json('../blind-review-mapping.json'),done=new Set(prior.map(x=>x.call_id));
const gold=json('../../longmemeval/gold.json'),sources=json('../../longmemeval/inputs.json');
const items=[],mapping=[];
for(const answer of result.answers){if(done.has(answer.id))continue;
 const review_id=randomUUID(),g=gold.find(x=>x.task_id===answer.task_id),s=sources.find(x=>x.task_id===answer.task_id);
 items.push({review_id,question:s.question,question_type:g.question_type,abstention:g.abstention,gold:g.answer,response:answer.output});mapping.push({review_id,call_id:answer.id});
}
if(items.length!==9)throw Error('unexpected review remainder');
items.sort((a,b)=>a.review_id.localeCompare(b.review_id));
writeFileSync(join(dir,'blind-review-packet.json'),JSON.stringify({rubric_ref:'../../longmemeval/native-rubric.py',instructions:'Apply the exact native rubric independently to each answer. Return review_id, pass boolean, short reason and ambiguity. Do not inspect arm, usage, notes or mappings. These are remaining answers from a recovered sequential subset pilot.',items},null,2)+'\n',{flag:'wx'});
writeFileSync(join(dir,'blind-review-mapping.json'),JSON.stringify(mapping,null,2)+'\n',{flag:'wx'});
console.log('Prepared nine remaining answers for blind native review.');
