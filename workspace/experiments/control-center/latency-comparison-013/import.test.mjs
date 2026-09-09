import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sha} from '../latency-comparison-012/campaign.mjs';
import {protocolBytes} from '../research-learning-owned/runtime/benchmark/analyze.mjs';
import {importArm,verifyArtifacts} from './import.mjs';
const expected={arm:'baseline',pair:1,registration_sha256:'a'.repeat(64),harness_sha256:'b'.repeat(64),binary_sha256:'c'.repeat(64),build_id:'d'.repeat(64),binary_path:'/synthetic/binary',protocol_sha256:sha(protocolBytes),bridge_sha256:'e'.repeat(64),mock_sha256:'f'.repeat(64)};
function fixture(fn){const dir=mkdtempSync(join(tmpdir(),'wlc013-'));const put=(f,v)=>writeFileSync(join(dir,f),JSON.stringify(v));try{
  const host={hostname:'fixture'},observations=[0,1000,2000,3000,4000,5000,5500,6000].map(atMs=>({atMs,normalizedLoad1:0.1,availableMemoryFraction:0.5,cpuPressureAvg10:0,memoryPressureAvg10:0}));
  put('context.json',{...expected,cold_process:true,fresh_storage:true});
  put('host.json',{host,host_sha256:sha(JSON.stringify(host)),protocol_sha256:expected.protocol_sha256,observations,startMs:4500,endMs:6100,errors:[]});
  writeFileSync(join(dir,'native.log'),'fixture log');
  put('closeout.json',{authority_effect:'none',log_sha256:sha('fixture log'),outcome:{code:null,signal:'SIGTERM'}});
  const process={pid:123,start_ticks:'1',boot_id:'fixture',executable:expected.binary_path,binary_sha256:expected.binary_sha256};
  put('receipt.json',{arm:'baseline',registration_sha256:expected.registration_sha256,authority_effect:'none',before:process,after:process,backend:'local-mock-codex-not-live-model',bridge_sha256:expected.bridge_sha256,mock_sha256:expected.mock_sha256,receipt:{authority_effect:'none',expected_identity:expected,phase_export_absent:false,sample:{name:'workspace.tauri.chat-cold-ipc-handshake',durationMs:2,recordedAtUnixMs:100}}});
  put('semantics.json',{statuses:Array(8).fill(true),inactiveDisconnect:false,replayError:'chat connection is not active'});put('trace.json',[]);put('readiness.json',[]);
  fn(dir,put);
}finally{rmSync(dir,{recursive:true,force:true});}}
test('complete evidence imports and binds every consumed file',()=>fixture(dir=>{const r=importArm(dir,expected);assert.equal(r.status,'completed');assert.equal(Object.keys(r.artifacts).length,8);verifyArtifacts([r]);}));
test('raw changes after import fail revalidation',()=>fixture(dir=>{const r=importArm(dir,expected);writeFileSync(join(dir,'native.log'),'changed');assert.throws(()=>verifyArtifacts([r]),/artifact-drift/);}));
test('identity, semantics, missing closeout and log drift reject',()=>{for(const mutate of [(dir,put)=>put('semantics.json',{}),(dir,put)=>put('context.json',{...expected,pair:2}),(dir)=>rmSync(join(dir,'closeout.json')),(dir)=>writeFileSync(join(dir,'native.log'),'wrong')])fixture((dir,put)=>{mutate(dir,put);assert.throws(()=>importArm(dir,expected));});});
test('prelaunch rejection imports no timing and preserves reasons',()=>fixture((dir,put)=>{for(const f of ['native.log','closeout.json','receipt.json'])rmSync(join(dir,f));const host=JSON.parse(readFileSync(join(dir,'host.json')));host.observations=host.observations.slice(0,5);delete host.startMs;delete host.endMs;host.observations[0].cpuPressureAvg10=50;put('host.json',host);const r=importArm(dir,expected);assert.equal(r.status,'host-rejected');assert.equal(r.samples,undefined);assert.ok(r.prelaunch_reasons.includes('host-unqualified:cpuPressureAvg10'));}));
test('recorded failure remains failure on contaminated host',()=>fixture((dir,put)=>{put('failure.json',{error:'driver failed'});const r=importArm(dir,expected);assert.equal(r.status,'failed');assert.equal(r.error,'driver failed');}));
test('symlink outside run directory is rejected',()=>fixture(dir=>{rmSync(join(dir,'host.json'));symlinkSync('/proc/version',join(dir,'host.json'));assert.throws(()=>importArm(dir,expected),/artifact-path-escape/);}));
