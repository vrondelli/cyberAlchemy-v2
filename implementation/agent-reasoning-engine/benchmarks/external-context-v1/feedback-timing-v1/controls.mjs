// Real isolated controls plus symmetric workflow checks. Open questions: PLAN.md.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {checkSyntax,stageView,syntaxProbe,diagnosticView} from './syntax.mjs';
import {phaseFor} from './phases.mjs';
import {tools} from '../holdout-v1/contract.mjs';
import {start,cleanup,docker} from '../success-v1/container.mjs';
import {createWorkflow} from '../success-v1/workflow.mjs';
import {hash} from '../common.mjs';
const root=fileURLToPath(new URL('./',import.meta.url)),read=p=>JSON.parse(readFileSync(root+p));
mkdirSync(root+'controls',{recursive:true});const reports=[];
for(const cell of ['16309-12k','16309-32k','16417-12k','16417-32k']){
 const r=read('../holdout-v1/evidence/'+cell+'/result.json');const w=read('../holdout-v1/evidence/'+cell+'/workflow.json');
 const id=r.candidate_id??w.candidates.at(-1).candidate_id,candidate=read('../holdout-v1/evidence/'+cell+'/'+id+'.json');
 const task=read('tasks/'+r.instance_id+'/task.json'),image=read('tasks/'+r.instance_id+'/image.json');
 const report=checkSyntax({task,image,candidate,out:root+'controls/'+cell});assert.equal(report.status,cell==='16417-32k'?'invalid':'valid');assert(report.cleanup_verified);
 const early=stageView(candidate,report,'early'),delayed=stageView(candidate,report,'delayed');
 assert.deepEqual({...early,syntax:null},{...delayed,syntax:null});assert.equal(delayed.syntax.status,'pending_evaluation');
 if(report.status==='invalid')assert.deepEqual(early.syntax,syntaxProbe(report).syntax);
 const state={hypotheses:[{},{}],candidates:[{candidate_id:id,files:candidate.files,test:null}],probe_requests:0};
 assert(phaseFor(21,state,tools).tools.some(t=>t.function.name==='stage_patch_candidate'));
 assert(phaseFor(21,state,tools).tools.some(t=>t.function.name==='run_public_reproducer'));
 assert(!phaseFor(22,state,tools).tools.some(t=>t.function.name==='stage_patch_candidate'));
 assert.deepEqual(phaseFor(23,state,tools).tools.map(t=>t.function.name),['report_unable']);
 const workflow=createWorkflow();workflow.hypotheses([{},{}]);const {candidate_id:ignored,...staged}=candidate;workflow.stage(staged,new Set(candidate.files.map(f=>f.path)));
 assert.notEqual(workflow.finalize(id).public_test?.status,'passed');
 reports.push({cell,expected:report.status,report_ref:cell+'/report.json',candidate_sha256:hash(candidate),diagnostic_delivery_equal:true,symmetric_revision:true});
}
// A valid but intentionally ineffective edit is scored by the independent private evaluator.
const task_id='sveltejs__svelte-16417',task=read('tasks/'+task_id+'/task.json'),image=read('tasks/'+task_id+'/image.json'),name='are108-negative-'+Date.now();let candidate;
try{
 start(name,image.id);docker(['cp',root+'../success-v1/stage.cjs',name+':/tmp/stage.cjs']);
 const path='packages/svelte/src/compiler/phases/2-analyze/visitors/Attribute.js',source=docker(['exec',name,'cat',path]);
 const old_text=source.slice(0,Math.min(source.length,400));
 candidate=JSON.parse(docker(['exec','-i',name,'node','/tmp/stage.cjs'],JSON.stringify({edits:[{path,old_text,new_text:'// Syntax-valid control; behavior unchanged.\n'+old_text}]})));candidate.candidate_id=hash(candidate);
}finally{cleanup(name);}
writeFileSync(root+'controls/wrong.patch',candidate.patch,{flag:'wx'});
const report=checkSyntax({task,image,candidate,out:root+'controls/wrong-syntax'});assert.equal(report.status,'valid');
execFileSync('python3',[root+'evaluate.py','/home/vrondelli/.cache/are-holdout102/'+task_id,'candidate',root+'controls/wrong-evaluation',root+'tasks/'+task_id,root+'controls/wrong.patch'],{timeout:900000,stdio:['ignore','pipe','pipe']});
const evaluation=read('controls/wrong-evaluation/report.json');assert.equal(evaluation.status,'scored');assert.equal(evaluation.resolved,false);assert(evaluation.cleanup_verified);
writeFileSync(root+'controls/report.json',JSON.stringify({status:'passed',reports,negative_control:{syntax:'valid',resolved:false,evaluation_ref:'wrong-evaluation/report.json'},authority_effect:'none',open_questions_ref:'../PLAN.md'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'passed',syntax_controls:4,negative_behavior_control:true}));
