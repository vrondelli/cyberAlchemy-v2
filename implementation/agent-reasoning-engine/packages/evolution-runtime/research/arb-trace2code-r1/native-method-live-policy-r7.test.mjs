// Frozen offline captures and synthetic boundary failures only, no evaluator labels.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R7.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {nativeFilePredictionR7,providerAdmitted,generationAdmitted} from './native-method-live-policy-r7.mjs';
const root='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r7-20261007',sha=b=>createHash('sha256').update(b).digest('hex');
const campaign=JSON.parse(readFileSync(root+'/RESULT.json'));
test('all32 frozen terminal predictions reconstruct, with no model, label or archive mutation',()=>{
 assert.equal(campaign.rows.length,32);
 for(const row of campaign.rows){const bytes=readFileSync(root+'/'+row.case_id+'-'+row.arm+'/RESULT.json');assert.equal(sha(bytes),row.result_sha256);
  const saved=JSON.parse(bytes),p=nativeFilePredictionR7(saved.result);assert.equal(p.valid,true);assert.equal(p.ranked_files.length,1);
  assert.deepEqual(p.final_read_ids,saved.result.selection.final_read_ids);
 }
});
test('tampered public capture, final IDs and unknown usage cannot become valid predictions',()=>{
 const original=JSON.parse(readFileSync(root+'/Defects4J-Cli-5-baseline/RESULT.json')).result;
 const a=structuredClone(original);a.response_captures.at(-1).public_response.message.tool_calls[0].function.arguments='{}';
 assert.equal(nativeFilePredictionR7(a).valid,false);
 const b=structuredClone(original);b.selection.final_read_ids=['0'.repeat(64)];assert.equal(nativeFilePredictionR7(b).valid,false);
 const c=structuredClone(original);c.receipts[0].input_tokens=null;assert.equal(nativeFilePredictionR7(c).valid,false);
 const d=structuredClone(original);d.method_handle_presentations.at(-1).finalizing=!d.method_handle_presentations.at(-1).finalizing;assert.equal(nativeFilePredictionR7(d).valid,false);
});
test('provider admission rules are unchanged at uncertainty/context/output boundaries',()=>{
 const reply={dispatched:true,status:200,prompt_tokens:400,completion_tokens:20,public_response:{finish_reason:'tool_calls',message:{role:'assistant',tool_calls:[]}}};
 assert.equal(providerAdmitted(reply),true);assert.equal(generationAdmitted(reply,400),true);
 assert.equal(providerAdmitted({...reply,dispatch_uncertain:true}),false);assert.equal(generationAdmitted({...reply,prompt_tokens:7681},7681),false);
 assert.equal(generationAdmitted({...reply,completion_tokens:513},400),false);assert.equal(generationAdmitted({...reply,public_response:{...reply.public_response,finish_reason:'length'}},400),false);
});
