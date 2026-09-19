import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {assertSourceSlots} from './source-slots.mjs';
test('nested completed clones count alongside reserved in-flight copies without double counting',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'dual8k-slots-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 for(const id of ['done','active'])for(const arm of ['control','treatment'])for(const name of ['base','work'])await mkdir(join(directory,'pairs',id,'run',arm,name),{recursive:true});
 const args={directory,activeContextIds:new Set(['active']),nextContext:true,maximumSourceTrees:12};
 assert.deepEqual(assertSourceSlots(args),{retained_source_trees:4,reserved_source_trees:8,projected_source_trees:12,maximum_source_trees:12});
 assert.throws(()=>assertSourceSlots({...args,maximumSourceTrees:11}),/nested-source-trees/);
 await rm(join(directory,'pairs','active'),{recursive:true});
 assert.equal(assertSourceSlots(args).projected_source_trees,12,'reservation protects copies not yet created');
 await rm(join(directory,'pairs','done'),{recursive:true});
 assert.equal(assertSourceSlots(args).projected_source_trees,8);
});
test('pairs symlink cannot bypass the owned source tree guard',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'dual8k-links-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 await mkdir(join(directory,'target'));await symlink(join(directory,'target'),join(directory,'pairs'));
 assert.throws(()=>assertSourceSlots({directory}),/unsafe pairs symlink/);
});
