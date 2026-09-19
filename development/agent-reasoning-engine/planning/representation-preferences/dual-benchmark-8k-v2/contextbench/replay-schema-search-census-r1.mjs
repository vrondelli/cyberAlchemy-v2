// Historical accounting replay, not evidence of a new live schema run.
// Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';
import {censusSearchCalls} from './schema-agreement-search-census-r1.mjs';
const c=import.meta.dirname,read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const reviewPath=join(c,'ranked-read-production-live-r1/RESULT-REVIEW-R1.json'),review=read(reviewPath);assert.equal(review.approved,true);
const pins=new Map(review.source_bindings.map(b=>[resolve(b.path),b.sha256])),source_bindings=[{path:reviewPath,sha256:hash(reviewPath)}],rows=[];
for(let i=0;i<4;i++){
 const run=join(c,'ranked-read-production-live-r1/runs_root',String(i).padStart(2,'0'));
 for(const name of ['events.jsonl','result.json']){const path=join(run,name);assert.equal(hash(path),pins.get(path));source_bindings.push({path,sha256:hash(path)});}
 const events=readFileSync(join(run,'events.jsonl'),'utf8').trim().split('\n').map(JSON.parse),result=read(join(run,'result.json'));
 rows.push({task_index:i,census:censusSearchCalls({events,receipts:result.receipts})});
}
for(const name of ['schema-agreement-search-census-r1.mjs','schema-agreement-search-census-r1.test.mjs','schema-agreement-arguments-r1.mjs','replay-schema-search-census-r1.mjs']){const path=join(c,name);source_bindings.push({path,sha256:hash(path)});}
const totals=Object.fromEntries(['requested_search_calls','ranked_requested_calls','rejected_search_calls','ranked_rejected_calls','unresolved_search_calls','known_model_tokens'].map(k=>[k,rows.reduce((n,r)=>n+r.census[k],0)]));
assert.deepEqual(totals,{requested_search_calls:58,ranked_requested_calls:50,rejected_search_calls:30,ranked_rejected_calls:30,unresolved_search_calls:0,known_model_tokens:337030});
const artifact={schema:'are.schema-agreement-search-replay/v1',rows,totals,source_bindings,claim_ceiling:'Historical call and cost reconstruction. Structural agreement refers to the new local schema replay, not the schema offered during the historical run. No new live quality evidence.',provider_calls:0,open_questions_ref:'RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md'};
writeFileSync(join(c,'SCHEMA-AGREEMENT-SEARCH-REPLAY-R1.json'),JSON.stringify(artifact,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(totals));
