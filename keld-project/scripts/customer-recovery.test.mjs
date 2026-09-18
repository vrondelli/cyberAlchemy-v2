import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {setupCustomerProfile} from './setup-customer-profile.mjs';
import {customerFixture} from './customer-fixture.mjs';
import {createCodexAppServerWrapper} from '../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs';
const engineRoot=resolve(import.meta.dirname,'../../..');

for(const [name,bytes] of [['partial JSON','{"event":'],['invalid record','{}\n'],['blank record','\n']]){
  test(`persistent customer startup refuses ${name} without changing the ledger`,async()=>{
    const root=mkdtempSync(resolve(tmpdir(),'keld-recovery-'));
    try{
      const {loaded}=await setupCustomerProfile({engineRoot,projectRoot:root,input:{...customerFixture(root),persistent_state:true}});
      const path=resolve(root,'.are-keld/reasoning-state.jsonl');
      writeFileSync(path,bytes);
      const before=readFileSync(path);
      assert.throws(()=>createCodexAppServerWrapper({loaded_profile:loaded.value,decision_profile:loaded.decision_profile,
        definition_catalog:loaded.definition_catalog,ontology_snapshot:loaded.ontology_snapshot,
        source_snapshot:loaded.source_snapshot,context_source_provider:loaded.context_source_provider}),/Reasoning state recovery failed/);
      assert.deepEqual(readFileSync(path),before);
    }finally{rmSync(root,{recursive:true,force:true})}
  });
}

test('killed customer wrapper leaves an internal lock requiring reconciliation',async()=>{
  const {spawn,spawnSync}=await import('node:child_process');
  const {once}=await import('node:events');
  const root=mkdtempSync(resolve(tmpdir(),'keld-crash-'));
  let child;
  try{
    const {loaded}=await setupCustomerProfile({engineRoot,projectRoot:root,input:{...customerFixture(root),persistent_state:true}});
    const {createReasoningStateLedger,createAppendOnlyFileReasoningStateSink}=await import('../../implementation/agent-reasoning-engine/packages/reasoning-state-runtime/index.mjs');
    const seeded=createReasoningStateLedger({ledger_id:loaded.value.reasoning_state.ledger_id,sink:createAppendOnlyFileReasoningStateSink({path:resolve(root,'.are-keld/reasoning-state.jsonl')})});
    const event=seeded.append({event_kind:'request-interpreted',content:{request_id:'customer-checkpoint'}});
    const epoch=seeded.seal({event_digests:[event.event.event_digest]});
    seeded.checkpoint({checkpoint_kind:'manual',epoch:epoch.value});seeded.close();
    const setupUrl=new URL('./setup-customer-profile.mjs',import.meta.url).href;
    const wrapperUrl=new URL('../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs',import.meta.url).href;
    const script=`import {loadCustomerProfile} from ${JSON.stringify(setupUrl)};
      import {createCodexAppServerWrapper} from ${JSON.stringify(wrapperUrl)};
      const l=await loadCustomerProfile(process.argv[1],process.argv[2]);
      createCodexAppServerWrapper({loaded_profile:l.value,decision_profile:l.decision_profile,definition_catalog:l.definition_catalog,ontology_snapshot:l.ontology_snapshot,source_snapshot:l.source_snapshot,context_source_provider:l.context_source_provider});
      console.log('ready');setInterval(()=>{},1000);`;
    child=spawn(process.execPath,['--input-type=module','-e',script,engineRoot,root],{stdio:['ignore','pipe','pipe']});
    const abort=AbortSignal.timeout(10000);
    const [data]=await once(child.stdout,'data',{signal:abort});
    assert.match(data.toString(),/ready/);
    const liveCheck=spawnSync('python3',[resolve(import.meta.dirname,'reconcile-customer-state.py'),engineRoot,root],{encoding:'utf8',timeout:30000});
    assert.notEqual(liveCheck.status,0);
    assert.match(liveCheck.stderr,/Writer PID exists/);
    const exit=once(child,'exit');child.kill('SIGKILL');await exit;
    const lock=resolve(root,'.are-keld/reasoning-state.jsonl.writer.lock');
    const before=readFileSync(lock);
    assert.throws(()=>createCodexAppServerWrapper({loaded_profile:loaded.value,decision_profile:loaded.decision_profile,
      definition_catalog:loaded.definition_catalog,ontology_snapshot:loaded.ontology_snapshot,
      source_snapshot:loaded.source_snapshot,context_source_provider:loaded.context_source_provider}),/reasoning.writer-lock-held/);
    assert.deepEqual(readFileSync(lock),before);
    const tool=resolve(import.meta.dirname,'reconcile-customer-state.py');
    const run=(...args)=>spawnSync('python3',[tool,engineRoot,root,...args],{encoding:'utf8',timeout:30000});
    const inspected=run();
    assert.equal(inspected.status,0,inspected.stderr);
    const digest=JSON.parse(inspected.stdout).lock_sha256;
    const missingConfirm=run('--expected-lock-sha256',digest);
    assert.notEqual(missingConfirm.status,0);
    assert.deepEqual(readFileSync(lock),before);
    const drift=run('--expected-lock-sha256','0'.repeat(64),'--confirm-local-stopped-writer');
    assert.notEqual(drift.status,0);
    const log=resolve(root,'.are-keld/reasoning-state.jsonl');
    const original=readFileSync(log);
    const lines=original.toString().trimEnd().split('\n');
    writeFileSync(log,lines.slice(0,-1).join('\n')+'\n');
    const incomplete=run('--expected-lock-sha256',digest,'--confirm-local-stopped-writer');
    assert.notEqual(incomplete.status,0);
    assert.match(incomplete.stderr,/reasoning.log-uncheckpointed-tail/);
    writeFileSync(log,'{"torn":');
    const corrupt=run('--expected-lock-sha256',digest,'--confirm-local-stopped-writer');
    assert.notEqual(corrupt.status,0);
    assert.match(corrupt.stderr,/Ledger not recoverable/);
    assert.deepEqual(readFileSync(lock),before);
    writeFileSync(log,original);
    const applied=run('--expected-lock-sha256',digest,'--confirm-local-stopped-writer');
    assert.equal(applied.status,0,applied.stderr);
    const report=JSON.parse(applied.stdout);
    assert.equal(report.status,'lock-reconciled');
    assert.deepEqual(readFileSync(resolve(report.backup,'.are-keld', 'reasoning-state.jsonl.writer.lock')),before);
    assert.deepEqual(readFileSync(log),original);
    const restarted=createCodexAppServerWrapper({loaded_profile:loaded.value,decision_profile:loaded.decision_profile,
      definition_catalog:loaded.definition_catalog,ontology_snapshot:loaded.ontology_snapshot,
      source_snapshot:loaded.source_snapshot,context_source_provider:loaded.context_source_provider});
    restarted.close();
  }finally{
    if(child&&child.exitCode===null&&child.signalCode===null){const exit=once(child,'exit');child.kill('SIGKILL');await exit}
    rmSync(root,{recursive:true,force:true});
  }
});
