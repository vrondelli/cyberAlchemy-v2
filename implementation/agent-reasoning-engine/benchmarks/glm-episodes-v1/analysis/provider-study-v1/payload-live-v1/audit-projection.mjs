// Independently reconstruct original envelope bytes from sidecars.
// No provider calls. Open questions: README.md.
import {readFileSync,writeFileSync} from 'node:fs';import {root,read,need,verify,sha} from './common.mjs';import {stable,hash} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';import {projectPrompt} from '../payload-js-v1/projection.mjs';
verify();const rows=read(new URL('prepared/schedule.json',root));let prompts=0,messages=0;const sources=[];
for(const row of rows){if(row.arm!=='payload')continue;const at=p=>new URL(`live/${row.id}/${p}`,root),rendered=read(at('rendered.json')),receipts=read(at('projection-receipts.json'));need(rendered.length===receipts.length,'projection receipt count');
 for(let i=0;i<rendered.length;i++){
  const r=receipts[i],view=rendered[i].prompt;need(hash(view)===r.projected_prompt_sha256,'projected prompt hash');const original=JSON.parse(view);need(original.messages.length===r.messages.length,'message count');
  for(const [j,receipt] of r.messages.entries()){need(receipt.message_index===j,'message index');if(!receipt.projected)continue;
   const m=original.messages[j],v=JSON.parse(m.content);need(v.schema_version==='are.model-tool-payload-view/v1','view schema');need(hash(m.content)===receipt.view_content_sha256,'view content hash');
   const restored=stable({...v,schema_version:'are.coding-agent-tool-result/v1',output_bytes:receipt.output_bytes,output_sha256:receipt.output_sha256});need(hash(restored)===receipt.source_content_sha256,'source reconstruction');m.content=restored;messages++;
  }
  const raw=stable(original);need(hash(raw)===r.original_prompt_sha256,'original prompt reconstruction');need(projectPrompt(raw).prompt===view,'projection replay');prompts++;
 }
 for(const name of ['rendered.json','projection-receipts.json'])sources.push({path:at(name).pathname,sha256:sha(readFileSync(at(name)))});
}
const report={passed:true,prompts,projected_messages:messages,sources,provider_calls:0,authority_effect:'none',open_questions_ref:'README.md'};writeFileSync(new URL('projection-audit.json',root),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:true,prompts,projected_messages:messages}));
