import test from 'node:test';
import assert from 'node:assert/strict';
import {selectSourceFloor} from './source-floor-selection-r1.mjs';

const task={instance_id:'fixture',base_commit:'a'.repeat(40),repo_url:'https://example.test/repo.git',
  problem_statement:'Fix first match reference in compression context'};
const event=(id,path,body,line)=>({id,path,body,start_line:line,end_line:line,delivered:true});
const events=[event('test','tests/context.sh','context',1),
  event('a','lib/compress/codec.c','match reference',10),
  event('b','lib/compress/codec.c','input',11),
  event('c','lib/compress/codec_internal.h','reference',2)];
const result={status:'final_context_selected',instance_id:'fixture',native_export:{
  selection:{final_read_ids:['test']},prediction:{instance_id:'fixture',repo_url:task.repo_url,
    commit:task.base_commit,traj_data:{pred_steps:[],pred_files:['tests/context.sh'],
      pred_spans:{'tests/context.sh':[{start:1,end:1}]}}},
  source_projection:{events,projections:events.map(item=>({read_id:item.id,event_ids:[item.id],unmapped_current_lines:[]}))}}};

test('adds bounded implementation reads while preserving model selection',()=>{
  const {prediction,selection}=selectSourceFloor({result,task});
  assert.deepEqual(prediction.traj_data.pred_files,[
    'lib/compress/codec.c','lib/compress/codec_internal.h','tests/context.sh']);
  assert.equal(selection.added.length,3);
  assert.equal(selection.original_read_ids[0],'test');
});

test('unmapped source reads are excluded',()=>{
  const copy=structuredClone(result);
  copy.native_export.source_projection.projections[1].unmapped_current_lines=[10];
  const {selection}=selectSourceFloor({result:copy,task});
  assert.ok(!selection.added.some(item=>item.read_id==='a'));
});

test('identity drift is rejected',()=>{
  assert.throws(()=>selectSourceFloor({result,task:{...task,instance_id:'other'}}),/task-identity/);
});
