// Source-only contingent presentation check; never touches current native arms.
// Open Questions: evidence/G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json.
import{readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync}from'node:fs';import{join,dirname}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';
import{bindDelivery,observationMaterial}from'../../../../benchmarks/contextbench-v1/delivery.mjs';
import{parseTypedSource}from'./typed-navigation-r2.mjs';import{appendPartialDefinitionMetadata}from'./inline-typed-discovery-candidate-r2.mjs';
const here=dirname(fileURLToPath(import.meta.url)),prior='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006',root='/home/vlad_/are-benchmark-archive/g02-inline-typed-discovery-construction-r2-20261006';
const sha=x=>createHash('sha256').update(x).digest('hex'),bytes=p=>readFileSync(p),read=p=>JSON.parse(bytes(p)),need=(v,r)=>{if(!v)throw Error('inline-capacity.'+r);};
need(!existsSync(root),'no-overwrite');const freeze=read(join(prior,'FREEZE.json')),indices=new Map(),rows=[];
const sources=Object.fromEntries(['check-inline-typed-discovery-capacity-r2.mjs','inline-typed-discovery-candidate-r2.mjs','typed-navigation-r2.mjs','typed-source-structure-r2.py'].map(n=>[n,sha(bytes(join(here,n)))]));
mkdirSync(root,{mode:0o700});const save=(n,x)=>writeFileSync(join(root,n),JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600});
save('STARTED.json',{status:'source-only-capacity',source_sha256:sources,prior_freeze_sha256:sha(bytes(join(prior,'FREEZE.json'))),new_provider_calls:0,reference_label_reads:0});
for(const c of freeze.cases)for(const arm of ['control','workspace']){
 const dir=join(prior,c.pair+'-'+arm),resultBytes=bytes(join(dir,'RESULT.json'));need(sha(resultBytes)===read(join(dir,'PRE-SCORE-SEAL.json')).result_sha256,'result-binding');
 const result=JSON.parse(resultBytes).result,bound=bindDelivery({captures:result.captures,receipts:result.receipts});need(bound.unmapped.length===0,'delivery');
 const snapshots=new Map(readdirSync(join(dir,'snapshots')).map(n=>{const s=read(join(dir,'snapshots',n));return[s.path+'\0'+s.source_sha256,s];}));
 let hinted=0,classHinted=0,functionHinted=0,unsupported=0,unusable=0,totalBytes=0,maxBytes=0;const observations=[];
 for(const r of bound.read_observations){
  const key=r.path+'\0'+r.source_sha256,snapshot=snapshots.get(key);need(snapshot&&sha(snapshot.utf8)===r.source_sha256,'snapshot-binding');
  if(!indices.has(key)){
   const ext=r.path.split('.').at(-1),language=ext==='py'?'python':['cpp','cc','cxx','hpp','hh','hxx'].includes(ext)?'cpp':null;
   const index=language?parseTypedSource(snapshot.utf8,language):null;indices.set(key,index);
  }
  const index=indices.get(key);if(!index)unsupported++;else if(!['parsed','parsed-partial'].includes(index.status))unusable++;
  const input={ok:true,output:{path:r.path,start_line:r.start_line,end_line:r.end_line,utf8:r.body,byte_count:Buffer.byteLength(r.body),source_sha256:r.source_sha256,source_revision:'base'}};
  const output=appendPartialDefinitionMetadata({result:input,index});
  need(JSON.stringify(observationMaterial(r.tool_call_id,input.output))===JSON.stringify(observationMaterial(r.tool_call_id,output.output)),'observation-identity');
  const metadata=output.output.typed_navigation,added=metadata?Buffer.byteLength(JSON.stringify(metadata)):0;
  if(metadata){hinted++;if(metadata.candidates.some(c=>c.kind==='class'))classHinted++;if(metadata.candidates.some(c=>c.kind==='function'))functionHinted++;need(added<=4096&&metadata.candidates.length<=3&&metadata.discovery_only===true,'caps');}
  totalBytes+=added;maxBytes=Math.max(maxBytes,added);
  observations.push({read_id:r.id,path:r.path,source_sha256:r.source_sha256,start_line:r.start_line,end_line:r.end_line,metadata_bytes:added,candidates:metadata?.candidates.length??0,candidate_kinds:metadata?.candidates.map(c=>c.kind)??[],incomplete_parse:metadata?.incomplete_parse??false});
 }
 rows.push({pair:c.pair,arm,result_sha256:sha(resultBytes),confirmed_reads:bound.read_observations.length,hinted_reads:hinted,class_hinted_reads:classHinted,function_hinted_reads:functionHinted,unsupported_reads:unsupported,unusable_parse_reads:unusable,total_metadata_bytes:totalBytes,max_metadata_bytes:maxBytes,observations});
 console.log(JSON.stringify({pair:c.pair,arm,reads:bound.read_observations.length,hinted,max_metadata_bytes:maxBytes}));
}
for(const[n,pin]of Object.entries(sources))need(sha(bytes(join(here,n)))===pin,'source-drift');need(rows.length===24,'all24');
const total=k=>rows.reduce((n,r)=>n+r[k],0),aggregate={confirmed_reads:total('confirmed_reads'),hinted_reads:total('hinted_reads'),class_hinted_reads:total('class_hinted_reads'),function_hinted_reads:total('function_hinted_reads'),unsupported_reads:total('unsupported_reads'),unusable_parse_reads:total('unusable_parse_reads'),total_metadata_bytes:total('total_metadata_bytes'),max_metadata_bytes:Math.max(...rows.map(r=>r.max_metadata_bytes))};
save('CONSTRUCTION-SEAL.json',{status:'all24-source-presentation-capacity-verified',source_sha256:sources,rows,aggregate,synthetic_tests_passed:5,new_provider_calls:0,reference_label_reads:0,
 claim_ceiling:'Optional source metadata capacity and unchanged observation identity only. Read-level denominators include unsupported/invalid files. Serialized bytes are not tokenizer/campaign cost; no native integration, uptake, F1 or superiority.',authority_effect:'none',open_questions_owner:'G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json'});
console.log(JSON.stringify({status:'all24-source-presentation-capacity-verified',aggregate,seal_sha256:sha(bytes(join(root,'CONSTRUCTION-SEAL.json')))}));
