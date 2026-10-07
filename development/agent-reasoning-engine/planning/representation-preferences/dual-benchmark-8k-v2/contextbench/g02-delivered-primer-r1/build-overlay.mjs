// Mechanical run-local overlay of the pinned VPS snapshot. No model call.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('overlay.arguments');
const source=readFileSync(input,'utf8');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
if(sha(source)!=='14e6684db073c1fde6f6126fb606c63607e6b15ade8e70f2476279798ab0c4dc')throw Error('overlay.input-drift');
const before='const request=limits.compact_representation===true?compactRequest({messages,tools:promptTools}):{messages,tools:promptTools};const prompt=stable(request);captures.push({step,generation:meta.generation,prompt,prompt_sha256:hash(prompt)});';
const after=`const request=limits.compact_representation===true?compactRequest({messages,tools:promptTools}):{messages,tools:promptTools};
          // Preserve the ranked-source appendix after compactRequest replaces the system message.
          if(limits.compact_representation===true&&system_appendix){
            request.messages[0]={...request.messages[0],content:request.messages[0].content+' '+system_appendix};
          }
          const prompt=stable(request);captures.push({step,generation:meta.generation,prompt,prompt_sha256:hash(prompt)});`;
if(source.split(before).length!==2)throw Error('overlay.anchor-count');
const patched=source.replace(before,after);
writeFileSync(output,patched,{flag:'wx',mode:0o644});
console.log(JSON.stringify({source_sha256:sha(source),overlay_sha256:sha(patched),changed_bytes:Buffer.byteLength(patched)-Buffer.byteLength(source)}));
