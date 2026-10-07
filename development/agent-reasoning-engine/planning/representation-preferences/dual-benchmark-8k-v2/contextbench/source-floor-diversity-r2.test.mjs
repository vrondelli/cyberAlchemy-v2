import test from 'node:test';
import assert from 'node:assert/strict';
import {selectSourceFloorDiverse} from './source-floor-diversity-r2.mjs';

const task={instance_id:'fixture',base_commit:'a'.repeat(40),repo_url:'https://example.test/repo.git',
  problem_statement:'Fix match reference in compression context'};
const event=(id,path,line)=>({id,path,body:'match reference',start_line:line,end_line:line,delivered:true});
const events=[event('test','tests/context.sh',1),event('a','lib/compress/codec.c',10),
  event('b','lib/compress/codec.c',11),event('c','lib/compress/codec.c',130),
  event('d','lib/compress/codec.c',260)];
const result={status:'final_context_selected',instance_id:'fixture',native_export:{
  selection:{final_read_ids:['test']},prediction:{instance_id:'fixture',repo_url:task.repo_url,
    commit:task.base_commit,traj_data:{pred_steps:[],pred_files:['tests/context.sh'],
      pred_spans:{'tests/context.sh':[{start:1,end:1}]}}},
  source_projection:{events,projections:events.map(item=>({read_id:item.id,event_ids:[item.id],unmapped_current_lines:[]}))}}};

test('chooses distinct source regions within the eight-handle cap',()=>{
  const {selection,prediction}=selectSourceFloorDiverse({result,task});
  assert.deepEqual(selection.added.map(item=>item.line),[10,130,260]);
  assert.ok(selection.selected_read_ids.length<=8);
  assert.deepEqual(prediction.traj_data.pred_files,['lib/compress/codec.c','tests/context.sh']);
});

test('identity drift fails closed',()=>{
  assert.throws(()=>selectSourceFloorDiverse({result,task:{...task,instance_id:'other'}}),/task-identity/);
});
