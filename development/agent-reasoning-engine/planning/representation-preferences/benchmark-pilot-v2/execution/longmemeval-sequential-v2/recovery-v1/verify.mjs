import {readFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {ROOT,sha} from '../../selectivity-v2/provider.mjs';
export function verifyPrefix(base=resolve(import.meta.dirname,'..')){
 const json=p=>JSON.parse(readFileSync(join(base,p)));
 const freeze=json('freeze.json');
 for(const b of freeze.bindings)if(sha(readFileSync(resolve(ROOT,b.path)))!==b.sha256)throw Error('original freeze drift');
 const prefix=json('live/result.json'),schedule=json('schedule.json');
 if(prefix.status!=='stopped'||prefix.usage_complete!==true||prefix.completed_calls!==28||prefix.calls.length!==28||prefix.completed_answers!==7||prefix.answers.length!==7||prefix.total_tokens!==65762)throw Error('unexpected recovery boundary');
 const starts=readdirSync(join(base,'live')).filter(f=>f.endsWith('-started.json')).map(f=>json('live/'+f)).filter(x=>x.kind==='model');
 if(starts.length!==28||new Set(starts.map(x=>x.id)).size!==28)throw Error('unaccounted model request');
 for(const [i,c] of prefix.calls.entries()){
  const expected=schedule[i];
  const expectedId=`r${expected.repetition}-${expected.task_id.replaceAll(':','-')}-${expected.arm}-${expected.phase}-${expected.step}`;if(c.id!==expectedId)throw Error('prefix call identity mismatch');
  for(const field of ['task_id','arm','repetition','phase','step'])if(c[field]!==expected[field])throw Error('prefix schedule mismatch');
  const receipt=json('live/'+c.id+'-receipt.json'),request=readFileSync(join(base,'live',c.id+'-request.json'));
  if(!starts.some(x=>x.id===c.id)||!receipt.ok||receipt.request_sha256!==sha(request)||JSON.stringify(receipt.usage)!==JSON.stringify(c.usage))throw Error('prefix receipt mismatch');
  const a=prefix.answers.find(x=>x.id===c.id);if(c.phase==='answer'&&(!a||a.output!==receipt.output))throw Error('answer binding mismatch');
 }
 const failure=json('live/r1-longmemeval-eeda8a6d_abs-treatment-ingestion-0-admission-receipt.json');
 if(failure.kind!=='tokenizer'||failure.failure!=='request-failed')throw Error('different failure boundary');
 if(prefix.calls.at(-1).phase!=='answer'||prefix.calls.reduce((s,c)=>s+c.usage.total_tokens,0)!==prefix.total_tokens)throw Error('unsafe prefix');
 return {ok:true,prefix,prefix_sha256:sha(readFileSync(join(base,'live/result.json'))),remaining_calls:schedule.length-prefix.calls.length};
}
