// Generalized production-root capacity, preserving frozen JxPath r1.
// Open Questions: evidence/G01-RUNTIME-COVERAGE-PROJECT-CAPACITY-R2.json.
import{createHash}from'node:crypto';import{maskNonCode}from'./java-type-links-dev-r1.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function productionInstrumentation(sources,sourceRoot){
 if(!sourceRoot||sourceRoot.startsWith('/')||sourceRoot.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('instrumentation.source-root');
 const rows=[],classes=new Set(),excludedMetadata=[];
 for(const s of sources.filter(s=>s.path.startsWith(sourceRoot+'/')&&s.path.endsWith('.java')).sort((a,b)=>a.path.localeCompare(b.path))){
  if(sha(s.bytes)!==s.sha256)throw Error('instrumentation.source-sha');
  if(s.path.endsWith('/package-info.java')||s.path.endsWith('/module-info.java')){excludedMetadata.push({path:s.path,source_sha256:s.sha256,reason:'package-or-module-metadata-not-executable-type'});continue;}
  const code=maskNonCode(s.bytes.toString('utf8')),pkg=/\bpackage\s+([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*;/.exec(code)?.[1]??'';
  const relative=s.path.slice(sourceRoot.length+1),slash=relative.lastIndexOf('/'),directory=slash<0?'':relative.slice(0,slash);
  if(directory!==pkg.replaceAll('.','/'))throw Error('instrumentation.package-path');
  const names=[];let cursor=0,depth=0;
  for(const m of code.matchAll(/\b(?:class|interface|enum)\s+([A-Za-z_$][\w$]*)/g)){
   for(;cursor<m.index;cursor++){if(code[cursor]==='{')depth++;else if(code[cursor]==='}')depth--;if(depth<0)throw Error('instrumentation.unbalanced-source');}
   if(depth===0)names.push(pkg?pkg+'.'+m[1]:m[1]);
  }
  if(!names.length)throw Error('instrumentation.no-top-level-type');
  for(const n of names){if(classes.has(n))throw Error('instrumentation.duplicate-type');classes.add(n);}
  rows.push({path:s.path,source_sha256:s.sha256,top_level_classes:names});
 }
 if(!rows.length)throw Error('instrumentation.empty');
 return{source_root:sourceRoot,production_source_files:rows.length,excluded_metadata:excludedMetadata,rows,classes:[...classes].sort(),
  inner_class_policy:'Pinned Project.pm adds each listed top-level class and its $*.class descendants.',
  selection_policy:'Every source-declared top-level type in the full exported production root. No query, stack, fix, label or model filter.'};
}
