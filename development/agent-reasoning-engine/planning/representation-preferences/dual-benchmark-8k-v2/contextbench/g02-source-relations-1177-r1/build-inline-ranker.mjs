// Mechanical inlining for the read-only pinned snapshot: no new mountpoint.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

const [rankerPath,helperPath,outputPath]=process.argv.slice(2);
if(!rankerPath||!helperPath||!outputPath)throw Error('inline-ranker.arguments');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
let ranker=readFileSync(rankerPath,'utf8'),helper=readFileSync(helperPath,'utf8');
if(sha(ranker)!=='833ddb56b23fb215bc9bf66708be8229d353addabfd0c711234222dcd9f6826a'||
  sha(helper)!=='1d4a385cbc03b79ece0ba9508153a634bf5d49253cbadd8a98166e08c81fc23f')
  throw Error('inline-ranker.input-drift');
const importLine="import {selectDeprecationClosureHints,selectNamedConfigurationImplementationHints,selectSourceRelationshipHints} from './source-relationship-hints.mjs';\n";
if(ranker.split(importLine).length!==2)throw Error('inline-ranker.import-count');
helper=helper.replace(/^\/\/[^\n]*\n\/\/[^\n]*\n/,'')
  .replace("import {execFileSync} from 'node:child_process';\n",'')
  .replace("import {lstatSync,readFileSync} from 'node:fs';\n",'')
  .replace("import {join} from 'node:path';\n",'')
  .replaceAll('export function ','function ');
if(helper.includes('\nimport ')||helper.includes('export function '))throw Error('inline-ranker.unhandled-helper');
ranker=ranker.replace(importLine,helper+'\n');
writeFileSync(outputPath,ranker,{flag:'wx',mode:0o644});
console.log(JSON.stringify({ranker_sha256:sha(ranker),helper_sha256:sha(readFileSync(helperPath))}));
