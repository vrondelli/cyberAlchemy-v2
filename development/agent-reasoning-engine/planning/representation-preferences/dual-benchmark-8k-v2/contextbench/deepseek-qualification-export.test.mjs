import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {exportQualification} from './deepseek-qualification-export.mjs';
import {createDurableTransport} from './deepseek-durable-transport.mjs';
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'dsh-qualification-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const stage=join(root,'runs/1-dsh');mkdirSync(stage,{recursive:true});
 const settlement={slot:{id:'1-dsh',task_id:'contextbench-1',arm:'deepseek-harness-adapted'},harness_exit:1,harness_state:{Running:false},proxy_state:{Running:false}};
 writeFileSync(join(root,'QUALIFICATION-SETTLEMENT.json'),JSON.stringify(settlement));return {root,stage,settlement};
}
test('running process cannot export or create a qualification result',t=>{
 const {root,settlement}=fixture(t);settlement.proxy_state.Running=true;
 writeFileSync(join(root,'QUALIFICATION-SETTLEMENT.json'),JSON.stringify(settlement));
 assert.throws(()=>exportQualification(root),/unsettled-process/);
 assert.equal(existsSync(join(root,'QUALIFICATION-EXPORT.json')),false);
});
test('missing accounting is unknown, never zero spend',t=>{
 const {root}=fixture(t),result=exportQualification(root);
 assert.equal(result.known_total_tokens,null);assert.equal(result.accounting_complete,false);assert.equal(result.valid_export,false);
 assert.throws(()=>exportQualification(root),/EEXIST/);
});
test('paid failure retains known usage even without a native export',async t=>{
 const {root,stage}=fixture(t),transport=join(stage,'transport');mkdirSync(transport);
 const post=async path=>path==='tokenizer'?{status:200,bytes:JSON.stringify({usage:{prompt_tokens:10}})}:{status:200,bytes:'data: '+JSON.stringify({model:'wrong-model',choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:10,completion_tokens:2,total_tokens:12}})+'\n\ndata: [DONE]\n\n'};
 const instance=createDurableTransport({root:transport,post});
 await assert.rejects(instance.process(JSON.stringify({model:'glm-5.3-flash',stream:true,max_tokens:2,messages:[]})),/response-model/);
 await instance.close();const result=exportQualification(root);
 assert.equal(result.known_total_tokens,12);assert.equal(result.model_calls,1);assert.equal(result.unknown_usage_dispatched_requests,0);assert.equal(result.accounting_complete,true);assert.equal(result.valid_export,false);
 assert.equal(JSON.parse(readFileSync(join(root,'QUALIFICATION-EXPORT.json'))).known_total_tokens,12);
});
