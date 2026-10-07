// Post-score attribution only. Open Questions: G02-QUERY-EXPANSION-SCREEN-R1.json.
import {readFileSync,writeFileSync,existsSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash} from './vps-json-provider-r1.mjs';
import {goldFiles} from './query-expansion-screen-metrics-r1.mjs';
const root='/home/vlad_/are-benchmark-archive/g02-query-expansion-screen-r1-20261006';
const prior='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006/score-bundles';
const read=p=>JSON.parse(readFileSync(p));
const need=(v,r)=>{if(!v)throw Error('query-index-diagnostic.'+r);};
const save=(name,data)=>writeFileSync(join(root,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
need(!existsSync(join(root,'INDEX-ADMISSION-SEAL.json')),'no-replay');
const freezeBytes=readFileSync(join(root,'FREEZE.json')),freeze=JSON.parse(freezeBytes);
need(read(join(root,'RESULT.json')).status==='terminal-acquisition-screen','not-terminal');
need(read(join(root,'SCREEN-RESULT.json')).status==='acquisition-screen-rejected','not-rejected');
const lists=[];
// Reconstruct every source-only admission decision before loading any labels.
for(const c of freeze.cases){
 need(hash(readFileSync(c.ranker_path))===c.ranker_sha256,'ranker-drift');
 const paths=execFileSync('git',['-c',`safe.directory=${c.base}`,'-C',c.base,'ls-files','-z'],{maxBuffer:16*1024**2}).toString('utf8').split('\0').filter(Boolean).sort();
 const admitted=[],omitted=[];let bytes=0;
 for(const path of paths){
  const target=join(c.base,path);let stat;
  try{stat=statSync(target);}catch{omitted.push({path,reason:'missing-or-dangling'});continue;}
  if(!stat.isFile()){omitted.push({path,reason:'not-regular-file'});continue;}
  if(stat.size>1024**2){omitted.push({path,reason:'per-file-cap'});continue;}
  if(bytes+stat.size>64*1024**2){omitted.push({path,reason:'aggregate-cap'});continue;}
  const buffer=readFileSync(target);
  if(buffer.subarray(0,Math.min(buffer.length,8192)).includes(0)){omitted.push({path,reason:'nul-prefix'});continue;}
  bytes+=buffer.length;admitted.push(path);
 }
 const leads=read(join(root,c.pair,'LEADS.json'));
 for(const meta of leads.treatment_projection.ranker_queries){
  need(meta.indexed_files===admitted.length&&meta.indexed_bytes===bytes&&meta.omitted_files===omitted.length,'archived-count-mismatch');
 }
 lists.push({pair:c.pair,instance_id:c.instance_id,admitted,omitted,indexed_bytes:bytes,base:c.base});
 console.log(JSON.stringify({pair:c.pair,indexed_files:admitted.length,indexed_bytes:bytes,omitted_files:omitted.length,status:'source-only-index-reproduced'}));
}
save('INDEX-ADMISSION-SEAL.json',{freeze_sha256:hash(freezeBytes),diagnostic_source_sha256:hash(readFileSync(fileURLToPath(import.meta.url))),rows:lists,labels_loaded:false,authority_effect:'none'});
const sealBytes=readFileSync(join(root,'INDEX-ADMISSION-SEAL.json'));
need(hash(readFileSync(join(root,'FREEZE.json')))===hash(freezeBytes),'freeze-drift');
const rows=[];
for(const index of lists){
 const dir=join(prior,index.pair+'-control'),bundle=read(join(dir,'BUNDLE.json'));
 const c=freeze.cases.find(c=>c.pair===index.pair);
 need(hash(readFileSync(join(dir,'BUNDLE.json')))===c.prior_bundle_sha256,'bundle-drift');
 const bytes=readFileSync(join(dir,'GOLD-EXPOSED-TASK1.json'));need(hash(bytes)===bundle.gold_sha256,'gold-drift');
 const gold=JSON.parse(bytes);need(gold.inst_id===index.instance_id,'gold-identity');
 const paths=goldFiles(gold),observed=new Set(c.observed_files),admitted=new Set(index.admitted);
 rows.push({pair:index.pair,gold_sha256:hash(bytes),reference_files:paths.map(path=>({path,already_observed:observed.has(path),indexed:admitted.has(path),omission_reason:admitted.has(path)?null:index.omitted.find(x=>x.path===path)?.reason??'not-tracked-at-base'}))});
}
const all=rows.flatMap(r=>r.reference_files),novel=all.filter(r=>!r.already_observed);
save('INDEX-REFERENCE-DIAGNOSTIC.json',{status:'all12-source-index-counts-reproduced',index_seal_sha256:hash(sealBytes),reference_occurrences:all.length,indexed_reference_occurrences:all.filter(r=>r.indexed).length,novel_reference_occurrences:novel.length,indexed_novel_reference_occurrences:novel.filter(r=>r.indexed).length,rows,claim_ceiling:'Exposed index-attribution diagnostic only; does not change the rejected screen gate or prove ranking causality, native quality or superiority.',authority_effect:'none',open_questions_owner:'G02-QUERY-EXPANSION-SCREEN-R1.json'});
console.log(JSON.stringify({references:all.length,indexed:all.filter(r=>r.indexed).length,novel:novel.length,indexed_novel:novel.filter(r=>r.indexed).length}));
