// Mechanical overlay of the exact pinned VPS ranker. No model or gold input.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('unique-base.arguments');
const source=readFileSync(input,'utf8');
const sha=x=>createHash('sha256').update(x).digest('hex');
if(sha(source)!=='a287d8ceac9bdf2b210b1cf63268560b32da5481c58aee73dae076f7f87885ab')throw Error('unique-base.input-drift');
const before=`if (hints.some(hint => hint.path === candidate.path &&
          candidate.start_line <= hint.end_line + 8)) continue;`;
const after=`if (hints.some(hint => hint.path === candidate.path)) continue;`;
if(source.split(before).length!==2)throw Error('unique-base.anchor-count');
const patched=source.replace(before,after);
writeFileSync(output,patched,{flag:'wx',mode:0o644});
console.log(JSON.stringify({source_sha256:sha(source),overlay_sha256:sha(patched)}));
