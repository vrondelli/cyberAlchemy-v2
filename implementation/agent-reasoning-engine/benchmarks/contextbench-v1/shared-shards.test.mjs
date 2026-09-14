import test from 'node:test';
import assert from 'node:assert/strict';
import {expectedShardCells,selectShardPrefixes} from './shared-shards.mjs';

const matrix={prefixes:Array.from({length:7},(_,i)=>({cell_id:`p${i}`})),branches:Array.from({length:7},(_,i)=>[1,2].map(repetition=>({cell_id:`b${i}-${repetition}`,prefix_cell_id:`p${i}`}))).flat()};

test('task shards are exhaustive, disjoint, and keep branches with their prefix',()=>{
  const shards=Array.from({length:3},(_,shard_index)=>expectedShardCells(matrix,{shard_index,shard_count:3}));
  assert.deepEqual(shards.map(shard=>shard.prefixes.map(row=>row.cell_id)),[['p0','p3','p6'],['p1','p4'],['p2','p5']]);
  assert.equal(new Set(shards.flatMap(shard=>shard.prefixes.map(row=>row.cell_id))).size,7);
  assert.equal(new Set(shards.flatMap(shard=>shard.branches.map(row=>row.cell_id))).size,14);
  for(const shard of shards){const ids=new Set(shard.prefixes.map(row=>row.cell_id));assert.ok(shard.branches.every(row=>ids.has(row.prefix_cell_id)));}
});

test('invalid shard configuration and orphan branches fail closed',()=>{
  assert.throws(()=>selectShardPrefixes(matrix,{shard_index:3,shard_count:3}),/shards.invalid-index/);
  assert.throws(()=>selectShardPrefixes({...matrix,branches:[{cell_id:'bad',prefix_cell_id:'missing'}]},{shard_index:0,shard_count:1}),/shards.orphan-branch/);
});
