// Content-addressed completion-or-capacity prefix cloning for causal branches.
// This module performs local filesystem preparation only; it dispatches no model.
import {createHash} from 'node:crypto';
import {cpSync,existsSync,lstatSync,mkdirSync,readFileSync,readdirSync,readlinkSync,rmSync,writeFileSync} from 'node:fs';
import {basename,join,resolve} from 'node:path';
import {stable} from './delivery.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const excludedRootFiles=new Set(['events.jsonl','started.json','episode.json','result.json','completed.json','prefix-ancestry.json']);

function entries(root,current=''){
  const absolute=join(root,current),rows=[];
  for(const name of readdirSync(absolute).sort()){
    const relative=current?`${current}/${name}`:name;
    if(!current&&excludedRootFiles.has(name))continue;
    const path=join(root,relative),stat=lstatSync(path);
    if(stat.isDirectory())rows.push({path:relative,kind:'directory'},...entries(root,relative));
    else if(stat.isFile())rows.push({path:relative,kind:'file',sha256:hash(readFileSync(path)),bytes:stat.size});
    else if(stat.isSymbolicLink())rows.push({path:relative,kind:'symlink',target:readlinkSync(path)});
    else throw Error(`shared-prefix.unsupported-entry:${relative}`);
  }
  return rows;
}

export function inspectSharedPrefix(prefix_root){
  const root=resolve(prefix_root),resultPath=join(root,'result.json'),completedPath=join(root,'completed.json');
  if(!existsSync(resultPath)||!existsSync(completedPath))throw Error('shared-prefix.result-missing');
  const resultBytes=readFileSync(resultPath),result=JSON.parse(resultBytes),completed=JSON.parse(readFileSync(completedPath));
  if(result.status!=='shared_prefix_ready'||completed.status!=='shared_prefix_ready')throw Error('shared-prefix.status');
  if(completed.result_sha256!==hash(resultBytes))throw Error('shared-prefix.result-integrity');
  if(result.continuation?.schema_version!=='are.contextbench-episode-continuation/v1'||
    !['terminal-candidate','context-pressure','output-pressure'].includes(result.shared_prefix_boundary?.kind)||!Number.isSafeInteger(result.shared_prefix_boundary?.generation)||result.shared_prefix_boundary.generation<0)throw Error('shared-prefix.boundary-missing');
  const checkpoint=JSON.parse(readFileSync(join(root,'state','checkpoint.json')));
  const pending=checkpoint.post_recycle_render_pending;
  if(checkpoint.phase!=='idle'||checkpoint.generation!==result.shared_prefix_boundary.generation||checkpoint.history.length!==result.history.length||checkpoint.start_index!==result.history.length||
    !pending||pending.generation!==checkpoint.generation||pending.start_index!==checkpoint.start_index||pending.history_digest!==result.shared_prefix_boundary.history_digest)throw Error('shared-prefix.checkpoint-state');
  if(hash(stable(checkpoint.history))!==result.shared_prefix_boundary.history_digest||hash(stable(checkpoint.history))!==hash(stable(result.history)))throw Error('shared-prefix.history-state');
  const ledgerPath=join(root,'state','glm-transport-ledger.json');
  if(existsSync(ledgerPath)&&JSON.parse(readFileSync(ledgerPath)).phase!=='idle')throw Error('shared-prefix.transport-state');
  if(existsSync(join(root,'state','writer.lock')))throw Error('shared-prefix.writer-active');
  const manifest=entries(root),tree_digest=hash(stable(manifest));
  return {schema_version:'are.contextbench-shared-prefix-inspection/v1',root,tree_digest,manifest,result_sha256:hash(resultBytes),
    continuation_digest:result.continuation.continuation_digest,boundary:result.shared_prefix_boundary,authority_effect:'none'};
}

export function cloneSharedPrefix({prefix_root,out,branch_id}){
  if(typeof branch_id!=='string'||!/^[a-z0-9][a-z0-9._-]{0,127}$/.test(branch_id))throw Error('shared-prefix.branch-id');
  const source=inspectSharedPrefix(prefix_root),target=resolve(out);
  if(existsSync(target))throw Error('shared-prefix.branch-exists');
  mkdirSync(target,{recursive:true,mode:0o700});
  cpSync(resolve(prefix_root),target,{recursive:true,preserveTimestamps:true,errorOnExist:true,force:false,verbatimSymlinks:true});
  const copied=entries(target),copiedDigest=hash(stable(copied));
  if(copiedDigest!==source.tree_digest){rmSync(target,{recursive:true,force:true});throw Error('shared-prefix.clone-integrity');}
  for(const name of excludedRootFiles)rmSync(join(target,name),{force:true});
  const ancestry={schema_version:'are.contextbench-shared-prefix-ancestry/v1',branch_id,prefix_root:source.root,prefix_tree_digest:source.tree_digest,
    prefix_result_sha256:source.result_sha256,continuation_digest:source.continuation_digest,boundary:source.boundary,authority_effect:'none'};
  writeFileSync(join(target,'prefix-ancestry.json'),JSON.stringify(ancestry,null,2)+'\n',{flag:'wx',mode:0o600});
  return ancestry;
}
