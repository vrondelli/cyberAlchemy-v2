// Bounded ephemeral storage for ContextBench. Experimental evidence remains in
// the cell root; reconstructible repository checkouts do not.
// Open questions: ../../../../agent-reasoning-engine/research/contextbench-v1/STORAGE-LIFECYCLE-PLAN.md#open-questions
import {createHash} from 'node:crypto';
import {existsSync,lstatSync,readFileSync,readdirSync,rmSync,statfsSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

const GiB=1024**3;
const hash=value=>createHash('sha256').update(value).digest('hex');
const integer=(value,fallback,name)=>{
  if(value===undefined||value==='')return fallback;
  const parsed=Number(value);
  if(!Number.isSafeInteger(parsed)||parsed<0)throw Error(`contextbench.storage.invalid-${name}`);
  return parsed;
};
const availableBytes=path=>{const stat=statfsSync(path);return Number(stat.bavail)*Number(stat.bsize);};

export function countSourceTrees(outRoot){
  if(!existsSync(outRoot))return 0;
  let count=0;
  for(const cell of readdirSync(outRoot,{withFileTypes:true})){
    if(!cell.isDirectory()||cell.name==='sequence')continue;
    for(const name of ['base','work']){
      const path=join(outRoot,cell.name,name);
      if(existsSync(path)&&lstatSync(path).isDirectory()&&!lstatSync(path).isSymbolicLink())count++;
    }
  }
  return count;
}

export function assertStorageCapacity({outRoot,hostRoot=existsSync('/mnt/c')?'/mnt/c':null,
  minimumFreeBytes=integer(process.env.ARE_CONTEXTBENCH_MIN_FREE_BYTES,8*GiB,'minimum-free-bytes'),
  minimumHostFreeBytes=integer(process.env.ARE_CONTEXTBENCH_MIN_HOST_FREE_BYTES,12*GiB,'minimum-host-free-bytes'),
  maximumSourceTrees=integer(process.env.ARE_CONTEXTBENCH_MAX_SOURCE_TREES,32,'maximum-source-trees')}={}){
  const root=resolve(outRoot),free=availableBytes(root),sourceTrees=countSourceTrees(root);
  const hostFree=hostRoot&&existsSync(hostRoot)?availableBytes(hostRoot):null;
  const failures=[];
  if(free<minimumFreeBytes)failures.push('output-free-space');
  if(hostFree!==null&&hostFree<minimumHostFreeBytes)failures.push('host-free-space');
  if(sourceTrees>=maximumSourceTrees)failures.push('active-source-trees');
  const receipt={schema_version:'are.contextbench-storage-guard/v1',status:failures.length?'blocked':'admitted',root,free_bytes:free,
    minimum_free_bytes:minimumFreeBytes,host_root:hostRoot,host_free_bytes:hostFree,minimum_host_free_bytes:minimumHostFreeBytes,
    source_trees:sourceTrees,maximum_source_trees:maximumSourceTrees,failures,authority_effect:'none'};
  if(failures.length){const error=Error(`contextbench.storage.capacity:${failures.join(',')}`);error.receipt=receipt;throw error;}
  return receipt;
}

export function cleanupCellSourceTrees({cellRoot,requireCompleted=true}={}){
  const root=resolve(cellRoot),completed=join(root,'completed.json'),result=join(root,'result.json');
  if(!existsSync(root))return {schema_version:'are.contextbench-cell-storage-cleanup/v1',status:'absent',cell_root:root,removed_source_trees:[],retained_evidence:true,authority_effect:'none'};
  if(requireCompleted&&(!existsSync(completed)||!existsSync(result)))throw Error('contextbench.storage.cleanup-unsealed');
  const resultSha256=existsSync(result)?hash(readFileSync(result)):null,removed=[];
  for(const name of ['base','work']){
    const path=join(root,name);
    if(!existsSync(path))continue;
    const stat=lstatSync(path);
    if(stat.isSymbolicLink()||!stat.isDirectory())throw Error(`contextbench.storage.unsafe-source-tree:${name}`);
    rmSync(path,{recursive:true,force:false});removed.push(name);
  }
  const receipt={schema_version:'are.contextbench-cell-storage-cleanup/v1',status:'complete',cell_root:root,
    completed_present:existsSync(completed),result_sha256:resultSha256,removed_source_trees:removed,retained_evidence:true,authority_effect:'none'};
  const receiptPath=join(root,'storage-cleanup.json');
  if(!existsSync(receiptPath))writeFileSync(receiptPath,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
  return receipt;
}

export function pruneCompletedCellSourceTrees(outRoot){
  const root=resolve(outRoot),receipts=[];
  if(!existsSync(root))return receipts;
  for(const entry of readdirSync(root,{withFileTypes:true})){
    if(!entry.isDirectory()||entry.name==='sequence')continue;
    const cellRoot=join(root,entry.name),completed=join(cellRoot,'completed.json');
    if(!existsSync(completed))continue;
    const status=JSON.parse(readFileSync(completed)).status;
    // A ready prefix remains live until all of its branches have cloned it.
    if(status==='shared_prefix_ready')continue;
    receipts.push(cleanupCellSourceTrees({cellRoot}));
  }
  return receipts;
}
