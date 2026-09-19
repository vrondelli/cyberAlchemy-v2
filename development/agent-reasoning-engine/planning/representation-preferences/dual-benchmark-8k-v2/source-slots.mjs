// Bound nested disposable clones plus in-flight reservations. Open questions: PLAN.md.
import {existsSync,lstatSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
export function assertSourceSlots({directory,activeContextIds=new Set(),nextContext=false,maximumSourceTrees=32}){
 if(!Number.isSafeInteger(maximumSourceTrees)||maximumSourceTrees<1)throw Error('invalid source-tree limit');
 const pairs=join(directory,'pairs');let retained=0;
 if(existsSync(pairs)&&lstatSync(pairs).isSymbolicLink())throw Error('unsafe pairs symlink');
 if(existsSync(pairs))for(const pair of readdirSync(pairs,{withFileTypes:true})){
  if(pair.isSymbolicLink())throw Error('unsafe pair symlink');
  if(!pair.isDirectory()||activeContextIds.has(pair.name))continue;
  const run=join(pairs,pair.name,'run');if(!existsSync(run))continue;
  if(lstatSync(run).isSymbolicLink())throw Error('unsafe run symlink');
  for(const arm of ['control','treatment']){
   const cell=join(run,arm);if(!existsSync(cell))continue;
   if(lstatSync(cell).isSymbolicLink())throw Error('unsafe cell symlink');
   for(const name of ['base','work']){const path=join(cell,name);if(!existsSync(path))continue;
    const stat=lstatSync(path);if(stat.isSymbolicLink()||!stat.isDirectory())throw Error('unsafe source tree');retained++;
   }
  }
 }
 // A ContextBench pair owns at most two clones for each of its two sequential arms.
 const reserved=4*(activeContextIds.size+Number(nextContext)),projected=retained+reserved;
 if(projected>maximumSourceTrees)throw Error('contextbench.storage.capacity:nested-source-trees');
 return {retained_source_trees:retained,reserved_source_trees:reserved,projected_source_trees:projected,maximum_source_trees:maximumSourceTrees};
}
