// Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {createHash} from 'node:crypto';
import {createRankedReadAdapter} from './ranked-read-acquisition-tool-r2.mjs';
import {bindRankedReadDelivery} from './ranked-read-delivery-r1.mjs';
import {encodeToolPayload} from './tool-payload-codec.mjs';
import {stable,bodyForReceipt,attachObservationHandles} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
export async function fixture({encode=false,empty=false}={}){
 const args={query:'conceptual query absent from source',mode:'ranked',revision:'base',path_prefix:'',offset:0,limit:5};
 const call={id:'real-search-1',type:'function',function:{name:'search',arguments:stable(args)}};
 const source='alpha\nbeta\n',source_sha256=hash(source),base_commit='a'.repeat(40),index_digest='b'.repeat(64),path='source.txt';
 const expected={base_commit,index_digest,partial_index:false,files:new Map([[path,source_sha256]])},sources=new Map([[path,source]]);
 const hints={schema:'are.ranked-source-hints/v1',index_digest,query_digest:hash({query:args.query}),partial_index:false,omitted_query_terms:0,matching_windows:empty?0:1,hints:empty?[]:[{path,base_commit,content_sha256:source_sha256,start_line:1,end_line:2,score_units:10}],omitted_hints:0,unreadable_matching_lines:0,unreadable_path_fallbacks:0};
 const native=async()=>({ok:true,output:{path,base_commit,source_sha256,source_revision:'base',total_lines:2,start_line:1,end_line:2,utf8:'alpha\nbeta',byte_count:10}});
 const run=createRankedReadAdapter({native,source_hints:{expected,query:async()=>hints},snapshot:async()=>source});
 const result=await run(call,args),evidence={call,result,hints,expected,sources};
 const payload=encode?encodeToolPayload({tool:'search',result}).payload:result;
 const wire={messages:[{role:'assistant',tool_calls:[call]},{role:'tool',tool_call_id:call.id,content:stable(payload)}],tools:[]};
 const prompt=stable(wire),receipt={kind:'model',dispatched:true,status:200,input_tokens:500,output_tokens:20,model:'test',output_cap:100,reasoning_effort:'low'};
 receipt.request_sha256=hash(bodyForReceipt(prompt,receipt));
 return {captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[receipt],ranked_evidence:new Map([[call.id,evidence]]),wire,call,result};
}
