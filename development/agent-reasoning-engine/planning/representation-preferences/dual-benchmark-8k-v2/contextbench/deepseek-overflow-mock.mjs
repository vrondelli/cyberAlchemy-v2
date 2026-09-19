// Offline actual-harness compaction fixture, not task quality. Open questions: DEEPSEEK-COMPARISON-DAG.md.
import {createServer} from 'node:http';import {writeFileSync} from 'node:fs';
let seq=0,tools=0,summaries=0,lastRead=null;
createServer(async(req,res)=>{try{
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>262144)throw Error('request-size');chunks.push(chunk);}
 const raw=Buffer.concat(chunks).toString('utf8'),body=JSON.parse(raw),n=seq++;
 if(n>=24)throw Error('fixture-call-ceiling');writeFileSync('/evidence/request-'+n+'.json',raw,{flag:'wx'});
 if(body.reasoning_effort!=='low'||body.thinking?.type!=='enabled'||body.thinking.clear_thinking!==false)throw Error('reasoning-profile-mismatch');
 if(n===2){writeFileSync('/evidence/injected-overflow.json',JSON.stringify({request:n,paid:false}));res.writeHead(400,{'content-type':'application/json'});res.end(JSON.stringify({error:{code:'context_length_exceeded',type:'invalid_request_error',message:'Maximum context length is 8000 tokens including the output reservation. Compact the context before trying again.'}}));return;}
 const summary=body.messages.some(m=>m.role==='user'&&typeof m.content==='string'&&m.content.includes('You are now acting as a compaction engine')); 
 let delta,finish;
 if(summary){summaries++;delta={role:'assistant',content:'Continue the fixture task. Source file value.js has value 1. Read pinned base before final selection. Prior source read ID: '+lastRead};finish='stop';}
 else{
  const reads=body.messages.filter(m=>m.role==='tool').flatMap(m=>{try{const r=JSON.parse(m.content);return r.output?.read_id?[r.output]:[];}catch{return [];}});
  if(reads.length)lastRead=reads.at(-1).read_id;
  const final=tools>=8&&lastRead;tools++;
  const name=final?'submit_context_selection':'read_file',args=final?{summary:'Scripted compaction qualification; no repair-quality claim',context_read_ids:[lastRead]}:{path:'value.js',start_line:1,line_count:1,revision:'base'};
  delta={role:'assistant',reasoning_content:'Offline fixture history. '.repeat(50),tool_calls:[{index:0,id:'profile-call-'+n,type:'function',function:{name,arguments:JSON.stringify(args)}}]};finish='tool_calls';
 }
 const input=Math.ceil(raw.length/3),output=summary?100:500;
 const event={id:'profile-'+n,object:'chat.completion.chunk',model:body.model,choices:[{index:0,delta,finish_reason:finish}],usage:{prompt_tokens:input,completion_tokens:output,total_tokens:input+output}};
 const bytes='data: '+JSON.stringify(event)+'\n\ndata: [DONE]\n\n';writeFileSync('/evidence/response-'+n+'.sse',bytes,{flag:'wx'});writeFileSync('/evidence/summary.json',JSON.stringify({calls:seq,tools,summaries}));res.writeHead(200,{'content-type':'text/event-stream'});res.end(bytes);
 }catch(e){writeFileSync('/evidence/error-'+seq+'.json',JSON.stringify({error:e.message}));res.writeHead(400,{'content-type':'application/json'});res.end(JSON.stringify({error:{message:e.message}}));}
}).listen(8080,'0.0.0.0');
