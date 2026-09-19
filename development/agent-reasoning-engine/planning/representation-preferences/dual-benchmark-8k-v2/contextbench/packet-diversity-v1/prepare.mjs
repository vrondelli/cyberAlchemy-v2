// Offline archived donor preparation. No credentials, providers, scorer or gold imports.
// Open questions and live gates: PLAN.md and REVIEW.md.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync,realpathSync} from 'node:fs';
import {join,dirname,isAbsolute} from 'node:path';
import {spawnSync} from 'node:child_process';
import {stable,bodyForReceipt,bindDelivery} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {retainedReasoning} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/accounting-v1/accounting.mjs';
import {buildTerminalEvidence,EXPANDED} from './terminal-evidence.mjs';
import {buildPairedPackets} from './paired-packets.mjs';
import {accountReceipts} from '../discovery-v1/run.mjs';
export const hash=value=>createHash('sha256').update(Buffer.isBuffer(value)||typeof value==='string'?value:stable(value)).digest('hex');
const clone=x=>JSON.parse(stable(x));
const read=p=>JSON.parse(readFileSync(p));
const need=(value,reason)=>assert.ok(value,'packet-prepare.'+reason);
const boundRead=(path,bindings)=>{const bytes=readFileSync(path);bindings.push({path,sha256:hash(bytes),bytes:bytes.length});return JSON.parse(bytes);};
export function fixedDonors(config){
 need(config?.tasks?.length===4,'four-tasks-required');need(new Set(config.tasks.map(t=>t.id)).size===4,'distinct-tasks');
 return config.tasks.flatMap((task,index)=>['control','treatment'].map((donor_arm,j)=>({task_id:task.id,donor_arm,donor_index:index*2+j,donor_id:task.id+'-'+donor_arm})));
}
export function extractBoundary({result,ledger,task,cell,bindings=[],donor_id,donor_index=0}){
 need(result?.terminal_evidence_presentations?.length===1&&result?.terminal_evidence_attempts?.length===1,'single-terminal-boundary');
 const attempt=result.terminal_evidence_attempts[0],packet=result.terminal_evidence_presentations[0].packet;
 need(packet?.version===EXPANDED&&packet.status==='ready','expanded-donor');
 const receipt=result.receipts[attempt.receipt_index];
 need(receipt?.kind==='model'&&receipt.status===200&&!receipt.failure_code&&receipt.dispatched===true,'successful-donor-terminal');
 need(hash(receipt)===attempt.receipt_sha256&&receipt.request_sha256===attempt.request_sha256,'terminal-receipt-binding');
 need(attempt.receipt_start_index===attempt.receipt_index,'single-terminal-attempt');
 need(!result.receipts.slice(attempt.receipt_index+1).some(r=>r.kind==='model'),'last-model-boundary');
 const {ledger_digest,...ledgerBody}=ledger;need(hash(ledgerBody)===ledger_digest&&stable(ledger.receipts)===stable(result.receipts),'ledger-integrity');
 need(ledger.phase==='idle','ledger-idle');
 const matches=result.captures.map((c,i)=>({c,i})).filter(({c})=>hash(stable(bodyForReceipt(c.prompt,receipt)))===receipt.request_sha256);
 need(matches.length>0&&new Set(matches.map(({c})=>c.prompt)).size===1,'unique-terminal-wire');
 const terminal=matches[0],wire=JSON.parse(terminal.c.prompt);
 const indices=wire.messages.flatMap((m,i)=>m.role==='user'&&m.content===packet.model.text?[i]:[]);
 need(indices.length===1&&stable(wire.tools)===stable([packet.model.tool]),'packet-and-tool-binding');
 const receipts=clone(result.receipts.slice(0,attempt.receipt_start_index));
 const captures=clone(result.captures.slice(0,terminal.i));
 const delivery=bindDelivery({captures,receipts});need(delivery.unmapped.length===0,'unmapped-prefix');
 const usage=accountReceipts(receipts);need(!usage.unknown_usage&&!usage.rate_limited,'prefix-accounting');
 retainedReasoning(wire.messages,receipts);
 need(cell.context_limit===8000&&cell.limits.output_cap===2048&&cell.limits.maximum_calls===96,'profile-budget');
 need(cell.provider_profile.request_tokenizer_transport_attempts===1&&cell.provider_profile.index_tokenizer_transport_attempts===1,'no-retries');
 need(usage.model_calls<96,'remaining-native-call-capacity');
 return {schema_version:'are.packet-donor/v1',donor_id,donor_index,task:clone(task),cell:clone(cell),bindings:clone(bindings),
  captures,receipts,reads:delivery.read_observations,original_packet:clone(packet),original_prompt:terminal.c.prompt,packet_message_index:indices[0],
  original_terminal_receipt_sha256:hash(receipt),original_terminal_usage:accountReceipts([receipt]),prefix_usage:usage,
  prefix_receipts_sha256:hash(receipts),ledger_identity:ledger.identity,ledger_source_digest:ledger_digest,
  retained_reasoning:retainedReasoning(wire.messages,receipts)};
}
export function loadDonor({config,discovery_root,task_id,donor_arm}){
 const entry=fixedDonors(config).find(d=>d.task_id===task_id&&d.donor_arm===donor_arm);need(entry,'fixed-donor');
 const row=config.tasks.find(t=>t.id===task_id),bindings=[];
 const archivedConfig=boundRead(join(discovery_root,'live-config.json'),bindings);need(stable(archivedConfig)===stable(config),'archived-config-binding');
 boundRead(join(discovery_root,'live-freeze.json'),bindings);
 const fullTask=boundRead(row.task_path,bindings);need(bindings.at(-1).sha256===row.task_sha256,'task-file-hash');
 const task={instance_id:fullTask.instance_id,repo_url:fullTask.repo_url,problem_statement:fullTask.problem_statement,base_commit:fullTask.base_commit};
 need(task.instance_id===row.instance_id&&task.base_commit===row.base_commit&&typeof task.problem_statement==='string','task-source-binding');
 const root=join(discovery_root,'live','pairs',task_id,'run',donor_arm);
 const completed=boundRead(join(root,'completed.json'),bindings),result=boundRead(join(root,'result.json'),bindings);
 need(completed.result_sha256===bindings.at(-1).sha256,'completed-result-binding');
 const ledger=boundRead(join(root,'state','glm-transport-ledger.json'),bindings),started=boundRead(join(root,'started.json'),bindings);
 need(started.task_sha256===row.task_sha256,'started-task-binding');
 const snapshots=readdirSync(join(root,'snapshots')).filter(n=>n.endsWith('.json')).sort().map(n=>boundRead(join(root,'snapshots',n),bindings));
 const donor=extractBoundary({result,ledger,task,cell:started.cell,bindings,...entry});
 return {...donor,repository_cache:row.repository_cache,snapshots,archive_root:root};
}
function git(cache,args,maxBuffer=8388608){
 const r=spawnSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-C',cache,...args],{maxBuffer,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'}});
 need(!r.error&&r.status===0,'git-object-unavailable');return r.stdout;
}
export function restoreVerifiedBase({donor,directory,storage_guard,maximum_bytes=33554432}){
 need(typeof storage_guard==='function'&&!existsSync(directory),'owned-new-base');storage_guard(directory);
 need(/^[a-f0-9]{40}$/.test(donor.task.base_commit),'base-commit');
 const cache=realpathSync(donor.repository_cache),commit=donor.task.base_commit;
 need(git(cache,['rev-parse','--verify',commit+'^{commit}']).toString().trim()===commit,'exact-commit');
 const paths=[...new Set(donor.reads.map(r=>r.path))].sort(),files=[];let bytes=0;
 for(const path of paths){
  need(typeof path==='string'&&!isAbsolute(path)&&!path.includes('\\')&&!path.includes('\0')&&!path.split('/').some(x=>['.','..',''].includes(x)),'safe-path');
  const rows=git(cache,['ls-tree','-z',commit,'--',path]).toString().split('\0').filter(Boolean);
  need(rows.length===1,'one-base-blob');const m=/^(100644|100755) blob ([a-f0-9]{40})\t(.*)$/s.exec(rows[0]);need(m&&m[3]===path,'regular-base-blob');
  const size=Number(git(cache,['cat-file','-s',m[2]]).toString());need(Number.isSafeInteger(size)&&size>=0&&bytes+size<=maximum_bytes,'bounded-source-bytes');
  const body=git(cache,['cat-file','blob',m[2]],Math.max(size+1,1024));need(body.length===size,'blob-size');
  need(createHash('sha1').update(Buffer.from('blob '+size+'\0')).update(body).digest('hex')===m[2],'git-blob-identity');
  new TextDecoder('utf8',{fatal:true}).decode(body);bytes+=size;files.push({path,blob:m[2],sha256:hash(body),bytes:size,body});
 }
 storage_guard(directory);mkdirSync(directory,{recursive:true,mode:0o700});
 for(const file of files){storage_guard(directory);mkdirSync(dirname(join(directory,file.path)),{recursive:true,mode:0o700});writeFileSync(join(directory,file.path),file.body,{flag:'wx',mode:0o600});}
 const manifest={schema_version:'are.packet-base/v1',commit,cache,bytes,files:files.map(({body,...f})=>f)};
 writeFileSync(join(directory,'.packet-base-manifest.json'),stable(manifest),{flag:'wx',mode:0o600});return manifest;
}
export function replacePacket(donor,packet){
 const wire=JSON.parse(donor.original_prompt);need(wire.messages[donor.packet_message_index]?.content===donor.original_packet.model.text,'original-packet-position');
 wire.messages[donor.packet_message_index]={...wire.messages[donor.packet_message_index],content:packet.model.text};wire.tools=[packet.model.tool];return stable(wire);
}
export async function preparePackets({donor,repoRoot,measure_tokens,measure_wire}){
 need(typeof measure_tokens==='function'&&typeof measure_wire==='function','explicit-tokenizers');
 const common={reads:donor.reads,snapshots:donor.snapshots,repoRoot,problem_statement:donor.task.problem_statement,version:EXPANDED,max_handles:32,max_state_bytes:8192,max_state_tokens:2048,measure_tokens};
 const rebuilt=await buildTerminalEvidence(common);need(stable(rebuilt.model)===stable(donor.original_packet.model),'legacy-public-reconstruction');
 const attempts=[];let maximum=32;
 while(maximum>0){
  const pair=await buildPairedPackets({...common,max_handles:maximum});if(!pair.admitted)return {admitted:false,reason:pair.reason,attempts};
  const prompts=Object.fromEntries(['legacy','diversity'].map(v=>[v,replacePacket(donor,pair[v])]));
  const bounds={};for(const v of ['legacy','diversity']){bounds[v]=await measure_wire({variant:v,prompt:prompts[v]});need(Number.isSafeInteger(bounds[v])&&bounds[v]>=0,'measured-wire-bound');}
  attempts.push({matched_handles:pair.matched_handles,bounds,packet_attempts:pair.attempts});
  if(Object.values(bounds).every(n=>n<=8000&&n<donor.cell.recycle_at))return {admitted:true,pair,prompts,attempts,bounds,donor_id:donor.donor_id,donor_bindings:donor.bindings,prefix_receipts_sha256:donor.prefix_receipts_sha256};
  maximum=pair.matched_handles-1;
 }
 return {admitted:false,reason:'paired-full-wire-unfit',attempts};
}
