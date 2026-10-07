// Standalone history closure and unchanged all32 interface behavior, no providers/labels.
// Open Questions: evidence/G01-COMPACT-METHOD-TERMINAL-R4B.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {requireCertainReceiptHistory,buildMethodHandleTable,selectMethodHandleSubmission} from './compact-method-terminal-r4b.mjs';
import {buildMethodHandleTable as oldBuild} from './compact-method-terminal-r4.mjs';
const root='/home/vlad_/are-benchmark-archive/g01-compact-method-terminal-r4-20261007';
const sha=b=>createHash('sha256').update(b).digest('hex'),campaign=JSON.parse(readFileSync(root+'/RESULT.json'));
test('every uncertain history entry, including earlier model or tokenizer, stops before alias creation',()=>{
 const saved=JSON.parse(readFileSync(root+'/Defects4J-Cli-5-baseline.json'));
 const receipts=structuredClone(saved.receipts);receipts[0].dispatch_uncertain=true;
 const messages=JSON.parse(saved.captures.at(-1).prompt).messages.filter(m=>!m.content?.includes('method_terminal_handles'));
 // Reproduces the unguarded native binding gap without generating or normalizing any model response.
 assert.equal(oldBuild({captures:saved.captures,receipts,messages}).bindings.length,1);
 assert.throws(()=>buildMethodHandleTable({captures:saved.captures,receipts,messages}),/uncertain-history-stop/);
 assert.throws(()=>selectMethodHandleSubmission({...saved,receipts}),/uncertain-history-stop/);
 assert.throws(()=>requireCertainReceiptHistory([{kind:'tokenizer',dispatched:false,dispatch_uncertain:true}]),/uncertain-history-stop/);
});
test('unknown spent model usage fails closed even on earlier rejected or unconfirmed generations',()=>{
 for(const status of [200,503])assert.throws(()=>requireCertainReceiptHistory([{kind:'model',dispatched:true,status,input_tokens:null,output_tokens:20}]),/unknown-history-usage-stop/);
 assert.doesNotThrow(()=>requireCertainReceiptHistory([{kind:'model',dispatched:false,status:null,input_tokens:null,output_tokens:null}]));
 assert.throws(()=>requireCertainReceiptHistory(null),/receipt-history-required/);
});
test('guarded selector preserves all32 frozen actual-source interface selections and source receipts',()=>{
 assert.equal(campaign.rows.length,32);
 for(const row of campaign.rows){const bytes=readFileSync(root+'/'+row.case_id+'-'+row.arm+'.json');assert.equal(sha(bytes),row.result_sha256);
  const saved=JSON.parse(bytes);assert.deepEqual(selectMethodHandleSubmission(saved),saved.selection);
 }
});
