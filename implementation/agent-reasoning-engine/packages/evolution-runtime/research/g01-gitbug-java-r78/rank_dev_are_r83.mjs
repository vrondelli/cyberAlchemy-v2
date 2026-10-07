#!/usr/bin/env node
// Complete ARE trace-text ranking over the 12 r83 development source trees.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import {createRankedSourceAcquisition} from '../arb-trace2code-r1/ranked-source-acquisition-bm25-r1.mjs';

const SOURCE_SHA='aaff284494a0726d5517a2f492a36186d6c34a35b4166819dc3a83f77211eb46';
const QUERIES_SHA='478fc0b4fca5936cca09fdffe0a95b9dc2af2bb42482a9aa910fddc48be23eaf';
const sha=value=>createHash('sha256').update(value).digest('hex');
const [sourcePath,queryPath,outputRoot]=process.argv.slice(2);
if(process.argv.length!==5)throw Error('usage: rank_dev_are_r83.mjs source queries output');
if(sha(readFileSync(sourcePath))!==SOURCE_SHA||sha(readFileSync(queryPath))!==QUERIES_SHA)throw Error('input-drift');
const source=JSON.parse(readFileSync(sourcePath,'utf8'));
const queries=readFileSync(queryPath,'utf8').trimEnd().split('\n').map(JSON.parse);
if(source.cases!==12||source.records.length!==12||queries.length!==12||source.gold_values_used!==false)throw Error('population-drift');
mkdirSync(outputRoot,{mode:0o700});
const freeze={schema_version:'are.g01-gitbug-r83-are-freeze/v1',cases:12,
  source_sha256:SOURCE_SHA,queries_sha256:QUERIES_SHA,
  runner_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),
  protocol_sha256:sha(readFileSync(new URL('./R83-DEV-RANKING-PROTOCOL.md',import.meta.url))),
  mode:'trace-text',allow_projection:true,maximum_index_bytes:128*1024*1024,
  gold_values_used:false,passing_source_opened:false,model_calls:0};
writeFileSync(join(outputRoot,'ARE-FREEZE.json'),JSON.stringify(freeze,null,2)+'\n',{flag:'wx',mode:0o600});
const receipts=[];
for(let i=0;i<12;i++){
  const src=source.records[i],q=queries[i],ordinal=i+1;
  if(src.ordinal!==ordinal||q.ordinal!==ordinal||src.repo!==q.repo||
    src.base_commit!==q.base_commit||sha(Buffer.from(q.query,'utf8'))!==q.query_sha256)
    throw Error(`identity:${ordinal}`);
  const root=resolve(src.root),projection=resolve(sourcePath,'../');
  if(!root.startsWith(projection+'/'))throw Error(`root:${ordinal}`);
  const paths=execFileSync('git',['ls-files','-z'],{cwd:root,timeout:30000,maxBuffer:16*1024*1024})
    .toString('utf8').split('\0').filter(Boolean).sort();
  if(paths.length!==src.projected_files||paths.some(path=>!path.endsWith('.java')))throw Error(`files:${ordinal}`);
  const tree=createHash('sha256');let bytes=0;
  for(const path of paths){
    if(path.startsWith('/')||path.split('/').includes('..'))throw Error('unsafe-path');
    const data=readFileSync(join(root,path));bytes+=data.length;
    tree.update(Buffer.from(path+'\0'));tree.update(createHash('sha256').update(data).digest());
  }
  if(bytes!==src.projected_bytes||tree.digest('hex')!==src.projected_tree_sha256)throw Error(`tree:${ordinal}`);
  const started=performance.now();
  const ranker=createRankedSourceAcquisition({root,base_commit:src.base_commit,
    problem_statement:q.query,allow_projection:true,mode:'trace-text',maximum_index_bytes:128*1024*1024});
  const ranked=ranker.rankAll(q.query),set=new Set(paths);
  if(ranked.partial_index||ranked.indexed_files!==paths.length||ranked.ranked_files.length!==paths.length||
    new Set(ranked.ranked_files).size!==paths.length||ranked.ranked_files.some(path=>!set.has(path)))
    throw Error(`ranking-coverage:${ordinal}`);
  const row={schema_version:'are.g01-gitbug-r83-are-ranking/v1',ordinal,repo:q.repo,
    base_commit:q.base_commit,query_sha256:q.query_sha256,candidate_count:paths.length,
    indexed_bytes:ranked.indexed_bytes,ranker_elapsed_ms:Math.round(performance.now()-started),
    ranked_files:ranked.ranked_files,gold_values_used:false,model_calls:0};
  const encoded=JSON.stringify(row)+'\n';
  writeFileSync(join(outputRoot,`ARE-RANKING-${String(ordinal).padStart(2,'0')}.json`),encoded,
    {flag:'wx',mode:0o600});
  receipts.push({ordinal,sha256:sha(encoded)});
  process.stdout.write(JSON.stringify({ordinal,candidate_count:paths.length,elapsed_ms:row.ranker_elapsed_ms})+'\n');
}
writeFileSync(join(outputRoot,'ARE-SEAL.json'),JSON.stringify({schema_version:'are.g01-gitbug-r83-are-seal/v1',
  cases:12,rankings:receipts,freeze_sha256:sha(readFileSync(join(outputRoot,'ARE-FREEZE.json'))),
  gold_values_used:false,model_calls:0},null,2)+'\n',{flag:'wx',mode:0o600});
