#!/usr/bin/env node
// Independently reconstruct every Git tree object in the fresh r24 labels.
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const base='/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/fresh-r11';
const output=join(base,'evaluator-only/TREE-OBJECT-AUDIT-R26.json');
const pins={compare:'133021b31e5ad504e24b98dc28f3d6d4279e38bae9fac639dde71564473f136c',
  tree:'5c44b28a6c5e4defa6afdaa605f694653cb7cd25b5ab8df3468445b0a25676d2'};
const sha256=data=>createHash('sha256').update(data).digest('hex');
const sha1=data=>createHash('sha1').update(data).digest('hex');
const need=(ok,why)=>{if(!ok)throw Error(`g01-fresh-r26.${why}`)};
const comparePath=join(base,'evaluator-only/github-compare-r23/LABEL-RESULT.json');
const treePath=join(base,'evaluator-only/github-tree-r24/TREE-RESULT.json');
need(!existsSync(output) && sha256(readFileSync(comparePath))===pins.compare &&
  sha256(readFileSync(treePath))===pins.tree,'input-or-output-drift');
const compare=JSON.parse(readFileSync(comparePath,'utf8')).results;
const trees=JSON.parse(readFileSync(treePath,'utf8')).results;
need(compare.length===24 && trees.length===24,'denominator');

function objectHash(children){
  const ordered=[...children].sort((a,b)=>Buffer.compare(
    Buffer.from(a.name+(a.type==='tree'?'/':'')),
    Buffer.from(b.name+(b.type==='tree'?'/':''))));
  const content=Buffer.concat(ordered.map(item=>Buffer.concat([
    Buffer.from(item.mode.replace(/^0+/,'')+' '+item.name+'\0'),
    Buffer.from(item.sha,'hex')])));
  return sha1(Buffer.concat([Buffer.from(`tree ${content.length}\0`),content]));
}

const rows=[];
for(let ordinal=1;ordinal<=24;ordinal++){
  const num=String(ordinal).padStart(2,'0');
  const c=compare[ordinal-1],t=trees[ordinal-1];
  need(c.ordinal===t.ordinal && c.ordinal===ordinal && c.id===t.id &&
    c.failed_sha===t.failed_sha && c.passed_sha===t.passed_sha &&
    c.gold_admissible && t.complete_tree,'identity:'+num);
  const compareBytes=readFileSync(join(base,`evaluator-only/github-compare-r23/COMPARE-${num}.json`));
  const treeBytes=readFileSync(join(base,`evaluator-only/github-tree-r24/TREE-${num}.json`));
  need(sha256(compareBytes)===c.response_sha256 &&
    sha256(treeBytes)===t.response_sha256,'response-pin:'+num);
  const doc=JSON.parse(compareBytes),remote=JSON.parse(treeBytes);
  const last=doc.commits?.at(-1);
  need(doc.base_commit?.sha===c.failed_sha && last?.sha===c.passed_sha &&
    /^[0-9a-f]{40}$/.test(last.commit?.tree?.sha) &&
    remote.sha===c.passed_sha && remote.truncated===false &&
    Array.isArray(remote.tree),'commit-or-tree:'+num);
  const byParent=new Map([['',[]]]),directories=new Map(),seen=new Set();
  let blobs=0,submodules=0;
  for(const item of remote.tree){
    need(typeof item.path==='string' && item.path.length>0 &&
      !item.path.startsWith('/') && !item.path.includes('\\') &&
      !item.path.split('/').some(part=>part===''||part==='.'||part==='..') &&
      !seen.has(item.path) && /^[0-9a-f]{40}$/.test(item.sha) &&
      /^[0-7]{6}$/.test(item.mode),'entry-shape:'+num);
    seen.add(item.path);
    need((item.type==='tree' && item.mode==='040000') ||
      (item.type==='blob' && ['100644','100755','120000'].includes(item.mode)) ||
      (item.type==='commit' && item.mode==='160000'),'entry-type:'+num);
    const slash=item.path.lastIndexOf('/');
    const parent=slash<0?'':item.path.slice(0,slash);
    const name=slash<0?item.path:item.path.slice(slash+1);
    if(!byParent.has(parent))byParent.set(parent,[]);
    byParent.get(parent).push({...item,name});
    if(item.type==='tree')directories.set(item.path,item.sha);
    else if(item.type==='blob')blobs++;
    else submodules++;
  }
  for(const [path,expected] of directories){
    need(byParent.has(path) && objectHash(byParent.get(path))===expected,
      'subtree-hash:'+num);
  }
  for(const path of byParent.keys()){
    need(path===''||directories.has(path),'missing-parent:'+num);
  }
  const rootHash=objectHash(byParent.get(''));
  need(rootHash===last.commit.tree.sha,'root-hash:'+num);
  rows.push({ordinal,id:c.id,failed_sha:c.failed_sha,passed_sha:c.passed_sha,
    expected_root_tree_sha:last.commit.tree.sha,reconstructed_root_tree_sha:rootHash,
    entries:remote.tree.length,subtrees:directories.size,blobs,submodules,
    compare_response_sha256:c.response_sha256,tree_response_sha256:t.response_sha256,
    all_tree_objects_matched:true});
  process.stdout.write(JSON.stringify({ordinal,entries:remote.tree.length,
    subtrees:directories.size,matched:true})+'\n');
}
const result={schema_version:'are.g01-fresh-r26-git-tree-object-audit/v1',
  posture:'private evaluator-only independent SHA-1 tree reconstruction; no gold export',
  input_sha256:pins,script_sha256:sha256(readFileSync(fileURLToPath(import.meta.url))),
  cases:24,all_root_and_subtree_hashes_matched:rows.every(row=>row.all_tree_objects_matched),
  total_entries:rows.reduce((sum,row)=>sum+row.entries,0),
  total_subtrees:rows.reduce((sum,row)=>sum+row.subtrees,0),rows};
const encoded=Buffer.from(JSON.stringify(result,null,2)+'\n');
writeFileSync(output,encoded,{flag:'wx',mode:0o600});
process.stdout.write(JSON.stringify({cases:24,total_entries:result.total_entries,
  total_subtrees:result.total_subtrees,all_matched:result.all_root_and_subtree_hashes_matched,
  result_sha256:sha256(encoded)})+'\n');
