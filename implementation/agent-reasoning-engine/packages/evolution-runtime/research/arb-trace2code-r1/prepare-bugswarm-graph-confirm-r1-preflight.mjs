#!/usr/bin/env node
// Metadata-only manifest for the frozen, repository-disjoint G01 confirmation preflight.
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';

const base='/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004';
const inputs=[
  ['split',`${base}/graph-dev-r1/METADATA-COHORTS-R1.json`,'6630be1c012aa027f3b525ffa3b1382e7f5ab751b84c8547eb9c679a16d68a85'],
  ['prior',`${base}/METADATA-CANDIDATE-24-R1.json`,'fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d'],
  ['dev',`${base}/graph-dev-r2/DEV-METADATA-R2.json`,null],
  ['dev_b',`${base}/graph-dev-b-r1/METADATA-COHORT-B-R2.json`,'53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8'],
];
const sha=data=>createHash('sha256').update(data).digest('hex');
const loaded={};
for(const [key,path,expected] of inputs){
  const data=readFileSync(path);
  if(expected && sha(data)!==expected)throw Error(`${key} checksum drift`);
  loaded[key]={value:JSON.parse(data),sha256:sha(data)};
}
const reserved=['Python','Java'].flatMap(language=>loaded.split.value.cohorts.reserved_confirmation[language]);
const previous=[...loaded.prior.value.selected,...loaded.dev.value.development,...loaded.dev_b.value.development];
if(reserved.length!==24 || previous.length!==72)throw Error('denominator drift');
const seen=new Set(previous.map(row=>row.repo.toLowerCase()));
const own=new Set();
const cases=reserved.map((row,index)=>{
  if(row.ordinal!==index%12+1 || row.language!==(index<12?'Python':'Java') ||
     !/^[\w.-]+\/[\w.-]+$/.test(row.repo) || !/^[0-9a-f]{40}$/.test(row.failure_commit) ||
     !Number.isSafeInteger(row.failure_job_id) || seen.has(row.repo.toLowerCase()) ||
     own.has(row.repo.toLowerCase()))throw Error(`invalid or overlapping reserved case ${index+1}`);
  own.add(row.repo.toLowerCase());
  return {ordinal:index+1,language:row.language,repo:row.repo,
    image_tag:row.image_tag,failed_commit:row.failure_commit,job_id:row.failure_job_id};
});
const manifest={schema_version:'are.g01-bugswarm-graph-confirm-preflight-manifest-r1/v1',
  split_sha256:loaded.split.sha256,prior_sha256:loaded.prior.sha256,
  dev_sha256:loaded.dev.sha256,dev_b_sha256:loaded.dev_b.sha256,
  cases,attempts:24,automatic_retries:0,maximum_log_bytes:8*1024*1024,
  gold_opened:false,model_calls:0};
if(process.argv.length!==3)throw Error('usage: prepare... <new-manifest-path>');
writeFileSync(process.argv[2],JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
process.stdout.write(JSON.stringify({cases:cases.length,manifest_sha256:sha(readFileSync(process.argv[2]))})+'\n');
