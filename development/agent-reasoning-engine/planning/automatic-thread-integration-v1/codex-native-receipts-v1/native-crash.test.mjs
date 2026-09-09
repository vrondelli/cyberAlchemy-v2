import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,existsSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runRecovery} from '../codex-host-recovery-v1/supervisor.mjs';
import {fixtureState} from '../codex-host-recovery-v1/fixture-host.mjs';
import {digest} from '../codex-host-recovery-v1/store.mjs';
import {durableNativeHost} from './native-host.mjs';
assert.ok(process.env.ARE_CODEX_SOURCE&&process.env.ARE_JUST_BIN,'explicit isolated native source required');
const results=[];
function saveResult(result){results.push(result);writeFileSync('NATIVE-RECEIPT.json',JSON.stringify({status:results.length===10?'PASS':'running',scenarios:results,paid_model_calls:0,activation:false,crash_method:'native fixture std::process::exit(86), no destructors'},null,2)+'\n');}
for(const fault of [null,'after-open','after-receipt','after-seal','before-step','after-provider']){
 test(`native driver ${fault??'baseline'}`,{timeout:600000},async()=>{
  const directory=mkdtempSync(join(tmpdir(),'are-native-receipts-'));const nativeDir=join(directory,'native');
  const state=fixtureState();state.pending=state.pending.slice(0,4).map(x=>({...x,kind:'provider'}));
  writeFileSync(join(process.cwd(),`NATIVE-${fault??'baseline'}.log`),'');
  const driver=durableNativeHost({directory:nativeDir,binding:digest({state,task:'receipt-test'}),source:process.env.ARE_CODEX_SOURCE,just:process.env.ARE_JUST_BIN,log:join(process.cwd(),`NATIVE-${fault??'baseline'}.log`),fault});
  const input={directory:join(directory,'supervisor'),task_id:'receipt-test',state,host:driver.host};
  const audit=()=>existsSync(join(nativeDir,'fixture-audit.jsonl'))?readFileSync(join(nativeDir,'fixture-audit.jsonl'),'utf8').trim().split('\n').map(JSON.parse):[];
  try{
   await driver.start();
   if(fault){
    await assert.rejects(runRecovery(input),/native-driver-exited/);
    assert.equal(await driver.exitCode(),100);
    assert.deepEqual(audit().filter(x=>x.kind==='intentional-abrupt-exit'),[{kind:'intentional-abrupt-exit',boundary:fault}]);
    await driver.start();
   }
   const result=await runRecovery(input);
   const unknown=['before-step','after-provider'].includes(fault);
   assert.equal(result.status,unknown?'reconcile':'completed');
   const calls=audit().filter(x=>x.kind==='provider'&&x.provider_calls>0);
   assert.equal(calls.length,unknown?(fault==='before-step'?0:1):4);
   assert.equal(new Set(calls.map(x=>x.item_id)).size,calls.length,'no duplicate provider operation');
   if(unknown){
    assert.equal(result.state.completed.length,0);assert.equal(result.generation,0);
    const again=await runRecovery(input);assert.equal(again.status,'reconcile');assert.equal(audit().filter(x=>x.kind==='provider'&&x.provider_calls>0).length,calls.length);
   }else{
    assert.deepEqual(result.state.completed.map(x=>x.id),state.pending.map(x=>x.id));assert.deepEqual(result.state.pending,[]);
    for(const key of ['constraints','facts','lessons'])assert.deepEqual(result.state[key],state[key]);
    const again=await runRecovery(input);assert.equal(again.status,'completed');
   }
   const record={scenario:fault??'baseline',status:'PASS',outcome:result.status,provider_calls:calls.length,completed:result.state.completed.length,generation:result.generation,recycles:result.recycles,abrupt_driver_exits:fault?1:0,duplicate_provider_operations:0};
   saveResult(record);
  }finally{await driver.close();rmSync(directory,{recursive:true,force:true});}
 });
}

for(const boundary of ['corruption','scope-drift','operation-drift','writer-lock']){
 test(`native store rejects ${boundary}`,{timeout:120000},async()=>{
  const directory=mkdtempSync(join(tmpdir(),'are-native-store-'));const nativeDir=join(directory,'native');
  const state=fixtureState();state.pending=state.pending.slice(0,1).map(x=>({...x,kind:'provider'}));
  const log=join(process.cwd(),`NATIVE-${boundary}.log`);writeFileSync(log,'');
  const options={directory:nativeDir,binding:digest({state,task:'binding-test'}),source:process.env.ARE_CODEX_SOURCE,just:process.env.ARE_JUST_BIN,log};
  let driver=durableNativeHost(options), competitor;
  try{
   await driver.start();
   const input={directory:join(directory,'supervisor'),task_id:'binding-test',state,host:driver.host};
   assert.equal((await runRecovery(input)).status,'completed');
   const file=join(nativeDir,'receipts.json');
   if(boundary==='writer-lock'){
    competitor=durableNativeHost(options);await assert.rejects(competitor.start(),/native-driver-start-failed:100/);
    assert.match(readFileSync(log,'utf8'),/native receipt writer busy/);
    assert.equal((await runRecovery(input)).status,'completed');
   }else if(boundary==='operation-drift'){
    const db=JSON.parse(JSON.parse(readFileSync(file,'utf8')).payload);
    const operation=structuredClone(Object.values(db.operations)[0].operation);operation.item.input='changed';
    await assert.rejects(driver.host.lookup(operation),/native-driver-exited:100/);
    assert.match(readFileSync(log,'utf8'),/operation request drift/);
   }else{
    await driver.close();
    if(boundary==='corruption'){
     const envelope=JSON.parse(readFileSync(file,'utf8'));envelope.payload+=' ';writeFileSync(file,JSON.stringify(envelope));
    }
    driver=durableNativeHost({...options,binding:boundary==='scope-drift'?'different-binding':options.binding});
    await assert.rejects(driver.start(),/native-driver-start-failed:100/);
    assert.match(readFileSync(log,'utf8'),boundary==='scope-drift'?/receipt scope drift/:/receipt integrity failed/);
   }
   const events=readFileSync(join(nativeDir,'fixture-audit.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
   assert.equal(events.filter(x=>x.kind==='provider'&&x.provider_calls>0).length,1);
   saveResult({scenario:boundary,status:'PASS',outcome:'rejected-before-additional-provider-dispatch',provider_calls:1});
  }finally{await competitor?.close();await driver.close();rmSync(directory,{recursive:true,force:true});}
 });
}
