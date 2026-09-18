import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
const dir=import.meta.dirname,json=p=>JSON.parse(readFileSync(join(dir,p)));
const tail=json('live/result.json');if(tail.status!=='completed'||tail.calls.length!==4)throw Error('tail incomplete');
const prefix=json('../recovery-v1/live/result.json');
const answers=[...prefix.answers,tail.calls.at(-1)],prior=json('../blind-review-mapping.json'),done=new Set(prior.map(x=>x.call_id));
const sources=json('../../longmemeval/inputs.json'),gold=json('../../longmemeval/gold.json'),items=[],mapping=[];
for(const answer of answers){if(done.has(answer.id))continue;const review_id=randomUUID(),s=sources.find(x=>x.task_id===answer.task_id),g=gold.find(x=>x.task_id===answer.task_id);items.push({review_id,question:s.question,question_type:g.question_type,abstention:g.abstention,gold:g.answer,response:answer.output});mapping.push({review_id,call_id:answer.id});}
if(items.length!==8)throw Error('unexpected review count');items.sort((a,b)=>a.review_id.localeCompare(b.review_id));
writeFileSync(join(dir,'blind-review-packet.json'),JSON.stringify({rubric_ref:'../../longmemeval/native-rubric.py',instructions:'Evaluate each answer independently using the exact native rubric, without inspecting arms, usage, notes or mappings. Return review_id, pass boolean, short reason and ambiguity. No answer exists for one failed slot; it is not in this packet.',items},null,2)+'\n',{flag:'wx'});
writeFileSync(join(dir,'blind-review-mapping.json'),JSON.stringify(mapping,null,2)+'\n',{flag:'wx'});console.log('Eight remaining completed answers ready for blind review.');
