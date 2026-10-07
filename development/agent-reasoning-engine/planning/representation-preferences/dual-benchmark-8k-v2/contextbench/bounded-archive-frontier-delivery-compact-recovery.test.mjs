import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {bindCompactDelivery} from './bounded-archive-frontier-delivery-r1.mjs';
import {buildCoverageLedger} from './bounded-archive-frontier-ledger-r1.mjs';

const hash=value=>createHash('sha256').update(typeof value==='string'?value:stable(value)).digest('hex');
const archiveSha='a'.repeat(64);
const observation={path:'src/example.cpp',source_sha256:'b'.repeat(64),start_line:7,
  end_line:7,utf8:'return value;',byte_count:13};
const profile={model:'glm-5.3-flash',output_cap:2048,reasoning_effort:'low'};

function fixture(args={archive_sha256:archiveSha,observation_index:0},result={ok:true,
  output:observation,archive_origin:{archive_sha256:archiveSha,observation_index:0}}){
 const call={id:'compact-recovered',type:'function',function:{name:'recover_archived_read',arguments:stable(args)}};
 const prompt=stable({messages:[{role:'assistant',tool_calls:[call]},
   {role:'tool',tool_call_id:call.id,content:stable(result)}],tools:[]});
 return {captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[{...profile,
   kind:'model',dispatched:true,status:200,input_tokens:20,output_tokens:5,
   request_sha256:hash(stable(bodyForReceipt(prompt,profile)))}]};
}

test('successful compact recovery uses archive origin, not absent path arguments',()=>{
 const result=bindCompactDelivery(fixture());
 assert.equal(result.read_observations.length,1);
 assert.equal(result.read_observations[0].path,observation.path);
 assert.deepEqual(result.unmapped,[]);
});

test('recovery origin and full-range assertions remain fail-closed',()=>{
 const forged=fixture(undefined,{ok:true,output:observation,
   archive_origin:{archive_sha256:'c'.repeat(64),observation_index:0}});
 const rejected=bindCompactDelivery(forged);
 assert.equal(rejected.read_observations.length,0);
 assert.equal(rejected.unmapped[0].reason,'recovery.origin-binding');
 assert.throws(()=>bindCompactDelivery(fixture({archive_sha256:archiveSha,
   observation_index:0,path:'wrong.cpp',revision:'base',start_line:7,line_count:1})),
 /recovery.arguments-output-mismatch/);
});

test('coverage ledger accepts archive-bound base revision from compact recovery',()=>{
 const utf8='one\ntwo\nthree\nfour\nfive\nsix\nreturn value;\n';
 const source_sha256=hash(utf8);
 const recovered={...observation,source_sha256,source_revision:'base',
   base_commit:'a'.repeat(40),total_lines:7};
 const input=fixture(undefined,{ok:true,output:recovered,
   archive_origin:{archive_sha256:archiveSha,observation_index:0}});
 const ledger=buildCoverageLedger({...input,snapshots:[{path:recovered.path,source_sha256,utf8}]});
 assert.equal(ledger.entries.length,1);
 assert.equal(ledger.entries[0].source_revision,'base');
 assert.deepEqual(ledger.entries[0].seen_ranges,[[7,7]]);
});
