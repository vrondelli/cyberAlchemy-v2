// Preserve source reads and edits while projecting older search-only exchanges.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

const [sourcePath,outputPath]=process.argv.slice(2);
if(!sourcePath||!outputPath)throw Error('g02-selective-retention.arguments');
const source=readFileSync(sourcePath,'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
if(sha(source)!=='bc6501801f860b2efc59198153e1f58462cbac54c0820dc6960ad56d53d1c3e7')
  throw Error('g02-selective-retention.source-drift');
const anchor='projectHistory({history:deliveryVisible,pending:exchange})';
if(source.split(anchor).length!==2)throw Error('g02-selective-retention.anchor-drift');
const output=source.replace(anchor,
  "projectHistory({history:deliveryVisible,pending:exchange,protected_message_indices:deliveryVisible.flatMap((message,index)=>message.role==='assistant'&&message.tool_calls?.some(call=>['read_file','apply_edits','get_patch'].includes(call.function?.name))?[index]:[])})");
writeFileSync(outputPath,output,{flag:'wx',mode:0o644});
console.log(JSON.stringify({source_sha256:sha(source),output_sha256:sha(output)}));
