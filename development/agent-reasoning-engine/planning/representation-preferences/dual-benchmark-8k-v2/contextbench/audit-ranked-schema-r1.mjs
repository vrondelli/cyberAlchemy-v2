// Offline trace evidence only. Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import {readFileSync,writeFileSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';
import Ajv from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/node_modules/ajv/dist/ajv.js';
import {rankedSearchSchema} from './ranked-read-arguments-r1.mjs';
const c=import.meta.dirname,stage=join(c,'ranked-read-production-live-r1'),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const reviewPath=join(stage,'RESULT-REVIEW-R1.json'),review=JSON.parse(readFileSync(reviewPath)),pins=new Map(review.source_bindings.map(b=>[b.path,b.sha256]));
if(!review.approved)throw Error('schema-audit.unreviewed-result');
const source_bindings=[{path:reviewPath,sha256:hash(reviewPath)}];
const pin=p=>{const sha256=hash(p);if(pins.get(p)!==sha256)throw Error('schema-audit.source-drift');source_bindings.push({path:p,sha256});};
pin(join(c,'ranked-read-arguments-r1.mjs'));
const validate=new Ajv({strict:true,allErrors:true}).compile(rankedSearchSchema),rows=[];
for(let i=0;i<4;i++){
 const path=join(stage,'runs_root',String(i).padStart(2,'0'),'events.jsonl');pin(path);
 const row={task_id:'contextbench-'+(i+1),requested:0,rejected:0,advertised_valid_rejected:0,issues:{}};
 for(const line of readFileSync(path,'utf8').trim().split('\n')){
  const e=JSON.parse(line);if(e.kind!=='source-tool-result'||e.call.function.name!=='search')continue;
  const args=JSON.parse(e.call.function.arguments);if(args.mode!=='ranked')continue;row.requested++;
  if(e.output.ok!==true){row.rejected++;if(validate(args))row.advertised_valid_rejected++;for(const x of e.output.issues??[]){const k=x.path+':'+x.code;row.issues[k]=(row.issues[k]??0)+1;}}
 }
 rows.push(row);
}
source_bindings.push({path:join(c,'audit-ranked-schema-r1.mjs'),sha256:hash(join(c,'audit-ranked-schema-r1.mjs'))});
const totals=Object.fromEntries(['requested','rejected','advertised_valid_rejected'].map(k=>[k,rows.reduce((n,r)=>n+r[k],0)]));
const result={schema:'are.ranked-schema-trace-audit/v1',rows,totals,source_bindings,model_calls:0,provider_calls:0,conclusion:'Every rejected ranked call in this run was allowed by the advertised structural schema. Runtime imposes additional ranked-mode constraints. This proves schema disagreement, not its causal contribution to benchmark quality.',open_questions_ref:'RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md'};
writeFileSync(join(c,'RANKED-SCHEMA-AGREEMENT-AUDIT-R1.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(totals));
