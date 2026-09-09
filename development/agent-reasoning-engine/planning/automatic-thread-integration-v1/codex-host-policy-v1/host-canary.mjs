import {startDecisionService} from './decision-service.mjs';
import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
assert.ok(process.env.ARE_CODEX_SOURCE && process.env.ARE_JUST_BIN, 'explicit isolated source and just paths required');
const peer = await startDecisionService({scope:'fixture-scope',state_digest:'b'.repeat(64),checkpoint_ref:'offline-native-fixture',maximum_output_tokens:32,
 profiles:{'gpt-5.1':{limit_ref:'synthetic-native-fixture-limit',measurement_ref:'synthetic-byte-meter-for-native-host-test',compaction_limit:10_000_000,recycle_at:9_000_000,safety_margin:1000,measure_request:({serialized_body})=>Buffer.byteLength(serialized_body)}}});
try {
 const child=spawn(process.env.ARE_JUST_BIN,['test','-p','codex-core','--test','all','--run-ignored','all','-E','test(context_gate) | test(manual_compact_uses_custom_prompt) | test(auto_compact_runs_after_token_limit_hit)'],{
  cwd:process.env.ARE_CODEX_SOURCE,stdio:'inherit',env:{...process.env,ARE_OFFLINE_TEST_POLICY_ENDPOINT:peer.endpoint,RUSTUP_TOOLCHAIN:'1.95.0'}});
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});
 assert.equal(code,0,'native host canary must pass');
 const decisions=peer.snapshot();
 assert.deepEqual(decisions.map(({kind,action})=>({kind,action})),[{kind:'provider',action:'continue'},{kind:'native_compaction',action:'recycle'}]);
 writeFileSync('HOST-CANARY-RECEIPT.json',JSON.stringify({status:'PASS',scope:'one native Codex task with real ARE Node peer and mock provider',decisions,paid_model_calls:0,automatic_handover:false,activation:false},null,2)+'\n');
} finally {await peer.close();}
