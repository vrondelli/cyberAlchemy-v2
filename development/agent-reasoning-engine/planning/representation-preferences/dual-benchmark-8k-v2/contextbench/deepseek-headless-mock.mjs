// Scripted provider for full headless wiring only. No provider calls or benchmark scores.
import {createServer} from 'node:http';
import {writeFileSync} from 'node:fs';
let step=0;
createServer(async(req,res)=>{
 if(req.url==='/healthz'){res.end('ready');return;}
 try{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const body=JSON.parse(Buffer.concat(chunks));const n=step++;
  writeFileSync(`/evidence/request-${n}.json`,JSON.stringify(body,null,2),{flag:'wx'});
  const expected=['apply_edits','get_patch','list_files','read_file','search','submit_context_selection'];
  if(JSON.stringify(body.tools.map(t=>t.function.name).sort())!==JSON.stringify(expected))throw Error('unexpected-tools');
  const reads=body.messages.filter(m=>m.role==='tool').flatMap(m=>{try{const r=JSON.parse(m.content);return r.output?.read_id?[r.output]:[];}catch{return [];}});
  let name,args;
  if(n===0){name='read_file';args={path:'value.js',start_line:1,line_count:1,revision:'base'};}
  else if(n===1){name='apply_edits';args={edits:[{path:'value.js',source_sha256:reads[0].source_sha256,old_text:'value = 1',new_text:'value = 2'}]};}
  else if(n===2){name='read_file';args={path:'value.js',start_line:1,line_count:1,revision:'base'};}
  else if(n===3){name='submit_context_selection';args={summary:'Attempted value correction; scripted fixture',context_read_ids:[reads.at(-1).read_id]};}
  else throw Error('unexpected-additional-model-call');
  const event={id:'fixture-'+n,object:'chat.completion.chunk',model:body.model,choices:[{index:0,delta:{role:'assistant',reasoning_content:'fixture reasoning '+n,tool_calls:[{index:0,id:'fixture-call-'+n,type:'function',function:{name,arguments:JSON.stringify(args)}}]},finish_reason:'tool_calls'}],usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120}};
  writeFileSync(`/evidence/response-${n}.json`,JSON.stringify(event,null,2),{flag:'wx'});
  res.writeHead(200,{'content-type':'text/event-stream'});res.end('data: '+JSON.stringify(event)+'\n\ndata: [DONE]\n\n');
 }catch(error){writeFileSync('/evidence/error-'+step+'.json',JSON.stringify({error:String(error.message)}));res.writeHead(400,{'content-type':'application/json'});res.end(JSON.stringify({error:{message:String(error.message)}}));}
}).listen(8080,'0.0.0.0');
