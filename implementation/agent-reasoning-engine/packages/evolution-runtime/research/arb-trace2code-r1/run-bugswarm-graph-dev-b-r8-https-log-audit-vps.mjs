#!/usr/bin/env node
// VPS HTTPS byte-match audit. Reads source-only job IDs and hashes, never gold.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root='/opt/are-benchmark-runs/g01-bugswarm-graph-dev-b-r8-https-log-audit';
const manifestName='HTTPS-LOG-AUDIT-MANIFEST-B-R1.json';
const manifestSha='c8a0f5eb17be6deb3f21a5e9e54809fa3aff3d01097dee9e845e78f567f556ee';
const sha=blob=>createHash('sha256').update(blob).digest('hex');
const path=name=>join(root,name);
const save=(name,data)=>writeFileSync(path(name),data,{flag:'wx',mode:0o600});
const json=value=>JSON.stringify(value,null,2)+'\n';
const need=(ok,why)=>{if(!ok)throw Error(`g01-b-https-log-audit.${why}`);};

function run(){
  need(process.argv.length===2 && !existsSync(path('RUN-FREEZE.json')) &&
    !existsSync(path('AUDIT-RESULT.json')),'usage-or-prior-run');
  const manifestData=readFileSync(path(manifestName));
  need(sha(manifestData)===manifestSha,'manifest-drift');
  const manifest=JSON.parse(manifestData);
  need(manifest.cases===24 && manifest.logs.length===24 &&
    manifest.maximum_requests===24 && manifest.automatic_retries===0 &&
    !manifest.gold_opened && !manifest.reserved_confirmation_opened,
    'manifest-shape');
  manifest.logs.forEach((row,i)=>need(row.ordinal===i+1 &&
    Number.isSafeInteger(row.job_id) && row.job_id>0 &&
    /^[0-9a-f]{64}$/.test(row.expected_sha256) &&
    Number.isSafeInteger(row.expected_bytes) && row.expected_bytes>0 &&
    row.expected_bytes<=8*1024*1024,`case:${i+1}`));
  save('RUN-FREEZE.json',json({
    schema_version:'are.g01-bugswarm-graph-dev-b-https-log-freeze-r1/v1',
    manifest_sha256:manifestSha,runner_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),
    endpoint_template:'https://www.bugswarm.org/artifact-logs/{job_id}/raw/',
    transport:'curl HTTPS certificate validation enabled',maximum_requests:24,
    automatic_retries:0,posture:'source-only private provenance audit; no gold or model calls'}));
  const rows=[];
  for(const row of manifest.logs){
    const url=`https://www.bugswarm.org/artifact-logs/${row.job_id}/raw/`;
    const start=Date.now();
    const response=spawnSync('/usr/bin/curl',[
      '--fail','--silent','--show-error','--location','--max-time','45',
      '--proto','=https','--tlsv1.2',url],
      {encoding:null,maxBuffer:8*1024*1024+65536,timeout:50000});
    const body=Buffer.isBuffer(response.stdout)?response.stdout:Buffer.alloc(0);
    const observedSha=sha(body);
    const exact=response.status===0 && body.length===row.expected_bytes &&
      observedSha===row.expected_sha256;
    const num=String(row.ordinal).padStart(2,'0');
    if(response.status===0)save(`HTTPS-LOG-${num}.txt`,body);
    const receipt={schema_version:'are.g01-bugswarm-graph-dev-b-https-log-case-r1/v1',
      ordinal:row.ordinal,id:row.id,job_id:row.job_id,
      expected_sha256:row.expected_sha256,expected_bytes:row.expected_bytes,
      observed_sha256:observedSha,observed_bytes:body.length,
      curl_exit_code:response.status,elapsed_ms:Date.now()-start,
      error_code:response.error?.code??null,exact_match:exact,
      raw_file:response.status===0?`HTTPS-LOG-${num}.txt`:null};
    save(`AUDIT-${num}.json`,json(receipt));
    rows.push(receipt);
    process.stdout.write(JSON.stringify({ordinal:row.ordinal,curl_exit_code:response.status,
      observed_bytes:body.length,exact_match:exact})+'\n');
  }
  const result={schema_version:'are.g01-bugswarm-graph-dev-b-https-log-audit-r1/v1',
    attempted:rows.length,exact_matches:rows.filter(r=>r.exact_match).length,
    all_24_exact:rows.length===24 && rows.every(r=>r.exact_match),
    manifest_sha256:manifestSha,source_side_exported_gold:false,
    reserved_confirmation_opened:false,model_calls:0,rows};
  save('AUDIT-RESULT.json',json(result));
  process.stdout.write(JSON.stringify({attempted:result.attempted,
    exact_matches:result.exact_matches,all_24_exact:result.all_24_exact,
    result_sha256:sha(Buffer.from(json(result)))})+'\n');
  if(!result.all_24_exact)process.exitCode=2;
}

run();
