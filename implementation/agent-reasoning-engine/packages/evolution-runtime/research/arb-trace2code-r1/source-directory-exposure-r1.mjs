// Directory identity lower bound only; never opens file contents or selects fresh IDs.
// Open Questions: evidence/G01-SOURCE-DIRECTORY-EXPOSURE-161.json.
import {readdirSync,lstatSync} from 'node:fs';import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const PROJECTS=new Set(['Chart','Cli','Closure','Codec','Collections','Compress','Csv','Gson','JacksonCore','JacksonDatabind','JacksonXml','Jsoup','JxPath','Lang','Math','Mockito','Time']);
const compare=(a,b)=>a<b?-1:a>b?1:0;
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function directoryCaseId(name){
 const m=/^Defects4J-([A-Za-z]+)-([1-9][0-9]{0,4})(?:-(?:checkout|baseline|index))?$/.exec(name);
 return m&&PROJECTS.has(m[1])?'Defects4J-'+m[1]+'-'+m[2]:null;
}
export function collectDirectoryExposure(archives){
 if(!Array.isArray(archives)||archives.length>10000)throw Error('directory-exposure.archive-bound');
 const ids=new Set(),origins=[],unresolved=[],seen=new Set();
 for(const archive of [...archives].sort((a,b)=>compare(a.name,b.name))){
  if(typeof archive.name!=='string'||!/^g0[123]-|^defects4j-/.test(archive.name)||archive.name.includes('/')||seen.has(archive.name))throw Error('directory-exposure.archive-identity');
  seen.add(archive.name);if(!Array.isArray(archive.entries)||archive.entries.length>100000)throw Error('directory-exposure.entry-bound');
  const rows=[...archive.entries].sort((a,b)=>compare(a.name,b.name)),local=new Set();
  for(const row of rows){if(typeof row.name!=='string'||row.name.includes('/')||!['directory','file','symlink','other'].includes(row.kind))throw Error('directory-exposure.entry-identity');
   if(row.kind!=='directory')continue;const id=directoryCaseId(row.name);if(id){ids.add(id);local.add(id);}
   else if(row.name.startsWith('Defects4J-'))unresolved.push({archive:archive.name,entry:row.name,reason:'unrecognized-case-directory'});
  }
  if(local.size)origins.push({archive:archive.name,directory_listing_sha256:sha(rows),case_ids:[...local].sort(compare)});
 }
 return {status:'directory-identity-exposure-lower-bound-only',directories_inspected:archives.length,
  recognized_source_or_episode_archives:origins.length,distinct_prepared_case_ids:ids.size,case_ids:[...ids].sort(compare),origins,unresolved,
  contents_read:0,complete_exposure_union:false,unexposed_count:null,confirmation_selection_allowed:false,
  limitation:'Case-named source/episode directories are conservative prepared exclusions, not proof of provider dispatch. Metadata-only manifests, other ID formats, removed archives, remote records and cross-dataset revision aliases remain unresolved. Do not subtract this lower bound from active supply to assert fresh cases.',
  authority_effect:'none',open_questions_owner:'G01-SOURCE-DIRECTORY-EXPOSURE-161.json'};
}
export function inspectArchiveDirectories(root){
 if(resolve(root)!=='/home/vlad_/are-benchmark-archive')throw Error('directory-exposure.exact-private-root');
 const names=readdirSync(root).filter(n=>/^g0[123]-|^defects4j-/.test(n)).sort(compare),archives=[],skipped=[];
 for(const name of names){const p=join(root,name),stat=lstatSync(p);
  if(!stat.isDirectory()){skipped.push({name,kind:stat.isSymbolicLink()?'symlink':'file-or-other'});continue;}
  const entries=readdirSync(p,{withFileTypes:true}).map(e=>({name:e.name,kind:e.isSymbolicLink()?'symlink':e.isDirectory()?'directory':e.isFile()?'file':'other'}));
  archives.push({name,entries});
 }
 return {observed_at:new Date().toISOString(),archive_root:root,selected_top_level_names:names.length,skipped,...collectDirectoryExposure(archives)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('directory-exposure.no-arguments');
 console.log(JSON.stringify(inspectArchiveDirectories('/home/vlad_/are-benchmark-archive')));
}
