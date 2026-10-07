import test from 'node:test';
import assert from 'node:assert/strict';
import {inferActiveComponent,selectComponentPacketReadIds,selectCrossLayerPacketReadIds} from './component-packet-selection.mjs';

const read=(id,path,tool_call_id)=>({id,path,tool_call_id});
const projection=id=>({read_id:id,event_ids:[id],unmapped_current_lines:[]});

test('explicit dotted and typed configuration identify the named component',()=>{
  assert.deepEqual(inferActiveComponent('storage.type: oci'),{group:'storage',variant:'oci',evidence:'explicit-config-type'});
  assert.deepEqual(inferActiveComponent('tracing.jaeger.enabled is inconsistent'),{group:'tracing',variant:'jaeger',evidence:'explicit-dotted-variant'});
  assert.equal(inferActiveComponent('No explicit variant'),null);
});

test('named sibling filter and focused packet use only confirmed projected reads',()=>{
  const observations=[
    read('git','internal/storage/fs/git/source.go','model-git'),
    read('oci','internal/storage/fs/oci/source.go','initial-source-neighbor-3-a'),
    read('bundle','cmd/flipt/bundle.go','initial-source-focused-6-b'),
    read('other','internal/config/storage.go','model-other'),
    read('bad','internal/storage/fs/oci/bad.go','initial-source-focused-7-c'),
  ];
  const projections=observations.map(({id})=>projection(id));
  projections.at(-1).unmapped_current_lines=[7];
  const selected=selectComponentPacketReadIds({task:{problem_statement:'storage.type: oci'},
    model_read_ids:['git','other'],read_observations:observations,source_projection:{projections}});
  assert.deepEqual(selected.final_read_ids,['other','oci','bundle']);
  assert.deepEqual(selected.dropped.map(item=>item.path),['internal/storage/fs/git/source.go']);
  assert.deepEqual(selected.added.map(item=>item.reason),['named-component-packet','focused-packet']);
});

test('without an explicit variant, no sibling filter applies but focused reads remain eligible',()=>{
  const observations=[read('a','src/a.go','model-a'),read('b','src/b.go','initial-source-focused-6-b')];
  const selected=selectComponentPacketReadIds({task:{problem_statement:'Improve configuration'},
    model_read_ids:['a'],read_observations:observations,
    source_projection:{projections:observations.map(({id})=>projection(id))}});
  assert.deepEqual(selected.final_read_ids,['a','b']);
  assert.deepEqual(selected.dropped,[]);
});

test('opt-in cross-layer policy adds only a task-anchored, confirmed view read',()=>{
  const observations=[
    read('server','src/user/settings.js','model-server'),
    read('view','src/views/admin/settings/user.tpl','search-view'),
    read('view-repeat','src/views/admin/settings/user.tpl','search-view-repeat'),
    read('unrelated','public/src/client/chats.js','search-client'),
    read('unmapped','public/src/client/settings.js','search-client'),
  ];
  const projections=observations.map(({id})=>projection(id));
  projections.at(-1).unmapped_current_lines=[10];
  const input={task:{problem_statement:'Users can manage chat settings from their account'},model_read_ids:['server'],read_observations:observations,source_projection:{projections}};
  const selected=selectCrossLayerPacketReadIds(input);
  assert.deepEqual(selected.final_read_ids,['server','view']);
  assert.deepEqual(selected.added.map(item=>item.reason),['task-anchored-cross-layer']);
  assert.deepEqual(selectComponentPacketReadIds(input).final_read_ids,['server']);
});
