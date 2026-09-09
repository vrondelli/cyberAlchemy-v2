// Isolated real native owner review, no accepted launch.
// Open questions: T5B-SOURCE-CONTEXT.md#open-questions.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {startNativeConsole} from '../luna-vps/runtime/native-console-server.mjs';
import {compileTask} from '../luna-vps/runtime/task-contract.mjs';
import {startDashboard} from './dashboard-server.mjs';
import {encodeSourceContext,SOURCE_CONTEXT_PREFIX} from '../../runtime/src/features/runs/source-context.ts';
const installed=JSON.parse(readFileSync(process.argv[2])),before=readFileSync(resolve(installed.state,'tasks.json'));
const root=mkdtempSync('/tmp/source-review-'),out=resolve(process.argv[5]);mkdirSync(out,{recursive:true});
const config={...installed,state:resolve(root,'state'),runtime:resolve(root,'runtime'),port:0,max_tasks:1};
let owner,app;
try{
 owner=await startNativeConsole(config);
 const file=resolve(root,'console.json');writeFileSync(file,JSON.stringify({...config,port:Number(new URL(owner.origin).port)}));
 app=await startDashboard({schema_version:'workspace-dashboard-config/v1',console_config:file,driver:resolve(process.argv[3]),static_root:resolve(process.argv[4]),port:0,runtime_id:'source-review-test',controls_enabled:true});
 const post=async(path,body)=>{
  const response=await fetch(app.origin+'/api/v1/workspace/runtimes/source-review-test/native-tasks'+path,{method:'POST',headers:{Origin:app.origin,'X-Workspace-Intent':'native-task','Content-Type':'application/json'},body:JSON.stringify(body)});
  return {status:response.status,value:await response.json()};
 };
 const source={kind:'project',id:'project-test',revision:'snapshot-7',selector:'selected-summary'};
 const input=await encodeSourceContext(source,'Only this explicitly selected text.');
 const task={schema_version:'are-text-task/v1',task_id:'selected-source-review',title:'Source review',instruction:'Summarize the selected text.',input,objective_kind:'understand'};
 const first=await post('/review',{task});assert.equal(first.status,200);assert.equal(first.value.task_digest,compileTask(task).digest);assert.equal(first.value.task.input,input);
 const changed={...task,input:await encodeSourceContext({...source,revision:'snapshot-8'},'Only this explicitly selected text.')};
 const second=await post('/review',{task:changed});assert.equal(second.status,200);
 assert.notEqual(first.value.task_digest,second.value.task_digest);
 const mismatch=await post('/launch',{review_id:first.value.review_id,task_digest:second.value.task_digest});assert.equal(mismatch.status,409);
 assert.equal(owner.snapshot().jobs.length,0);
 const invalid=await post('/review',{task:{...task,input:input.replace('Only this','Changed this')}});assert.equal(invalid.status,400);assert.equal(invalid.value.error,'SOURCE_CONTEXT_INVALID');
 const malformed=await post('/review',{task:{...task,input:SOURCE_CONTEXT_PREFIX+'invalid'}});assert.equal(malformed.status,400);
 const extra=await post('/review',{task,origin:source});assert.equal(extra.status,400);
 assert.equal(owner.snapshot().jobs.length,0);assert.equal(owner.snapshot().fixture_budget_remaining,1);
 assert.deepEqual(readFileSync(resolve(installed.state,'tasks.json')),before);
 writeFileSync(resolve(out,'review.json'),JSON.stringify({status:'PASS',checks:['existing native task schema accepts canonical source envelope','owner digest binds exact selected input','revision changes require a different review digest','old review rejects new revision digest before dispatch','tampered checksum rejected at gateway','malformed envelope rejected at gateway','side-channel origin fields rejected','no jobs created'],reviews:2,rejected_launches:1,accepted_launches:0,installed_history_unchanged:true,external_model_calls:0,open_questions_ref:'T5B-SOURCE-CONTEXT.md#open-questions'},null,2));
 console.log('PASS owner review binds source revision and rejects changed digest; zero dispatches');
}finally{await app?.close();await owner?.close();rmSync(root,{recursive:true,force:true});}
