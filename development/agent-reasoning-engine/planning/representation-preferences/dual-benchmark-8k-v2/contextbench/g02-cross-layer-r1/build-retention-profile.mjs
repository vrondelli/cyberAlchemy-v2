// Opt-in history projection in the pinned G02 full-window profile.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

const [sourcePath,outputPath]=process.argv.slice(2);
if(!sourcePath||!outputPath)throw Error('g02-retention-profile.arguments');
const source=readFileSync(sourcePath,'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
if(sha(source)!=='c3cbe527db03480124adf0f9dd1daf7b93deefa790674cbc1e0ce00f2f9b3af2')
  throw Error('g02-retention-profile.source-drift');
const anchor='discovery_retention:false';
if(source.split(anchor).length!==2)throw Error('g02-retention-profile.anchor-drift');
const output=source.replace(anchor,'discovery_retention:true');
writeFileSync(outputPath,output,{flag:'wx',mode:0o644});
console.log(JSON.stringify({source_sha256:sha(source),output_sha256:sha(output)}));
