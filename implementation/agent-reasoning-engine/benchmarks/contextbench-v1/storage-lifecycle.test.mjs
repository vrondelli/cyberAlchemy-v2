import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,existsSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {assertStorageCapacity,cleanupCellSourceTrees,pruneCompletedCellSourceTrees} from './storage-lifecycle.mjs';

const fixture=fn=>{const root=mkdtempSync(join(tmpdir(),'contextbench-storage-'));try{return fn(root);}finally{rmSync(root,{recursive:true,force:true});}};
const sealed=(root,name,status='final_context_selected')=>{const cell=join(root,name);mkdirSync(join(cell,'base'),{recursive:true});mkdirSync(join(cell,'work'));mkdirSync(join(cell,'state'));writeFileSync(join(cell,'base','large'),'source');writeFileSync(join(cell,'work','large'),'source');writeFileSync(join(cell,'state','evidence.json'),'{}');writeFileSync(join(cell,'result.json'),'{}\n');writeFileSync(join(cell,'completed.json'),JSON.stringify({status})+'\n');return cell;};

test('cleanup removes only reconstructible source trees and retains evidence',()=>fixture(root=>{
  const cell=sealed(root,'cell-1'),receipt=cleanupCellSourceTrees({cellRoot:cell});
  assert.deepEqual(receipt.removed_source_trees,['base','work']);
  assert.equal(existsSync(join(cell,'base')),false);assert.equal(existsSync(join(cell,'work')),false);
  assert.equal(readFileSync(join(cell,'state','evidence.json'),'utf8'),'{}');assert.equal(existsSync(join(cell,'storage-cleanup.json')),true);
}));

test('pruning retains a shared prefix until its branches are complete',()=>fixture(root=>{
  const prefix=sealed(root,'prefix','shared_prefix_ready'),branch=sealed(root,'branch');
  pruneCompletedCellSourceTrees(root);
  assert.equal(existsSync(join(prefix,'base')),true);assert.equal(existsSync(join(branch,'base')),false);
}));

test('capacity guard reports free-space and active-tree failures',()=>fixture(root=>{
  sealed(root,'cell');
  assert.throws(()=>assertStorageCapacity({outRoot:root,hostRoot:null,minimumFreeBytes:Number.MAX_SAFE_INTEGER,maximumSourceTrees:2}),error=>{
    assert.deepEqual(error.receipt.failures,['output-free-space','active-source-trees']);return true;
  });
}));
