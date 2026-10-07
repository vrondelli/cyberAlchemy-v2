// Exact bounded packet increase on the already-pinned episode overlay.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

const [inputPath,outputPath]=process.argv.slice(2);
if(!inputPath||!outputPath)throw Error('episode-r3.arguments');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
let source=readFileSync(inputPath,'utf8');
if(sha(source)!=='f1019d843b760a0d2610adfdb9e9fc705e745c49d6089792d528e78dfa0bd345')
  throw Error('episode-r3.input-drift');
for(const [before,after] of [
  ['focused_hints.length>4','focused_hints.length>6'],
  ['selected.length>10','selected.length>12'],
  ['deliveredBytes>40960','deliveredBytes>49152'],
  ['up-to-four-focused-reads','up-to-six-focused-reads'],
]){
  if(source.split(before).length!==2)throw Error('episode-r3.anchor-count:'+before);
  source=source.replace(before,after);
}
writeFileSync(outputPath,source,{flag:'wx',mode:0o644});
console.log(JSON.stringify({episode_sha256:sha(source)}));
