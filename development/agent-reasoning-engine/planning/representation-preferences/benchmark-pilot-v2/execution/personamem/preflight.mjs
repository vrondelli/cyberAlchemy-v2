import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {prepareTasks} from './adapter.mjs';
import {createProvider} from '../shared/provider.mjs';
const provider=createProvider({directory:join(import.meta.dirname,'preflight')});
const rows=[];
for(const t of prepareTasks()){
 const receipt=await provider.tokenize(t.task_id.replaceAll(':','-')+'-full-history-v1',t.messages);
 rows.push({task_id:t.task_id,request_sha256:receipt.request_sha256,input_tokens:receipt.usage.prompt_tokens,input_limit:7168,output_reserved:1024,status:receipt.usage.prompt_tokens<=7168?'admitted':'blocked-overlength',message_count:t.messages.length,removed:t.metadata.removed});
}
writeFileSync(join(import.meta.dirname,'context-admission.json'),JSON.stringify({schema_version:'are.personamem-admission/v1',rows,model_calls:0,authority_effect:'none'},null,2)+'\n');
console.log(JSON.stringify(rows,null,2));
