#!/usr/bin/env node
// Apply the byte-pinned source ranker to all 24 r50 confirmation cases.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {basename,join,resolve} from 'node:path';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-bm25-r1.mjs';

const base='/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004';
const sourcePath=join(base,'guarded-confirm-r48/code-projection-r1/RESULT.json');
const queryPath=join(base,'guarded-confirm-r50/queries/QUERIES.jsonl');
const querySealPath=join(base,'guarded-confirm-r50/queries/QUERY-SEAL.json');
const roots=join(base,'guarded-confirm-r48/code-projection-r1/roots');
const outputRoot=join(base,'guarded-confirm-r50/bm25');
const files={
  source:sourcePath,queries:queryPath,query_seal:querySealPath,
  ranker:fileURLToPath(new URL('./ranked-source-acquisition-bm25-r1.mjs',import.meta.url)),
  protocol:fileURLToPath(new URL('../../evidence/G01-BUGSWARM-GUARDED-CONFIRM-R50-TREATMENT-CONSTRUCTION-PROTOCOL-2026-10-04.md',import.meta.url)),
};
const pins={
  source:'bcc866fdae18d163850bbaa530a410e071e0e6948ff62710da3d22b6b915413b',
  queries:'7de33ff4eb40f085a0b1a5df7ce6467a382736fc6c30b96a24b9a08cc511bc87',
  query_seal:'0f02eed082e3d46517cde1857299b8d5adc2d442f7758afee8d1a009cf0e99da',
  ranker:'52629ca2faddf20db18e78ea8b7debb880d0140413d42c67ec759e5f53aa5788',
  protocol:'c584551195ce9c7614675bcdfb4b5d454480c760808c715e7b7a19a8e350d052',
};
const sha=value=>createHash('sha256').update(value).digest('hex');
const need=(ok,why)=>{if(!ok)throw Error(`g01-r50-bm25.${why}`);};
need(Object.entries(files).every(([name,path])=>sha(readFileSync(path))===pins[name]),'input-pin-drift');
const sources=JSON.parse(readFileSync(sourcePath,'utf8')).records;
const queries=readFileSync(queryPath,'utf8').trimEnd().split('\n').map(JSON.parse);
const querySeal=JSON.parse(readFileSync(querySealPath,'utf8'));
need(sources.length===24&&queries.length===24&&querySeal.cases===24&&
  querySeal.gold_opened===false&&querySeal.model_calls===0,'denominator');
mkdirSync(outputRoot,{recursive:true,mode:0o700});
const freeze={schema_version:'are.g01-guarded-confirm-r50-bm25-freeze/v1',input_sha256:pins,
  runner_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),cases:24,mode:'trace-text',
  allow_projection:true,maximum_index_bytes:128*1024*1024,gold_opened:false,
  passing_source_opened:false,patches_opened:false,network_calls:0,model_calls:0};
writeFileSync(join(outputRoot,'FREEZE.json'),JSON.stringify(freeze,null,2)+'\n',{flag:'wx',mode:0o600});
const seals=[];
for(let ordinal=1;ordinal<=24;ordinal++){
  const src=sources[ordinal-1],query=queries[ordinal-1];
  need(src.slot===ordinal&&query.ordinal===ordinal&&src.image_tag===query.id&&
    src.repo===query.repo&&src.failed_commit===query.base_commit&&src.language===query.language,
    `identity-${ordinal}`);
  const root=resolve(src.root);
  need(root.startsWith(resolve(roots)+'/')&&basename(root).startsWith(`${String(ordinal).padStart(2,'0')}-`),
    `root-${ordinal}`);
  const paths=execFileSync('git',['ls-files','-z'],{cwd:root,timeout:30000,maxBuffer:16*1024*1024})
    .toString('utf8').split('\0').filter(Boolean).sort();
  need(paths.length===src.projected_files,`file-count-${ordinal}`);
  const tree=createHash('sha256');let bytes=0;
  for(const path of paths){
    const content=readFileSync(join(root,path));bytes+=content.length;
    tree.update(Buffer.from(path+'\0'));tree.update(createHash('sha256').update(content).digest());
  }
  need(bytes===src.projected_bytes&&tree.digest('hex')===src.projected_tree_sha256,
    `tree-${ordinal}`);
  const started=performance.now();
  const ranker=createRankedSourceAcquisition({root,base_commit:src.failed_commit,
    problem_statement:query.query,allow_projection:true,mode:'trace-text',
    maximum_index_bytes:128*1024*1024});
  const ranked=ranker.rankAll(query.query);const elapsed=Math.round(performance.now()-started);
  const set=new Set(paths);
  need(!ranked.partial_index&&ranked.indexed_files===paths.length&&
    ranked.ranked_files.length===paths.length&&new Set(ranked.ranked_files).size===paths.length&&
    ranked.ranked_files.every(path=>set.has(path)),`coverage-${ordinal}`);
  const output={schema_version:'are.g01-guarded-confirm-r50-bm25-ranking/v1',ordinal,
    id:query.id,repo:query.repo,language:query.language,base_commit:src.failed_commit,
    query_sha256:query.query_sha256,source_tree_sha256:src.projected_tree_sha256,
    candidate_count:paths.length,indexed_bytes:ranked.indexed_bytes,ranker_elapsed_ms:elapsed,
    ranked_files:ranked.ranked_files,gold_opened:false,passing_source_opened:false,
    patches_opened:false,network_calls:0,model_calls:0};
  const encoded=JSON.stringify(output)+'\n';
  const name=`RANKING-${String(ordinal).padStart(2,'0')}.json`;
  writeFileSync(join(outputRoot,name),encoded,{flag:'wx',mode:0o600});
  seals.push({ordinal,id:query.id,file:name,ranking_sha256:sha(encoded)});
  process.stdout.write(JSON.stringify({ordinal,candidate_count:paths.length,elapsed_ms:elapsed})+'\n');
}
const seal={schema_version:'are.g01-guarded-confirm-r50-bm25-seal/v1',input_sha256:pins,
  freeze_sha256:sha(readFileSync(join(outputRoot,'FREEZE.json'))),cases:24,rankings:seals,
  gold_opened:false,passing_source_opened:false,patches_opened:false,network_calls:0,model_calls:0};
const data=JSON.stringify(seal,null,2)+'\n';
writeFileSync(join(outputRoot,'SEAL.json'),data,{flag:'wx',mode:0o600});
process.stdout.write(JSON.stringify({cases:24,seal_sha256:sha(data)})+'\n');
