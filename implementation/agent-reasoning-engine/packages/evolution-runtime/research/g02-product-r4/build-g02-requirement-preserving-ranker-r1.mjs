// Version a generic requirement-preservation and span-precision instruction.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync,unlinkSync,writeFileSync} from 'node:fs';

const [sourcePath,helperPath,outputPath]=process.argv.slice(2);
if(!sourcePath||!helperPath||!outputPath)throw Error('requirement-ranker.arguments');
const apiBuilder='/opt/are/evolution-runtime/build-g02-api-contract-ranker-r1.mjs';
const sha=data=>createHash('sha256').update(data).digest('hex');
const need=(value,reason)=>{if(!value)throw Error('requirement-ranker.'+reason);};
need(sha(readFileSync(apiBuilder))==='1f33f5b237cfb49a3ef6b59f31f63037b1dc732008c9b782fc8a45a900d0069a','api-builder-drift');
const intermediate=outputPath+'.api-contract-predecessor';
const built=spawnSync('/opt/cyberalchemy-are-tools/node-24.10.0/node',
  [apiBuilder,sourcePath,helperPath,intermediate],{encoding:'utf8'});
need(built.status===0,'api-builder-failed:'+built.stderr?.slice(-250));
const original=readFileSync(intermediate,'utf8');
need(sha(original)==='c5ed4b1ddbf29fff95a80db129da11727d711a2306ac42d1602a6190e3c5a582','api-ranker-drift');
const anchor="    'For a public API migration, deprecation or backward-compatibility issue, search production consumers of named classes and constants, read likely affected callers at the pinned base, and tie each selected file to a specific issue requirement; abstain from unrelated exact-name matches. '+";
need(original.split(anchor).length===2,'instruction-anchor');
const preservation="    'For issues with several distinct requirements, keep a compact requirement-to-file check before final selection. Adding an API consumer must not silently displace a file that directly supports a different requirement. Select the narrowest source spans that show each requirement or its caller behavior; expand only when the surrounding logic is needed to understand it. '+";
const result=original.replace(anchor,anchor+'\n'+preservation);
writeFileSync(outputPath,result,{flag:'wx',mode:0o644});
unlinkSync(intermediate);
console.log(JSON.stringify({predecessor_ranker_sha256:sha(original),output_ranker_sha256:sha(result),
  changed:'Generic requirement coverage and span-precision instruction in addition to API-consumer instruction.'}));
