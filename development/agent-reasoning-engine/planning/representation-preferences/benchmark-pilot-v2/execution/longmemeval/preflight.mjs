import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {prepareTasks} from './adapter.mjs';
import {createProvider,sha} from '../shared/provider.mjs';
const directory=resolve(import.meta.dirname,'preflight');mkdirSync(directory,{recursive:true});
const provider=createProvider({directory}),rows=[];
for(const [i,t] of prepareTasks().entries()){
 let r;try{const receipt=await provider.tokenize(`longmem-${i}`,t.messages);r={task_id:t.task_id,input_digest:sha(t.messages),input_tokens:receipt.usage.prompt_tokens,context_cap:8192,output_reserve:1024,admitted:receipt.usage.prompt_tokens+1024<=8192,exposure:t.exposure,receipt_ref:`longmem-${i}-receipt.json`};}
 catch(e){r={task_id:t.task_id,admitted:false,error:e.message,exposure:t.exposure};}
 rows.push(r);console.log(JSON.stringify(r));
 writeFileSync(resolve(directory,'result.json'),JSON.stringify({status:rows.length===4?'completed':'in-progress',model:'glm-5.3-flash',model_calls:0,rows,authority_effect:'none'},null,2)+'\n');
}
