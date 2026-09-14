// Deterministic task-level partitioning for independent shared-prefix runs.
// A prefix and all of its branches always remain in one shard.
export function selectShardPrefixes(matrix,{shard_index,shard_count}){
  if(!Number.isSafeInteger(shard_count)||shard_count<1)throw Error('shards.invalid-count');
  if(!Number.isSafeInteger(shard_index)||shard_index<0||shard_index>=shard_count)throw Error('shards.invalid-index');
  if(!Array.isArray(matrix?.prefixes)||!Array.isArray(matrix?.branches))throw Error('shards.invalid-matrix');
  const prefixIds=new Set(matrix.prefixes.map(prefix=>prefix.cell_id));
  if(prefixIds.size!==matrix.prefixes.length)throw Error('shards.duplicate-prefix');
  for(const branch of matrix.branches)if(!prefixIds.has(branch.prefix_cell_id))throw Error('shards.orphan-branch:'+branch.cell_id);
  return matrix.prefixes.filter((_,index)=>index%shard_count===shard_index);
}

export function expectedShardCells(matrix,options){
  const prefixes=selectShardPrefixes(matrix,options),prefixIds=new Set(prefixes.map(prefix=>prefix.cell_id));
  return {prefixes,branches:matrix.branches.filter(branch=>prefixIds.has(branch.prefix_cell_id))};
}
