// Trusted preparation adapter. Only tagged buggy Java blobs leave this boundary.
// Open Questions: ../../evidence/G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const sha=b=>createHash('sha256').update(b).digest('hex');
function git(root,args){return execFileSync('git',['-C',root,...args],{maxBuffer:256*1024*1024,stdio:['ignore','pipe','pipe']});}
export function projectFixture({root,output,project,bug,frameworkPin}){
  if(!/^[A-Za-z]+$/.test(project)||!Number.isSafeInteger(bug)||bug<1||!/^[a-f0-9]{40}$/.test(frameworkPin))throw Error('invalid identity');
  root=resolve(root);output=resolve(output);
  if(output===root||output.startsWith(root+'/')||root.startsWith(output+'/'))throw Error('overlapping boundaries');
  const tag=`D4J_${project}_${bug}_BUGGY_VERSION`;
  const head=git(root,['rev-parse','HEAD']).toString().trim();
  if(head!==git(root,['rev-parse',`${tag}^{commit}`]).toString().trim())throw Error('not requested buggy tag');
  if(git(root,['status','--porcelain=v1','--untracked-files=all']).length)throw Error('dirty preparation fixture');
  const entries=git(root,['ls-tree','-r','-z',tag]).toString().split('\0').filter(Boolean).map(entry=>{
    const m=/^(\d+) (\w+) ([a-f0-9]+)\t(.+)$/.exec(entry);if(!m)throw Error('invalid tree entry');
    return {mode:m[1],type:m[2],blob:m[3],path:m[4]};
  }).filter(e=>e.path.endsWith('.java')).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  if(!entries.length)throw Error('no Java source');
  for(const e of entries){
    if(!['100644','100755'].includes(e.mode)||e.type!=='blob'||e.path.startsWith('/')||e.path.includes('\\')||e.path.split('/').some(x=>!x||x==='.'||x==='..'||x==='.git'))throw Error('unsafe Java tree entry');
  }
  // Exclusive destination: no overwrite, merge, symlink-following, or stale corpus.
  mkdirSync(output,{mode:0o700});
  mkdirSync(join(output,'corpus'),{mode:0o700});
  let total=0;const sources=[];
  for(const e of entries){
    const bytes=git(root,['cat-file','blob',e.blob]);total+=bytes.length;
    if(total>256*1024*1024)throw Error('source budget exceeded; incomplete export');
    const destination=join(output,'corpus',e.path);
    mkdirSync(dirname(destination),{recursive:true,mode:0o700});
    writeFileSync(destination,bytes,{flag:'wx',mode:0o600});
    sources.push({path:e.path,bytes:bytes.length,sha256:sha(bytes)});
  }
  const receipt={schema:'are.canonical-buggy-java-projection/v1',complete:true,project,bug,framework_pin:frameworkPin,buggy_tag:tag,buggy_commit:head,
    source_count:sources.length,source_bytes:total,source_tree_sha256:sha(JSON.stringify(sources)),sources,
    boundary:{trusted_preparation_may_read_fixed_patch_gold:true,export:'tracked Java blobs from generated BUGGY_VERSION only',excluded:['git history','fixed tag','patches','build properties','gold metadata','raw framework logs']},
    open_questions_owner:'G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md',
    implementation_sha256:sha(readFileSync(fileURLToPath(import.meta.url)))};
  writeFileSync(join(output,'RECEIPT.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
  return receipt;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length!==7)throw Error('usage: script preparation-root output project bug framework-pin');
  const receipt=projectFixture({root:process.argv[2],output:process.argv[3],project:process.argv[4],bug:Number(process.argv[5]),frameworkPin:process.argv[6]});
  console.log(JSON.stringify({complete:receipt.complete,source_count:receipt.source_count,source_tree_sha256:receipt.source_tree_sha256}));
}
