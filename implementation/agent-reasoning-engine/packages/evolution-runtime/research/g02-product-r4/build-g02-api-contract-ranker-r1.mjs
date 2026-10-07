// Version the ranker with a generic API-consumer verification instruction.
// The predecessor builder still owns the deterministic source-hint code.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync,unlinkSync,writeFileSync} from 'node:fs';

const [sourcePath,helperPath,outputPath]=process.argv.slice(2);
if(!sourcePath||!helperPath||!outputPath)throw Error('api-contract-ranker.arguments');
const predecessor='/opt/are/evolution-runtime/g02-cross-layer-nodebb-live-diagnostic-r4/code/build-ranker.mjs';
const sha=data=>createHash('sha256').update(data).digest('hex');
const need=(value,reason)=>{if(!value)throw Error('api-contract-ranker.'+reason);};
need(sha(readFileSync(predecessor))==='ee79891183eec1538ce85d98aabf54b41f910dc091fca202a4592efa45e8a003','predecessor-drift');
const intermediate=outputPath+'.api-contract-predecessor';
const built=spawnSync('/opt/cyberalchemy-are-tools/node-24.10.0/node',
  [predecessor,sourcePath,helperPath,intermediate],{encoding:'utf8'});
need(built.status===0,'predecessor-build:'+built.stderr?.slice(-250));
const original=readFileSync(intermediate,'utf8');
need(sha(original)==='70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce','ranker-drift');
const anchor="    'Before final selection, check each distinct issue requirement against delivered source, including configuration fixtures and nearby tests. '+";
need(original.split(anchor).length===2,'summary-anchor');
const additional="    'For a public API migration, deprecation or backward-compatibility issue, search production consumers of named classes and constants, read likely affected callers at the pinned base, and tie each selected file to a specific issue requirement; abstain from unrelated exact-name matches. '+";
const result=original.replace(anchor,anchor+'\n'+additional);
writeFileSync(outputPath,result,{flag:'wx',mode:0o644});
unlinkSync(intermediate);
console.log(JSON.stringify({predecessor_ranker_sha256:sha(original),
  output_ranker_sha256:sha(result),changed:'API-consumer verification instruction only'}));
