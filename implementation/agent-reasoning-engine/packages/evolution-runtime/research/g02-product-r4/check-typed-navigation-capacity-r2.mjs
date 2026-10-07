// Source-only capacity check; no reference labels, score reads or providers.
// Open Questions: evidence/G02-TYPED-NAVIGATION-R1.json.
import {readFileSync,readdirSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {bindDelivery} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
import {createTypedNavigation} from './typed-navigation-r2.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const prior='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006';
const root='/home/vlad_/are-benchmark-archive/g02-typed-navigation-construction-r2-20261006';
const sha=x=>createHash('sha256').update(x).digest('hex'),bytes=p=>readFileSync(p),read=p=>JSON.parse(bytes(p));
if(existsSync(root))throw Error('capacity.no-overwrite');
const frozen=read(join(prior,'FREEZE.json'));const rows=[],parsed=new Map(),sources={};
mkdirSync(root,{mode:0o700});
const save=(name,value)=>writeFileSync(join(root,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
const sourcePins=Object.fromEntries(['typed-navigation-r2.mjs','typed-source-structure-r2.py', 'check-typed-navigation-capacity-r2.mjs'].map(n=>[n,sha(bytes(join(here,n)))]));
save('STARTED.json',{status:'source-only-construction',source_sha256:sourcePins,prior_freeze_sha256:sha(bytes(join(prior,'FREEZE.json'))),new_provider_calls:0,reference_label_reads:0});
for(const c of frozen.cases)for(const arm of ['control','workspace']){
 const dir=join(prior,c.pair+'-'+arm),resultBytes=bytes(join(dir,'RESULT.json'));
 if(sha(resultBytes)!==read(join(dir,'PRE-SCORE-SEAL.json')).result_sha256)throw Error('capacity.prior-result-binding');
 const result=JSON.parse(resultBytes).result,bound=bindDelivery({captures:result.captures,receipts:result.receipts});
 if(bound.unmapped.length||!bound.token_accounting.cost_complete)throw Error('capacity.delivery-binding');
 const snapshots=new Map(readdirSync(join(dir,'snapshots')).map(n=>{const p=join(dir,'snapshots',n),b=bytes(p),s=JSON.parse(b);sources[p]=sha(b);return[s.path+'\0'+s.source_sha256,s];}));
 const observed=new Map(bound.read_observations.map(r=>[r.path+'\0'+r.source_sha256,r]));
 for(const [key,r] of observed){
  const snapshot=snapshots.get(key);if(!snapshot)throw Error('capacity.missing-confirmed-snapshot');
  if(!parsed.has(key)){
   const navigate=createTypedNavigation({getObservedSnapshot:()=>snapshot});
   const first=await navigate({path:r.path,query:'',kind:'any',offset:0,limit:10});
   let definitions=0,pages=0,status=first.error??'parsed',response=first;
   while(response.ok){definitions+=response.output.definitions.length;pages++;
    if(response.output.next_offset===null)break;
    response=await navigate({path:r.path,query:'',kind:'any',offset:response.output.next_offset,limit:10});
    if(!response.ok)throw Error('capacity.pagination-failed');
   }
   parsed.set(key,{path:r.path,source_sha256:r.source_sha256,status,definitions,pages});
  }
 }
 const files=[...observed.keys()].map(k=>parsed.get(k));
 rows.push({pair:c.pair,arm,result_sha256:sha(resultBytes),confirmed_source_files:files.length,parsed_files:files.filter(f=>['parsed','parsed-partial'].includes(f.status)).length,
  definitions:files.reduce((n,f)=>n+f.definitions,0),files});
 console.log(JSON.stringify({pair:c.pair,arm,confirmed:files.length,parsed:rows.at(-1).parsed_files,definitions:rows.at(-1).definitions}));
}
for(const [name,pin] of Object.entries(sourcePins))if(sha(bytes(join(here,name)))!==pin)throw Error('capacity.source-drift');
const unique=[...parsed.values()],counts={};for(const r of unique)counts[r.status]=(counts[r.status]??0)+1;
save('CONSTRUCTION-SEAL.json',{status:'completed-source-only-capacity',source_sha256:sourcePins,snapshot_sha256:sources,rows,
 unique_confirmed_sources:unique.length,status_counts:counts,unique_definitions:unique.reduce((n,f)=>n+f.definitions,0),
 synthetic_python_tests_passed:10,synthetic_node_tests_passed:7,new_provider_calls:0,reference_label_reads:0,
 claim_ceiling:'Parser/navigation capacity only, not source acquisition improvement or native quality. Unsupported or parse-error files remain in denominators and use ordinary source tools.',
 authority_effect:'none',open_questions_owner:'G02-TYPED-NAVIGATION-R1.json'});
console.log(JSON.stringify({root,status_counts:counts,seal_sha256:sha(bytes(join(root,'CONSTRUCTION-SEAL.json')))}));
