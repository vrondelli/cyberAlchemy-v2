import {readFileSync,existsSync,realpathSync} from 'node:fs';
import {join,sep} from 'node:path';
import {sha} from '../latency-comparison-012/campaign.mjs';
import {assess,prelaunchReasons} from '../latency-comparison-011/host.mjs';
import {verifyProcess} from '../latency-comparison-004/process-identity.mjs';
import {verifySemantics} from '../latency-comparison-005/semantics.mjs';
const ensure=(v,m)=>{if(!v)throw Error(m);};
export function importArm(dir,expected){
  const root=realpathSync(dir),artifacts={};
  const bytes=name=>{const path=realpathSync(join(root,name));ensure(path.startsWith(root+sep),'artifact-path-escape');const data=readFileSync(path);artifacts[path]=sha(data);return data;};
  const json=name=>JSON.parse(bytes(name));
  const context=json('context.json'),host=json('host.json');
  ensure(context.arm===expected.arm&&context.pair===expected.pair&&context.registration_sha256===expected.registration_sha256&&context.harness_sha256===expected.harness_sha256,'context-mismatch');
  ensure(context.binary_sha256===expected.binary_sha256&&context.build_id===expected.build_id&&context.cold_process===true&&context.fresh_storage===true,'launch-context');
  ensure(host.protocol_sha256===expected.protocol_sha256&&host.host_sha256===sha(JSON.stringify(host.host)),'host-identity');
  const base={arm:expected.arm,run_id:root,protocol_sha256:expected.protocol_sha256,host,artifacts};
  if(!existsSync(join(root,'closeout.json'))){
    ensure(!existsSync(join(root,'native.log'))&&!existsSync(join(root,'receipt.json'))&&!existsSync(join(root,'failure.json')),'missing-closeout');
    const reasons=[...prelaunchReasons(host.observations),...(host.errors??[])];
    ensure(reasons.length>0,'unproven-prelaunch-rejection');
    return {...base,status:'host-rejected',prelaunch_reasons:reasons};
  }
  const closeout=json('closeout.json');
  ensure(closeout.authority_effect==='none'&&closeout.log_sha256===sha(bytes('native.log')),'closeout-log');
  ensure(closeout.outcome&&(closeout.outcome.code===0||['SIGTERM','SIGKILL'].includes(closeout.outcome.signal)),'closeout-outcome');
  if(existsSync(join(root,'failure.json'))){const failure=json('failure.json');ensure(typeof failure.error==='string'&&failure.error.length>0,'failure-contract');return {...base,status:'failed',error:failure.error};}
  const receipt=json('receipt.json'),semantics=json('semantics.json');
  bytes('trace.json');bytes('readiness.json');
  ensure(receipt.arm===expected.arm&&receipt.registration_sha256===expected.registration_sha256&&receipt.authority_effect==='none','receipt-identity');
  ensure(receipt.backend==='local-mock-codex-not-live-model'&&receipt.bridge_sha256===expected.bridge_sha256&&receipt.mock_sha256===expected.mock_sha256,'backend-identity');
  ensure(Number.isSafeInteger(receipt.before?.pid)&&receipt.before.pid>0&&typeof receipt.before.start_ticks==='string'&&typeof receipt.before.boot_id==='string','process-contract');
  ensure(verifyProcess(receipt.before,receipt.after,{path:expected.binary_path,sha256:expected.binary_sha256}),'process-identity');
  ensure(verifySemantics(semantics),'semantic-mismatch');
  const aggregate=receipt.receipt;
  ensure(aggregate?.authority_effect==='none'&&aggregate.expected_identity?.arm===expected.arm&&aggregate.expected_identity?.build_id===expected.build_id&&aggregate.expected_identity?.binary_sha256===expected.binary_sha256,'aggregate-identity');
  ensure(aggregate.phase_export_absent===(expected.arm==='uninstrumented'),'export-posture');
  ensure(aggregate.sample?.name==='workspace.tauri.chat-cold-ipc-handshake'&&Number.isFinite(aggregate.sample.durationMs)&&aggregate.sample.durationMs>=0&&Number.isFinite(aggregate.sample.recordedAtUnixMs)&&aggregate.sample.recordedAtUnixMs>0,'aggregate-contract');
  const qualification=assess(host.observations,host.startMs,host.endMs,host.errors??[]);
  return {...base,status:qualification.qualified?'completed':'host-rejected',binary_sha256:expected.binary_sha256,build_id:expected.build_id,cold_process:true,fresh_storage:true,semantics,samples:[aggregate.sample.durationMs]};
}
export function verifyArtifacts(results){
  for(const result of results){if(result.status==='not-run')continue;ensure(result.artifacts&&Object.keys(result.artifacts).length>0,'artifact-bindings-missing');for(const [path,digest] of Object.entries(result.artifacts))ensure(sha(readFileSync(path))===digest,'artifact-drift:'+path);}
}
