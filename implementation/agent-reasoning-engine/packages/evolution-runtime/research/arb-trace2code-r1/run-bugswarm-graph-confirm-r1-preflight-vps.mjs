#!/usr/bin/env node
// Source/log availability only. No passing commit, gold, ranking, or model call.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root='/opt/are-benchmark-runs/g01-bugswarm-graph-confirm-r1-preflight';
const name='RESERVED-PREFLIGHT-MANIFEST-R1.json';
const expected='f468b433d9314e8e55f466f5a9359d0d491e523ec2ec71dd11f84c18bd8daa22';
const sha=data=>createHash('sha256').update(data).digest('hex');
const path=file=>join(root,file);
const save=(file,data)=>writeFileSync(path(file),data,{flag:'wx',mode:0o600});
const json=value=>JSON.stringify(value,null,2)+'\n';
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
const curl=(args,limit)=>{
  const started=Date.now();
  const result=spawnSync('/usr/bin/curl',['--silent','--show-error','--location',
    '--proto','=https','--tlsv1.2','--connect-timeout','10','--max-time','45',...args],
    {encoding:null,maxBuffer:limit+65536,timeout:50000});
  const body=Buffer.isBuffer(result.stdout)?result.stdout:Buffer.alloc(0);
  return {exit_code:result.status,signal:result.signal,error_code:result.error?.code??null,
    body,bytes:body.length,sha256:sha(body),elapsed_ms:Date.now()-started};
};
const view=result=>({exit_code:result.exit_code,signal:result.signal,
  error_code:result.error_code,bytes:result.bytes,sha256:result.sha256,
  elapsed_ms:result.elapsed_ms});

need(process.argv.length===2 && !existsSync(path('RUN-FREEZE.json')),'prior run or arguments');
const raw=readFileSync(path(name));
need(sha(raw)===expected,'manifest checksum drift');
const manifest=JSON.parse(raw);
need(manifest.cases.length===24 && manifest.attempts===24 &&
  manifest.automatic_retries===0 && manifest.maximum_log_bytes===8*1024*1024 &&
  manifest.gold_opened===false && manifest.model_calls===0,'manifest shape drift');
save('RUN-FREEZE.json',json({schema_version:'are.g01-confirm-preflight-freeze-r1/v1',
  manifest_sha256:expected,runner_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),
  attempts:24,automatic_retries:0,max_log_bytes:manifest.maximum_log_bytes,
  endpoints:['https://codeload.github.com/{repo}/tar.gz/{failed_commit}',
    'https://www.bugswarm.org/artifact-logs/{job_id}/raw/',
    'https://www.bugswarm.org/artifact-logs/{job_id}/'],
  gold_opened:false,model_calls:0}));
const rows=[];
for(const item of manifest.cases){
  const ordinal=String(item.ordinal).padStart(2,'0');
  need(item.ordinal===rows.length+1 && /^[\w.-]+\/[\w.-]+$/.test(item.repo) &&
    /^[0-9a-f]{40}$/.test(item.failed_commit) &&
    Number.isSafeInteger(item.job_id) && item.job_id>0,'case shape');
  const source=curl(['--head','--output','/dev/null','--write-out','%{http_code}',
    `https://codeload.github.com/${item.repo}/tar.gz/${item.failed_commit}`],1024);
  const source_http=source.body.toString('ascii').trim();
  const page=curl([`https://www.bugswarm.org/artifact-logs/${item.job_id}/`],1024*1024);
  let page_text='';
  try{page_text=new TextDecoder('utf-8',{fatal:true}).decode(page.body);}catch{}
  const page_match=page.exit_code===0 && page.bytes>0 &&
    page_text.includes(`GitHub Actions job ${item.job_id}`) &&
    page_text.includes(`https://github.com/${item.repo}`);
  const log=curl([`https://www.bugswarm.org/artifact-logs/${item.job_id}/raw/`],
    manifest.maximum_log_bytes);
  let log_utf8=false;
  try{new TextDecoder('utf-8',{fatal:true}).decode(log.body);log_utf8=true;}catch{}
  const log_file=`HTTPS-LOG-${ordinal}.txt`;
  if(log.bytes>0)save(log_file,log.body); // Preserve partial attempts for diagnosis.
  const admitted=source.exit_code===0 && source_http==='200' && page_match &&
    log.exit_code===0 && log.bytes>0 && log.bytes<=manifest.maximum_log_bytes && log_utf8;
  const row={schema_version:'are.g01-confirm-preflight-case-r1/v1',ordinal:item.ordinal,
    language:item.language,repo:item.repo,failed_commit:item.failed_commit,job_id:item.job_id,
    source:{...view(source),http_code:source_http},
    page:{...view(page),job_and_repo_match:page_match},
    log:{...view(log),utf8:log_utf8,file:log.bytes>0?log_file:null},admitted};
  save(`CASE-${ordinal}.json`,json(row));
  rows.push(row);
  process.stdout.write(JSON.stringify({ordinal:item.ordinal,source_http,
    page_match,log_exit:log.exit_code,log_bytes:log.bytes,admitted})+'\n');
}
const result={schema_version:'are.g01-confirm-preflight-result-r1/v1',
  attempted:rows.length,admitted:rows.filter(row=>row.admitted).length,
  all_24_admitted:rows.length===24 && rows.every(row=>row.admitted),
  manifest_sha256:expected,model_calls:0,gold_opened:false,rows};
save('PREFLIGHT-RESULT.json',json(result));
process.stdout.write(JSON.stringify({attempted:result.attempted,admitted:result.admitted,
  all_24_admitted:result.all_24_admitted,result_sha256:sha(Buffer.from(json(result)))})+'\n');
if(!result.all_24_admitted)process.exitCode=2;
