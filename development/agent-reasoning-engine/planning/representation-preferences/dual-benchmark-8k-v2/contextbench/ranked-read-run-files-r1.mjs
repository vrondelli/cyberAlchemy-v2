// Additive ranked-source-hints production candidate. Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
// Exact bounded per-arm evidence loading; no provider/source execution. Open questions: COMPARISON-RUN-FILES-R2.md.
import assert from 'node:assert/strict';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {openSync,closeSync,fstatSync,readSync,lstatSync,realpathSync,readdirSync,constants} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {reconcileComparisonLedger} from './ranked-read-transport-ledger-r1.mjs';
import {reconcileComparisonWindows} from './comparison-window.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(v,m)=>{if(!v)throw Error('comparison-files.'+m);};
export function reconcileComparisonRunFiles({root,cell,task,task_sha256,outcome_result,expected_identity,expected_files}){
 root=resolve(root);need(realpathSync(root)===root&&lstatSync(root).isDirectory(),'canonical-root');
 const names=['source-index.json','started.json','result.json','completed.json','events.jsonl','state/glm-transport-ledger.json',...(cell.comparison_arm==='current-are'?[]:['state/driver-binding.json'])];
 need(expected_files&&typeof expected_files==='object'&&!Array.isArray(expected_files),'expected-files');
 assert.deepEqual(Object.keys(expected_files).sort(),[...names].sort(),'comparison-files.exact-file-set');
 need(/^[a-f0-9]{64}$/.test(task_sha256),'task-hash');
 let bytesRead=0,visited=0;
 function noWriters(path){
  need(++visited<=4096,'state-entry-limit');const stat=lstatSync(path);need(!stat.isSymbolicLink(),'state-symlink');
  need(path.split('/').at(-1)!=='writer.lock','writer-present');
  if(stat.isDirectory())for(const name of readdirSync(path))noWriters(join(path,name));
  else need(stat.isFile(),'state-file-kind');
 }
 noWriters(join(root,'state'));
 const bytes={};
 for(const name of names){
  need(/^[a-f0-9]{64}$/.test(expected_files[name]),'file-hash');let path=root;
  for(const part of name.split('/')){path=join(path,part);need(!lstatSync(path).isSymbolicLink(),'file-symlink');}
  need(lstatSync(path).isFile(),'file-kind');
  const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  try{
   const stat=fstatSync(fd);need(stat.isFile()&&stat.size<=128*1024*1024-bytesRead,'file-size');
   bytesRead+=stat.size;const data=Buffer.alloc(stat.size);let offset=0;
   while(offset<data.length){const n=readSync(fd,data,offset,data.length-offset,offset);need(n>0,'file-short-read');offset+=n;}
   need(fstatSync(fd).size===stat.size&&hash(data)===expected_files[name],'file-integrity');bytes[name]=data;
  }finally{closeSync(fd);}
 }
 const read=name=>JSON.parse(bytes[name].toString('utf8'));
 const started=read('started.json'),result=read('result.json'),completed=read('completed.json');
 assert.deepEqual(started.cell,cell,'comparison-files.started-cell');need(started.task_sha256===task_sha256&&result.task_sha256===task_sha256,'task-binding');
 assert.deepEqual(result,outcome_result,'comparison-files.outcome-result');
 need(completed.result_sha256===expected_files['result.json']&&completed.status===result.status,'completion-binding');
 const lines=bytes['events.jsonl'].toString('utf8').split('\n');if(lines.at(-1)==='')lines.pop();
 need(lines.length<=100000&&lines.every(line=>line.length>0),'journal-shape');const events=lines.map(line=>JSON.parse(line));
 const index=read('source-index.json');
 need(index.schema==='are.ranked-source-worker/v1'&&index.ok===true&&index.model_calls===0&&index.base_commit===task.base_commit,'source-index-identity');
 need(hash(stable({base_commit:index.base_commit,normalizer:index.normalizer,limits:index.index_limits,manifest:index.manifest}))===index.index_digest,'source-index-digest');
 const queries=events.filter(e=>e.kind==='source-index-query');
 need(queries.length>0&&queries.every(e=>e.index_digest===index.index_digest&&e.model_calls===0&&e.settlement?.process_group_absent===true&&e.settlement.forced===false&&e.settlement.exit_code===0&&e.python_settlement?.process_group_absent===true&&e.python_settlement.forced===false&&e.python_settlement.exit_code===0),'source-index-query-settlement');
 const ledger=reconcileComparisonLedger({cell,task,result,ledger:read('state/glm-transport-ledger.json'),expected_identity,driver_binding:cell.comparison_arm==='current-are'?null:read('state/driver-binding.json'),events});
 const windows=reconcileComparisonWindows({receipts:result.receipts,events,token_margin:cell.provider_profile.token_margin,output_cap:cell.limits.output_cap});
 noWriters(join(root,'state'));
 return {schema:'are.comparison-run-file-reconciliation/v1',cell_id:cell.cell_id,files:{...expected_files},bytes_read:bytesRead,ledger,windows,files_verified:true,writer_locks_absent:true,outer_process_settlement_pending:true,campaign_seal_binding_pending:true,benchmark_cleared:false};
}
