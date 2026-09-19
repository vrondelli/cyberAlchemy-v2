// Offline, exact denied-request replay. Open questions: DEEPSEEK-CONTROL-FIT-DAG.md.
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {encodeToolPayload,decodeToolPayload,PAYLOAD_GUIDE} from './tool-payload-codec.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const root=import.meta.dirname,out=join(root,'deepseek-payload-replay-65');mkdirSync(out);
const hash=s=>createHash('sha256').update(s).digest('hex'),rows=[];
for(let i=1;i<=4;i++){
 const dir=join(root,'deepseek-pilot-r3/evidence/runs',i+'-dsh/transport'),events=readdirSync(dir).filter(n=>/^\d{6}\.json$/.test(n)).sort().map(n=>JSON.parse(readFileSync(join(dir,n),'utf8')));
 const denied=events.find(e=>e.kind==='admission'&&!e.admitted),request=events.find(e=>e.kind==='request'&&e.attempt===denied.attempt),original=JSON.parse(request.request_bytes),encoded=structuredClone(original),calls=new Map();let changed=0,saved=0;
 for(const message of encoded.messages){
  if(message.role==='assistant')for(const call of message.tool_calls??[])calls.set(call.id,call.function.name);
  if(message.role!=='tool')continue;
  const tool=calls.get(message.tool_call_id);if(!tool)throw Error('orphan tool');
  let value;try{value=JSON.parse(message.content);}catch{continue;}
  const result=encodeToolPayload({tool,result:value});
  if(stable(decodeToolPayload({tool,payload:result.payload}))!==stable(value))throw Error('roundtrip mismatch');
  if(result.encoded){changed++;saved+=result.original_bytes-result.payload_bytes;message.content=stable(result.payload);}
 }
 if(changed)encoded.messages.unshift({role:'system',content:PAYLOAD_GUIDE});
 const a=stable(original),b=stable(encoded);
 writeFileSync(join(out,i+'-original.json'),a,{flag:'wx'});writeFileSync(join(out,i+'-encoded.json'),b,{flag:'wx'});
 rows.push({task_id:'contextbench-'+i,attempt:denied.attempt,original_sha256:hash(a),encoded_sha256:hash(b),original_bytes:Buffer.byteLength(a),encoded_bytes:Buffer.byteLength(b),encoded_tool_results:changed,payload_bytes_saved:saved,original_measured:denied.measured,output_cap:denied.cap,margin:denied.margin,original_reservation:denied.reservation,lossless:true});
}
writeFileSync(join(out,'REPLAY.json'),JSON.stringify({rows,new_model_calls:0,tokenizer_measurement_pending:true,benchmark_cleared:false},null,2));console.log(JSON.stringify(rows));
