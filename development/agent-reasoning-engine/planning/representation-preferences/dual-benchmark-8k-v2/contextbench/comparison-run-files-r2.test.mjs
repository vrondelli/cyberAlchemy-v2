import {spawnSync,execFileSync} from 'node:child_process';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reconcileComparisonRunFiles} from './comparison-run-files-r2.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync,truncateSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:stable(x)).digest('hex');
function fixture(arm='minimal-history'){
 const cell={comparison_arm:arm,cell_id:'fixture-'+arm,instance_id:'fixture',context_limit:8000,limits:{total_tokens:96000,maximum_calls:96,output_cap:1024},provider_profile:{reasoning_effort:'low',token_margin:512}};
 const task={instance_id:'fixture',problem_statement:'Repair the issue'},profile={model:'glm-5.3-flash',reasoning_effort:'low',output_cap:1024};
 const scope={request:task.problem_statement,instance_id:task.instance_id,cell_id:cell.cell_id,cell_sha256:hash(cell)};
 const binding=arm==='current-are'?hash(scope):hash({scope,profile,policy:'independent-native-v1'});
 const prompt=stable({messages:[{role:'user',content:task.problem_statement}],tools:[]});
 const receipt={...profile,kind:'model',dispatched:true,status:200,automatic_retries:0,input_tokens:100,output_tokens:20,reserved_input_tokens:612,request_sha256:hash(bodyForReceipt(prompt,profile))};
 const tokenizer={kind:'tokenizer',dispatched:true,status:200,automatic_retries:0,input_tokens:100,retained_reasoning_reservation:0,retained_reasoning_occurrences:0,request_sha256:hash({model:profile.model,...JSON.parse(prompt)})};
 const index={kind:'index-tokenizer',dispatched:true,status:200,tokens:50,request_sha256:'c'.repeat(64),transport_attempts:[{attempt:1,status:200,response_bytes:20}]};
 const body={version:1,binding,identity:'a'.repeat(64),phase:'idle',model_calls:1,tokenizer_calls:1,receipts:[tokenizer,receipt]};
 const capture={prompt,prompt_sha256:hash(prompt)};
 return {cell,task,result:{instance_id:task.instance_id,cell_id:cell.cell_id,receipts:structuredClone(body.receipts),index_tokenizer_receipts:[index]},ledger:{...body,ledger_digest:hash(body)},expected_identity:body.identity,driver_binding:arm==='current-are'?null:{binding,scope,profile,context_limit:8000,recycle_at:7999,safety_margin:1},events:[{kind:'index-tokenizer',receipt:{...index,status:'started',dispatched:false,transport_attempts:[]}},{kind:'index-tokenizer',receipt:index},arm==='current-are'?{kind:'dispatch-admission',captures:[capture]}:{kind:'request-capture',capture}]};
}

function withFiles(arm,fn){
 const f=fixture(arm),root=mkdtempSync(join(tmpdir(),'comparison-run-files-'));
 try{
  mkdirSync(join(root,'state'));
  const task_sha256='f'.repeat(64);
  Object.assign(f.result,{task_sha256,status:'final_context_selected'});
  const contents={'started.json':{cell:f.cell,task_sha256},'result.json':f.result,'state/glm-transport-ledger.json':f.ledger};
  if(f.driver_binding)contents['state/driver-binding.json']=f.driver_binding;
  for(const [name,value]of Object.entries(contents))writeFileSync(join(root,name),stable(value));
  writeFileSync(join(root,'events.jsonl'),f.events.map(stable).join('\n')+'\n');
  writeFileSync(join(root,'completed.json'),stable({status:f.result.status,result_sha256:hash(readFileSync(join(root,'result.json')))}));
  const names=[...Object.keys(contents),'events.jsonl','completed.json'];
  const expected_files=Object.fromEntries(names.map(name=>[name,hash(readFileSync(join(root,name)))]));
  return fn({root,cell:f.cell,task:f.task,task_sha256,outcome_result:f.result,expected_identity:f.expected_identity,expected_files});
 }finally{rmSync(root,{recursive:true,force:true});}
}
test('loads exact evidence files for all three arms and composes ledger/window checks',()=>{
 for(const arm of ['current-are','minimal-history','independent-investigations'])withFiles(arm,args=>{
  const r=reconcileComparisonRunFiles(args);assert.equal(r.files_verified,true);assert.equal(r.ledger.total_tokens,120);assert.equal(r.windows.requests[0].projected_tokens,1636);assert.equal(r.outer_process_settlement_pending,true);assert.equal(r.benchmark_cleared,false);
 });
});
test('rejects file mutation, outcome substitution, omitted pins and active nested writers',()=>{
 for(const mutate of [a=>writeFileSync(join(a.root,'result.json'),'{}'),a=>a.outcome_result.status='other',a=>delete a.expected_files['events.jsonl'],a=>{mkdirSync(join(a.root,'state/request-1'));writeFileSync(join(a.root,'state/request-1/writer.lock'),'held');}]){
  withFiles('minimal-history',a=>{mutate(a);assert.throws(()=>reconcileComparisonRunFiles(a));});
 }
});
test('rejects symlink evidence and traversal-shaped extra pins',()=>{
 withFiles('minimal-history',a=>{const p=join(a.root,'events.jsonl');rmSync(p);symlinkSync('/etc/passwd',p);assert.throws(()=>reconcileComparisonRunFiles(a),/symlink/);});
 withFiles('minimal-history',a=>{a.expected_files['../outside']='a'.repeat(64);assert.throws(()=>reconcileComparisonRunFiles(a),/exact-file-set/);});
});
test('rehashed file cannot bypass its independent completion binding',()=>{
 withFiles('minimal-history',a=>{const p=join(a.root,'result.json');writeFileSync(p,stable(a.outcome_result)+'\n');a.expected_files['result.json']=hash(readFileSync(p));assert.throws(()=>reconcileComparisonRunFiles(a),/completion-binding/);});
});

test('oversized sparse evidence rejects before allocating or reading its body',()=>{
 withFiles('minimal-history',a=>{
  truncateSync(join(a.root,'events.jsonl'),128*1024*1024+1);
  assert.throws(()=>reconcileComparisonRunFiles(a),/file-size/);
 });
});

test('named-pipe evidence rejects promptly without blocking file open',()=>{
 for(const name of ['started.json','events.jsonl'])withFiles('minimal-history',a=>{
  const path=join(a.root,name);rmSync(path);execFileSync('mkfifo',[path]);
  const moduleUrl=new URL('./comparison-run-files-r2.mjs',import.meta.url).href;
  const source='import {reconcileComparisonRunFiles} from '+JSON.stringify(moduleUrl)+';'+
   'try {reconcileComparisonRunFiles('+JSON.stringify(a)+');process.exitCode=2;}'+
   'catch(e){if(!/file-kind/.test(e.message)){console.error(e.message);process.exitCode=3;}}';
  const child=spawnSync(process.execPath,['--input-type=module'],{input:source,encoding:'utf8',timeout:3000});
  assert.equal(child.error,undefined,'adapter must reject rather than wait for a FIFO writer');
  assert.equal(child.status,0,child.stderr);
 });
});
