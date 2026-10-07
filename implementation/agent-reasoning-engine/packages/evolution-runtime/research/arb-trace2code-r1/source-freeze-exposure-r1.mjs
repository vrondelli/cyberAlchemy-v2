// Conservative FREEZE identity census, never a fresh-case admission decision.
// Open Questions: evidence/G01-SOURCE-FREEZE-EXPOSURE-169.json.
import {readFileSync,readdirSync,lstatSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';
import {directoryCaseId,inspectArchiveDirectories} from './source-directory-exposure-r1.mjs';
const sort=(a,b)=>a<b?-1:a>b?1:0;
const sha=x=>createHash('sha256').update(x).digest('hex');
export function freezeCaseIdentity(row){
 if(typeof row==='string')row={case_id:row};
 if(!row||typeof row!=='object'||Array.isArray(row))return {posture:'unresolved',reason:'case-row-shape'};
 let id=null,coordinate=null;
 if(row.case_id!==undefined){
  if(typeof row.case_id!=='string')return {posture:'unresolved',reason:'case-id-type'};
  id=directoryCaseId(row.case_id);
  if(!id&&row.case_id.startsWith('Defects4J-'))return {posture:'unresolved',reason:'unrecognized-defects4j-id'};
 }
 if(row.project!==undefined||row.bug!==undefined){
  const bug=typeof row.bug==='number'&&Number.isSafeInteger(row.bug)?String(row.bug):row.bug;
  if(typeof row.project!=='string'||typeof bug!=='string'||!/^([1-9][0-9]{0,4})$/.test(bug))return {posture:'unresolved',reason:'project-bug-shape'};
  coordinate=directoryCaseId('Defects4J-'+row.project+'-'+bug);
  if(!coordinate)return {posture:'unresolved',reason:'project-bug-namespace'};
 }
 if(id&&coordinate&&id!==coordinate)return {posture:'unresolved',reason:'case-coordinate-conflict'};
 if(id||coordinate)return {posture:'recognized-prepared-exclusion',case_id:id??coordinate};
 return {posture:row.case_id===undefined?'unresolved':'other-namespace',reason:row.case_id===undefined?'no-supported-identity':'not-defects4j'};
}
export function freezeIdentityProjection(manifest){
 if(!manifest||typeof manifest!=='object'||Array.isArray(manifest))throw Error('freeze-exposure.manifest-shape');
 // Do not inspect free-form source, query, output, label or provider fields.
 const arrays=['cases','completed_public_cells','captures'];const ids=new Set(),unresolved=[];let rows=0,otherNamespaces=0,found=false;
 if(manifest.case_id!==undefined||manifest.project!==undefined||manifest.bug!==undefined){
  found=true;rows++;const result=freezeCaseIdentity(manifest);
  if(result.case_id)ids.add(result.case_id);else if(result.posture==='other-namespace')otherNamespaces++;else unresolved.push({field:'root-identity',reason:result.reason});
 }
 for(const field of arrays){if(manifest[field]===undefined)continue;found=true;
  if(!Array.isArray(manifest[field])||manifest[field].length>100000){unresolved.push({field,reason:'identity-array-shape-or-cap'});continue;}
  for(const [ordinal,row]of manifest[field].entries()){
   rows++;const result=freezeCaseIdentity(row);
   if(result.case_id)ids.add(result.case_id);else if(result.posture==='other-namespace')otherNamespaces++;else unresolved.push({field,ordinal,reason:result.reason});
  }
 }
 return {case_ids:[...ids].sort(sort),identity_rows:rows,other_namespace_rows:otherNamespaces,unresolved,
  supported_identity_array_present:found};
}
export function inspectFreezeExposure(root){
 if(resolve(root)!=='/home/vlad_/are-benchmark-archive'||realpathSync(root)!==root)throw Error('freeze-exposure.exact-private-root');
 const directory=inspectArchiveDirectories(root),ids=new Set(directory.case_ids),manifests=[],unresolved=[],coverageGaps=[];
 const names=readdirSync(root).filter(n=>/^g0[123]-|^defects4j-/.test(n)).sort(sort);
 for(const name of names){
  const dir=join(root,name),d=lstatSync(dir);if(!d.isDirectory()||d.isSymbolicLink()){coverageGaps.push({archive:name,reason:'not-real-directory'});continue;}
  const entries=readdirSync(dir),path=join(dir,'FREEZE.json');
  if(!entries.includes('FREEZE.json')){coverageGaps.push({archive:name,reason:'no-top-level-FREEZE',metadata_names:entries.filter(n=>/^(?:[A-Z0-9-]*FREEZE|SOURCE-ONLY-MANIFEST|COHORT-CANDIDATE|INPUT-RECEIPT|ARCHIVE-MANIFEST|MANIFEST|FIXTURES|INPUTS|SCREEN)\.json$/.test(n)).sort(sort)});continue;}
  const st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink()||st.size>2*1024*1024){coverageGaps.push({archive:name,reason:'manifest-file-shape-or-byte-cap'});continue;}
  const bytes=readFileSync(path);let projection;
  try{projection=freezeIdentityProjection(JSON.parse(bytes));}catch{coverageGaps.push({archive:name,reason:'manifest-parse-or-shape'});continue;}
  for(const id of projection.case_ids)ids.add(id);
  manifests.push({archive:name,path,manifest_sha256:sha(bytes),...projection});
  for(const issue of projection.unresolved)unresolved.push({archive:name,...issue});
  if(!projection.supported_identity_array_present)coverageGaps.push({archive:name,reason:'no-supported-identity-array'});
 }
 return {status:'directory-and-freeze-prepared-exclusion-lower-bound',observed_at:new Date().toISOString(),archive_root:root,
  directory_case_count:directory.case_ids.length,distinct_prepared_case_ids:ids.size,case_ids:[...ids].sort(sort),
  directory_only_case_ids:directory.case_ids.filter(id=>!manifests.some(m=>m.case_ids.includes(id))),
  newly_identified_manifest_case_ids:[...ids].filter(id=>!directory.case_ids.includes(id)).sort(sort),
  directory_origins:directory.origins,manifests,unresolved,coverage_gaps:coverageGaps,
  provider_calls:0,reference_label_reads:0,complete_exposure_union:false,confirmation_selection_allowed:false,unexposed_count:null,
  limitation:'Prepared freezes and directories are exclusions, not proof of provider dispatch. Other manifest schemas, external/removed archives and cross-dataset revision aliases are unresolved. No current fresh-case count or selection authorized.',
  authority_effect:'none',open_questions_owner:'G01-SOURCE-FREEZE-EXPOSURE-169.json'};
}
