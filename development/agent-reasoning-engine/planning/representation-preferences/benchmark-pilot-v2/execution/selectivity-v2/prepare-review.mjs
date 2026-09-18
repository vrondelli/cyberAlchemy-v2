import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
const dir=import.meta.dirname;
const json=p=>JSON.parse(readFileSync(join(dir,p)));
const result=json('live/result.json');
if(result.status!=='completed'||result.completed!==16)throw Error('not complete');
const rows=json('episodes.json'),gold=json('gold.json');
const packet=[],mapping=[];
for(const r of result.results){
 const id=randomUUID(),task=rows.find(x=>x.id===r.task_id),receipt=json('live/'+r.id+'-receipt.json');
 packet.push({review_id:id,facts:task.facts,query:task.query,expected_representation:gold[r.task_id].format,answer:receipt.output});
 mapping.push({review_id:id,call_id:r.id});
}
packet.sort((a,b)=>a.review_id.localeCompare(b.review_id));
writeFileSync(join(dir,'blind-review-packet.json'),JSON.stringify({instructions:'Evaluate every answer against facts, query and expected representation. Check factual correctness, direction of dependencies, correct people/actions, constraints and complete answer. Mark semantic_pass true/false with a short reason. Do not inspect arm mapping, scores or token usage. Structural scorer is separate. Return all 16 review IDs.',items:packet},null,2)+'\n',{flag:'wx'});
writeFileSync(join(dir,'blind-review-mapping.json'),JSON.stringify(mapping,null,2)+'\n',{flag:'wx'});
console.log('Prepared 16 randomly coded outputs for blind review.');
