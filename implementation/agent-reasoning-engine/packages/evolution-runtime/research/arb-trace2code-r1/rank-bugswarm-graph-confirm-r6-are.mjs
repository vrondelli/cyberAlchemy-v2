#!/usr/bin/env node
// Source-only ARE baseline on the 24 reserved confirmation repositories.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {basename,join,resolve} from 'node:path';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-bm25-r1.mjs';

const base='/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004';
const sourcePath=join(base,'graph-confirm-r4/code-only/RESULT.json');
const queryPath=join(base,'graph-confirm-r4/query-only/QUERIES.jsonl');
const sourceRoot=join(base,'graph-confirm-r4/code-only');
const outputRoot=join(base,'graph-confirm-r4/rankings-r6/are');
const sourceSha='3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a';
const querySha='d570e3ab4a9e0f5c9945544bbb2681949c96ffdfcf106abd9d9007634254a2aa';
const rankerSha='52629ca2faddf20db18e78ea8b7debb880d0140413d42c67ec759e5f53aa5788';
const sha=value=>createHash('sha256').update(value).digest('hex');
const need=(ok,why)=>{if(!ok)throw Error(`g01-confirm-r6-are.${why}`);};
const ordinal=Number(process.argv[2]);
need(process.argv.length===3 && Number.isInteger(ordinal) && ordinal>=1 && ordinal<=24,'ordinal');
need(sha(readFileSync(sourcePath))===sourceSha && sha(readFileSync(queryPath))===querySha &&
  sha(readFileSync(fileURLToPath(new URL('./ranked-source-acquisition-bm25-r1.mjs',import.meta.url))))===rankerSha,
  'input-pin-drift');
const sources=JSON.parse(readFileSync(sourcePath,'utf8')).records;
const queries=readFileSync(queryPath,'utf8').trimEnd().split('\n').map(JSON.parse);
need(sources.length===24 && queries.length===24,'denominator');
const src=sources[ordinal-1],query=queries[ordinal-1];
need(src.slot===ordinal && query.ordinal===ordinal && src.image_tag===query.id &&
  src.repo===query.repo && src.failed_commit===query.base_commit &&
  sha(Buffer.from(query.query,'utf8'))===query.query_sha256 &&
  Buffer.byteLength(query.query,'utf8')<=1024,'case-identity');
const root=resolve(src.root);
need(root.startsWith(resolve(sourceRoot)+'/') && basename(root).startsWith(`${String(ordinal).padStart(2,'0')}-`),
  'source-root');
const paths=execFileSync('git',['ls-files','-z'],{cwd:root,timeout:30000,maxBuffer:16*1024*1024})
  .toString('utf8').split('\0').filter(Boolean).sort();
need(paths.length===src.projected_files,'file-count');
const tree=createHash('sha256');
let bytes=0;
for(const path of paths){
  need(!path.startsWith('/') && !path.split('/').includes('..'),'unsafe-path');
  const content=readFileSync(join(root,path));
  bytes+=content.length;
  tree.update(Buffer.from(path+'\0'));
  tree.update(createHash('sha256').update(content).digest());
}
need(bytes===src.projected_bytes && tree.digest('hex')===src.projected_tree_sha256,'tree-drift');
if(!existsSync(outputRoot))mkdirSync(outputRoot,{recursive:true,mode:0o700});
if(ordinal===1){
  const freeze={schema_version:'are.g01-confirm-are-freeze-r6/v1',source_sha256:sourceSha,
    query_sha256:querySha,ranker_sha256:rankerSha,
    runner_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),
    cases:24,max_index_bytes:128*1024*1024,gold_opened:false,model_calls:0};
  writeFileSync(join(outputRoot,'FREEZE.json'),JSON.stringify(freeze,null,2)+'\n',{flag:'wx',mode:0o600});
}else need(existsSync(join(outputRoot,'FREEZE.json')),'missing-freeze');
const started=performance.now();
const ranker=createRankedSourceAcquisition({root,base_commit:src.failed_commit,
  problem_statement:query.query,allow_projection:true,mode:'trace-text',
  maximum_index_bytes:128*1024*1024});
const ranked=ranker.rankAll(query.query);
const elapsed=Math.round(performance.now()-started);
const set=new Set(paths);
need(!ranked.partial_index && ranked.indexed_files===paths.length &&
  ranked.ranked_files.length===paths.length && new Set(ranked.ranked_files).size===paths.length &&
  ranked.ranked_files.every(path=>set.has(path)),'ranking-coverage');
const output={schema_version:'are.g01-confirm-are-ranking-r6/v1',ordinal,id:query.id,
  repo:query.repo,language:query.language,base_commit:src.failed_commit,
  query_sha256:query.query_sha256,candidate_count:paths.length,
  indexed_bytes:ranked.indexed_bytes,ranker_elapsed_ms:elapsed,
  ranked_files:ranked.ranked_files,gold_opened:false,model_calls:0};
const encoded=JSON.stringify(output)+'\n';
writeFileSync(join(outputRoot,`ARE-RANKING-${String(ordinal).padStart(2,'0')}.json`),encoded,
  {flag:'wx',mode:0o600});
process.stdout.write(JSON.stringify({ordinal,candidate_count:paths.length,indexed_bytes:ranked.indexed_bytes,
  elapsed_ms:elapsed,ranking_sha256:sha(encoded)})+'\n');
