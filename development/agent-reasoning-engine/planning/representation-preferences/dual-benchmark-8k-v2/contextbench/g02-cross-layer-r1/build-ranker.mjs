// Add the source-only cross-layer hint extension to the pinned G02 ranker.
// The output is a new snapshot; frozen predecessors are never rewritten.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

const [basePath,helperPath,outputPath]=process.argv.slice(2);
if(!basePath||!helperPath||!outputPath)throw Error('g02-cross-layer-ranker.arguments');
const source=readFileSync(basePath,'utf8');
const digest=createHash('sha256').update(source).digest('hex');
if(digest!=='08faef36066f4d8f7dfcfad0ebb6c543135c45ca0466b9ca33adbbd7416ada30')throw Error('g02-cross-layer-ranker.source-drift');
const importAnchor="import {createRankedSourceAcquisition as createBase,rankSourcesTool} from './ranked-source-acquisition-base.mjs';";
const bodyAnchor="  const summary='Deterministic pinned-base leads, including unique-path and source-neighborhood candidates; not evidence. '+";
if(source.split(importAnchor).length!==2||source.split(bodyAnchor).length!==2)throw Error('g02-cross-layer-ranker.anchor-drift');
let helper=readFileSync(helperPath,'utf8');
for(const line of ["import {execFileSync} from 'node:child_process';\n","import {lstatSync,readFileSync,realpathSync} from 'node:fs';\n","import {basename,dirname,join,isAbsolute} from 'node:path';\n"]){
  if(helper.split(line).length!==2)throw Error('g02-cross-layer-ranker.helper-drift');
  helper=helper.replace(line,'');
}
helper=helper.replace('export function selectCrossLayerSourceHints','function selectCrossLayerSourceHints');
if(helper.includes('\nimport ')||helper.includes('export function '))throw Error('g02-cross-layer-ranker.helper-unhandled');
const extended=source.replace(importAnchor,importAnchor+'\n'+helper)
  .replace("import {readFileSync,lstatSync} from 'node:fs';","import {readFileSync,lstatSync,realpathSync} from 'node:fs';")
  .replace("import {join} from 'node:path';","import {basename,dirname,join,isAbsolute} from 'node:path';")
  .replace(bodyAnchor,"  for(const hint of selectCrossLayerSourceHints({root:options.root,problem_statement:options.problem_statement,existingPaths:[...focusedSeen],maximum:Math.min(4,Math.max(0,6-focused_source_hints.length))})){\n    if(focusedSeen.has(hint.path))continue;\n    focused_source_hints.push(hint);focusedSeen.add(hint.path);\n  }\n"+bodyAnchor);
writeFileSync(outputPath,extended,{flag:'wx',mode:0o644});
console.log(JSON.stringify({base_sha256:digest,helper_sha256:createHash('sha256').update(readFileSync(helperPath)).digest('hex'),output_sha256:createHash('sha256').update(extended).digest('hex')}));
