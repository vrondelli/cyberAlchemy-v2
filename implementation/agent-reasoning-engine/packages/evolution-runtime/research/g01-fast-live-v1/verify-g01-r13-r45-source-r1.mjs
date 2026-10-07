// Provider-free qualification of the prospective r45 reliability source.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join, relative} from 'node:path';
import {pathToFileURL} from 'node:url';

const base='/opt/are/evolution-runtime';
const oldRoot=join(base,'g01-source-r13-prospective-r44');
const newRoot=join(base,'g01-source-r13-prospective-r45');
const evidenceRoot=join(base,'g01-r13-r45-source-qualification-r1');
const sealedRoot=join(base,'g01-product-replication-r13/typescript-material-7958c8a7/control/runs/00');
const ledgerRel='development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-ledger-r1.mjs';
const testRel='development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-delivery-compact-recovery.test.mjs';
const node='/opt/cyberalchemy-are-tools/node-24.10.0/node';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(ok,reason)=>{if(!ok)throw Error(`g01-r45-source.${reason}`);};

async function main(){
  need(process.argv.length===3&&process.argv[2]==='--verify','arguments');
  const {bindSourceTree}=await import(pathToFileURL(join(newRoot,
    'implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs')).href);
  const before=bindSourceTree(oldRoot),after=bindSourceTree(newRoot);
  need(before.file_count===412&&before.tree_sha256==='034458ba51cf7b8b00873fda75f9d1c126f623e5ca0154bbef72388d7770f484'&&
    after.file_count===412&&after.tree_sha256==='f4a9a90677ccc71cc2353e056b2af56ee470013579015d34eb3578bdfd374173','source-tree');
  const prior=new Map(before.sources.map(row=>[relative(oldRoot,row.path),row.sha256]));
  const changed=after.sources.filter(row=>prior.get(relative(newRoot,row.path))!==row.sha256)
    .map(row=>relative(newRoot,row.path)).sort();
  need(changed.join() === [ledgerRel,testRel].sort().join(),'exact-delta');

  const tests=after.sources.filter(row=>row.path.endsWith('.test.mjs')).map(row=>row.path).sort();
  const nodeRun=spawnSync(node,['--test',...tests],{cwd:newRoot,encoding:'utf8',timeout:180000,maxBuffer:16*1024*1024});
  need(!nodeRun.error&&nodeRun.status===0&&nodeRun.signal===null,'node-process');
  const count=label=>Number(nodeRun.stdout.match(new RegExp(`(?:^|\\n)(?:#|ℹ)\\s+${label}\\s+(\\d+)(?:\\n|$)`))?.[1]);
  need(tests.length===19&&count('tests')===105&&count('pass')===105&&count('fail')===0,'node-tests');
  const pyRoot=join(newRoot,'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench');
  const pyRun=spawnSync('/usr/bin/python3',['-m','unittest','-v','test_ranked_source_worker_r2','test_ranked_source_hints_r3'],
    {cwd:pyRoot,encoding:'utf8',timeout:180000,maxBuffer:16*1024*1024,
      env:{...process.env,PATH:`/opt/cyberalchemy-are-tools/node-24.10.0:${process.env.PATH??''}`}});
  need(!pyRun.error&&pyRun.status===0&&pyRun.signal===null&&/Ran 27 tests/.test(pyRun.stderr)&&/\nOK\n/.test(pyRun.stderr),'python-tests');

  const eventBytes=readFileSync(join(sealedRoot,'events.jsonl'));
  const resultBytes=readFileSync(join(sealedRoot,'result.json'));
  need(sha(eventBytes)==='e2258b56c7066bcefe89a25d3ce500f3dda49a5fdd461cd1019195999a7da506'&&
    sha(resultBytes)==='d8588f8efe7a17401248c37efe4dbf9744d1439b506d5be77f57a83b7eb9a93b','sealed-inputs');
  const captures=eventBytes.toString('utf8').trimEnd().split('\n').map(JSON.parse)
    .filter(row=>row.kind==='request-capture').map(row=>row.capture);
  const result=JSON.parse(resultBytes);
  const snapshots=readdirSync(join(sealedRoot,'snapshots')).filter(name=>name.endsWith('.json'))
    .sort().map(name=>JSON.parse(readFileSync(join(sealedRoot,'snapshots',name))));
  need(captures.length===12&&result.receipts?.length===35&&snapshots.length===5,'replay-shape');
  const inputs={captures,receipts:result.receipts,snapshots};
  const oldLedger=await import(pathToFileURL(join(oldRoot,ledgerRel)).href);
  const newLedger=await import(pathToFileURL(join(newRoot,ledgerRel)).href);
  let oldError=null;
  try{oldLedger.buildCoverageLedger(inputs);}catch(error){oldError=String(error.message);}
  need(oldError==='frontier.revision-arguments','old-failure');
  const repaired=newLedger.buildCoverageLedger(inputs);
  need(repaired.schema_version==='are.receipt-coverage-ledger/v1'&&repaired.entries.length===6,'new-ledger');

  const receipt={schema_version:'are.g01-r13-r45-source-qualification/v1',
    status:'source-qualified-not-campaign-frozen',old_source_tree_sha256:before.tree_sha256,
    source_tree_sha256:after.tree_sha256,source_root:newRoot,file_count:after.file_count,
    changed_relative_paths:changed,node_version:process.version,node_test_files:tests.length,
    node_tests:count('tests'),node_pass:count('pass'),node_fail:count('fail'),
    node_stdout_sha256:sha(nodeRun.stdout),node_stderr_sha256:sha(nodeRun.stderr),
    python_version:pyRun.stderr.match(/Python \d+\.\d+\.\d+/)?.[0]??null,
    python_tests:27,python_pass:27,python_stderr_sha256:sha(pyRun.stderr),
    sealed_events_sha256:sha(eventBytes),sealed_control_result_sha256:sha(resultBytes),
    old_failure:oldError,new_ledger_entries:repaired.entries.length,
    script_sha256:sha(readFileSync(import.meta.filename)),model_calls:0,gold_loaded:false,
    claim_ceiling:'Prospective source reliability only; r13 terminal, no new campaign, score, or superiority'};
  mkdirSync(evidenceRoot,{recursive:true,mode:0o700});
  const bytes=Buffer.from(JSON.stringify(receipt,null,2)+'\n');
  writeFileSync(join(evidenceRoot,'SOURCE-QUALIFICATION.json'),bytes,{flag:'wx',mode:0o600});
  console.log(JSON.stringify({status:receipt.status,source_tree_sha256:after.tree_sha256,
    node_tests:count('tests'),python_tests:27,new_ledger_entries:repaired.entries.length,
    receipt_sha256:sha(bytes)}));
}
main().catch(error=>{console.error(JSON.stringify({status:'verify-error',error:String(error.message)}));process.exitCode=2;});
