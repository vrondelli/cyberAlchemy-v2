// Candidate model view only. Contract and open questions: README.md.
import {readFileSync} from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import {parseBoundedJSON} from '../../../../../packages/coding-agent-runtime/patch-schema.mjs';
import {stable,hash} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const schema=JSON.parse(readFileSync(new URL('../payload-view-v1/envelope.schema.json',import.meta.url)));
const validate=new Ajv2020({allErrors:true,strict:true,ownProperties:true}).compile(schema);
export const VIEW='are.model-tool-payload-view/v1';
export function projectMessage(message){
 const unchanged=issues=>({message,receipt:{projected:false,issues:issues.slice(0,64)}});
 if(!message||message.role!=='tool'||typeof message.content!=='string')return unchanged([]);
 const raw=message.content,parsed=parseBoundedJSON(raw);
 if(!parsed.ok)return unchanged(parsed.issues);
 const value=parsed.value;
 if(!validate(value))return unchanged(validate.errors.map(e=>({path:e.instancePath,keyword:e.keyword})));
 // Keep values that cannot round-trip safely out of this candidate profile.
 const safe=v=>typeof v==='number'?Number.isSafeInteger(v):typeof v==='string'?v.isWellFormed():v&&typeof v==='object'?Object.values(v).every(safe):true;
 if(!safe(value))return unchanged(['unsupported-json-value']);
 let output=stable(value.output),profile='canonical-output';const source=value.output;
 if(hash(output)!==value.output_sha256&&stable(Object.keys(source).sort())===stable(['byte_count','path','sha256','utf8'])){
  if(typeof source.path==='string'&&typeof source.utf8==='string'&&Number.isSafeInteger(source.byte_count)&&hash(source.utf8)===source.sha256&&Buffer.byteLength(source.utf8)===source.byte_count){
   output=JSON.stringify({path:source.path,utf8:source.utf8,sha256:source.sha256,byte_count:source.byte_count});profile='native-read-file-output';
  }
 }
 const issues=[];
 if(hash(output)!==value.output_sha256)issues.push('canonical-output-digest-mismatch');
 if(Buffer.byteLength(output)!==value.output_bytes)issues.push('canonical-output-bytes-mismatch');
 if(issues.length)return unchanged(issues);
 const {output_sha256,output_bytes,...view}=value;view.schema_version=VIEW;const content=stable(view);
 return {message:{...message,content},receipt:{projected:true,digest_profile:profile,source_content_sha256:hash(raw),view_content_sha256:hash(content),output_sha256,output_bytes,removed_bytes:Buffer.byteLength(raw)-Buffer.byteLength(content)}};
}
export function projectPrompt(prompt){
 const parsed=parseBoundedJSON(prompt);if(!parsed.ok||!Array.isArray(parsed.value?.messages))throw Error('payload-view.prompt-invalid');
 const receipts=[],messages=parsed.value.messages.map((m,i)=>{const r=projectMessage(m);receipts.push({message_index:i,...r.receipt});return r.message;});
 return {prompt:stable({...parsed.value,messages}),receipts};
}
