#!/usr/bin/env node
// Failed-test-only BM25 acquisition channel on the exposed G01 cohort.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {basename,join,resolve} from 'node:path';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-bm25-r1.mjs';

const base='/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r4';
const sourcePath=join(base,'code-only/RESULT.json');
const queryPath=join(base,'query-only/QUERIES.jsonl');
const outputRoot=join(base,'exposed-r9/test-query-rankings');
const protocolPath=fileURLToPath(new URL('../../evidence/G01-BUGSWARM-EXPOSED-R9-TEST-QUERY-PROTOCOL-2026-10-04.md',import.meta.url));
const pins={source:'3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a',
  queries:'d570e3ab4a9e0f5c9945544bbb2681949c96ffdfcf106abd9d9007634254a2aa',
  ranker:'52629ca2faddf20db18e78ea8b7debb880d0140413d42c67ec759e5f53aa5788',
  protocol:'a19fe29254f0f9a69fb35f05b62e80ce465382e8c2c9c7cc81aff1320ddf86da'};
const sha=value=>createHash('sha256').update(value).digest('hex');
const need=(ok,why)=>{if(!ok)throw Error(`g01-exposed-r9-test-query.${why}`);};
const ordinal=Number(process.argv[2]);
need(process.argv.length===3 && Number.isInteger(ordinal) && ordinal>=1 && ordinal<=24,'ordinal');
need(sha(readFileSync(sourcePath))===pins.source && sha(readFileSync(queryPath))===pins.queries &&
  sha(readFileSync(fileURLToPath(new URL('./ranked-source-acquisition-bm25-r1.mjs',import.meta.url))))===pins.ranker &&
  sha(readFileSync(protocolPath))===pins.protocol,'input-pin-drift');
const sources=JSON.parse(readFileSync(sourcePath,'utf8')).records;
const queries=readFileSync(queryPath,'utf8').trimEnd().split('\n').map(JSON.parse);
need(sources.length===24 && queries.length===24,'denominator');
const src=sources[ordinal-1],query=queries[ordinal-1];
need(src.slot===ordinal && query.ordinal===ordinal && src.image_tag===query.id &&
  src.repo===query.repo && src.failed_commit===query.base_commit &&
  sha(Buffer.from(query.query,'utf8'))===query.query_sha256,'case-identity');
const root=resolve(src.root);
need(root.startsWith(resolve(join(base,'code-only'))+'/') &&
  basename(root).startsWith(`${String(ordinal).padStart(2,'0')}-`),'root');
const paths=execFileSync('git',['ls-files','-z'],{cwd:root,timeout:30000,maxBuffer:16*1024*1024})
  .toString('utf8').split('\0').filter(Boolean).sort();
need(paths.length===src.projected_files,'file-count');
const pathSet=new Set(paths);
const tree=createHash('sha256');let bytes=0;
for(const path of paths){
  need(!path.startsWith('/') && !path.split('/').includes('..'),'unsafe-path');
  const content=readFileSync(join(root,path));bytes+=content.length;
  tree.update(Buffer.from(path+'\0'));
  tree.update(createHash('sha256').update(content).digest());
}
need(bytes===src.projected_bytes && tree.digest('hex')===src.projected_tree_sha256,'tree-drift');
const prefix='failed tests:\n',separator='\nlog tail:\n';
const cut=query.query.indexOf(separator);
const testText=query.query.startsWith(prefix) && cut>prefix.length
  ?query.query.slice(prefix.length,cut).trim():'';
if(!existsSync(outputRoot))mkdirSync(outputRoot,{recursive:true,mode:0o700});
if(ordinal===1){
  writeFileSync(join(outputRoot,'FREEZE.json'),JSON.stringify({
    schema_version:'are.g01-exposed-r9-test-query-freeze/v1',pins,
    runner_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),
    cases:24,max_index_bytes:128*1024*1024,gold_opened:false,model_calls:0},null,2)+'\n',
  {flag:'wx',mode:0o600});
}else need(existsSync(join(outputRoot,'FREEZE.json')),'missing-freeze');
let rankedFiles=[],elapsed=0,indexedBytes=0;
if(testText){
  const start=performance.now();
  const ranker=createRankedSourceAcquisition({root,base_commit:src.failed_commit,
    problem_statement:testText,allow_projection:true,mode:'trace-text',
    maximum_index_bytes:128*1024*1024});
  const ranked=ranker.rankAll(testText);
  elapsed=Math.round(performance.now()-start);
  rankedFiles=ranked.ranked_files;indexedBytes=ranked.indexed_bytes;
  need(!ranked.partial_index && ranked.indexed_files===paths.length &&
    rankedFiles.length===paths.length && new Set(rankedFiles).size===paths.length &&
    rankedFiles.every(path=>pathSet.has(path)) && indexedBytes===bytes,
    'ranking-coverage');
}
const output={schema_version:'are.g01-exposed-r9-test-query-ranking/v1',ordinal,
  id:query.id,repo:query.repo,language:query.language,base_commit:src.failed_commit,
  query_sha256:query.query_sha256,test_query_sha256:sha(testText),
  test_query_bytes:Buffer.byteLength(testText,'utf8'),skipped:!testText,
  candidate_count:paths.length,indexed_bytes:indexedBytes,
  ranker_elapsed_ms:elapsed,ranked_files:rankedFiles,gold_opened:false,model_calls:0};
const encoded=JSON.stringify(output)+'\n';
writeFileSync(join(outputRoot,`TEST-QUERY-RANKING-${String(ordinal).padStart(2,'0')}.json`),encoded,
  {flag:'wx',mode:0o600});
process.stdout.write(JSON.stringify({ordinal,skipped:!testText,files:rankedFiles.length,
  elapsed_ms:elapsed,sha256:sha(encoded)})+'\n');
