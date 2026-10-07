// Exact additive packet variant: only focused Go reads may use 100 lines.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

const [sourcePath,outputPath]=process.argv.slice(2);
if(!sourcePath||!outputPath)throw Error('g02-go-packet.arguments');
const source=readFileSync(sourcePath,'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
if(sha(source)!=='bc6501801f860b2efc59198153e1f58462cbac54c0820dc6960ad56d53d1c3e7')
  throw Error('g02-go-packet.source-drift');
const anchor="start_line:Math.max(1,hint.start_line-8),line_count:50,revision:'base'";
if(source.split(anchor).length!==2)throw Error('g02-go-packet.anchor-drift');
const output=source.replace(anchor,
  "start_line:Math.max(1,hint.start_line-8),line_count:hint.packet_role==='focused'&&/\\.go$/.test(hint.path)?100:50,revision:'base'");
writeFileSync(outputPath,output,{flag:'wx',mode:0o644});
console.log(JSON.stringify({source_sha256:sha(source),output_sha256:sha(output)}));
