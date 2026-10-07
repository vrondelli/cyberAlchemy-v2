// Harden pinned ranker expansion lookup against inherited Object properties.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

const [sourcePath,outputPath]=process.argv.slice(2);
if(!sourcePath||!outputPath)throw Error('g02-own-expansions.arguments');
const source=readFileSync(sourcePath,'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
if(sha(source)!=='e924fce63ef783781b8361e8225fb9bc71756005ad9d4e0d5af8b0ebf2939dbd')
  throw Error('g02-own-expansions.source-drift');
const anchor='expanded.push(...(EXPANSIONS[token] ?? []));';
if(source.split(anchor).length!==2)throw Error('g02-own-expansions.anchor-drift');
const output=source.replace(anchor,
  'expanded.push(...(Object.hasOwn(EXPANSIONS,token)?EXPANSIONS[token]:[]));');
writeFileSync(outputPath,output,{flag:'wx',mode:0o644});
console.log(JSON.stringify({source_sha256:sha(source),output_sha256:sha(output)}));
