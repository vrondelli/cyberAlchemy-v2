import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {adaptVisible,prepareTasks} from './adapter.mjs';
const read=p=>JSON.parse(readFileSync(join(import.meta.dirname,p)));
test('selection is source-bound four strata across eight disjoint personas',()=>{
 const s=read('selection.json');assert.equal(s.tasks.length,8);assert.equal(new Set(s.tasks.map(x=>x.persona_id)).size,8);assert.deepEqual(s.gaps,[]);
 for(const split of ['development','reserved'])assert.equal(new Set(s.tasks.filter(t=>t.split===split).map(t=>t.stratum)).size,4);
 for(const t of s.tasks.filter(t=>t.stratum==='do-not-remember'))assert.ok(t.do_not_remember_grounding.length);
});
test('adapter preserves every admissible source turn and exact query; removes only oracle system',()=>{
 for(const t of [...prepareTasks(),...prepareTasks({split:'reserved'})]){
  const v=read('visible/'+t.task_id.split(':')[1]+'.json');
  assert.deepEqual(t.messages,[...v.history.chat_history.filter(x=>x.role!=='system').map(x=>({role:x.role,content:x.content})),v.query]);
  assert.equal(t.metadata.removed.length,1);assert.ok(t.messages.every(x=>Object.keys(x).sort().join(',')==='content,role'));assert.equal(t.treatment_projection,null);
 }
});
test('visible adapter cannot consume evaluator labels or changed oracle metadata',()=>{
 const fixture={history:{chat_history:[{role:'system',content:'You are an AI assistant helping a user with the following persona: SECRET'},{role:'user',content:'hello'},{role:'assistant',content:'hi'}]},query:{role:'user',content:'what next?'},correct_answer:'GOLD',preference:'GOLD'};
 const out=adaptVisible(fixture);assert.ok(!JSON.stringify(out.messages).includes('SECRET'));assert.ok(!JSON.stringify(out.messages).includes('GOLD'));
 assert.throws(()=>adaptVisible({...fixture,history:{chat_history:[{role:'system',content:'unknown'}]}}));
 assert.throws(()=>adaptVisible({...fixture,history:{chat_history:[{role:'user',content:[{type:'image'}]}]}}));
});
test('measured admission uses provider counts and blocks all development tasks without truncation',()=>{
 const a=read('context-admission.json');assert.equal(a.rows.length,4);assert.ok(a.rows.every(x=>x.input_tokens>x.input_limit&&x.status==='blocked-overlength'));assert.equal(a.model_calls,0);
 for(const x of a.rows){const id=x.task_id.replaceAll(':','-')+'-full-history-v1';const r=read('preflight/'+id+'-receipt.json');assert.equal(x.input_tokens,r.usage.prompt_tokens);assert.equal(x.request_sha256,r.request_sha256);assert.equal(r.kind,'tokenizer');assert.equal(r.ok,true);}
});
