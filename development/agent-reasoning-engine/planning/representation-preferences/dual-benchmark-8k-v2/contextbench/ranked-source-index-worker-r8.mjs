// Child of the existing reviewed process-group supervisor; no model transport.
// Open questions: RADICAL-SOURCE-ACQUISITION-PROTOCOL-R4.md.
import {spawn} from 'node:child_process';import {realpathSync} from 'node:fs';import {fileURLToPath} from 'node:url';
const python=realpathSync('/usr/bin/python3'),script=fileURLToPath(new URL('./ranked_source_supervisor_r8.py',import.meta.url));
let child=null,cancelled=false,input='',terminal=null,error=null;
const cancel=()=>{cancelled=true;child?.kill('SIGTERM');};
process.on('SIGTERM',cancel);process.on('SIGINT',cancel);
try{
 for await(const chunk of process.stdin){input+=chunk;if(Buffer.byteLength(input)>65536)throw Error('source-worker.input-limit');}
 const {config}=JSON.parse(input);if(cancelled)throw Error('source-worker.cancelled');
 const bytes=JSON.stringify(config);if(Buffer.byteLength(bytes)>65536)throw Error('source-worker.request-limit');
 terminal=await new Promise((resolve,reject)=>{
  child=spawn(python,['-B',script],{stdio:['pipe','pipe','pipe']});let size=0,stderr=0,chunks=[],failure=null;
  const fail=reason=>{failure??=reason;child.kill('SIGTERM');};
  child.on('error',()=>fail('source-worker.spawn-failed'));child.stdin.on('error',()=>fail('source-worker.input-failed'));
  child.stdout.on('data',chunk=>{size+=chunk.length;if(size>32*1024**2){fail('source-worker.output-limit');return;}chunks.push(chunk);});
  child.stderr.on('data',chunk=>{stderr+=chunk.length;if(stderr>65536)fail('source-worker.stderr-limit');});
  child.on('close',(code,signal)=>{
   if(failure||code!==0||signal)return reject(Error(failure??'source-worker.python-exit'));
   try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{reject(Error('source-worker.invalid-json'));}
  });
  child.stdin.end(bytes);if(cancelled)child.kill('SIGTERM');
 });
 if(cancelled||terminal.ok!==true)error=cancelled?'source-worker.cancelled':'source-worker.index-failed';
}catch(e){error=String(e.message);}
process.stdout.write(JSON.stringify({terminal,error}),()=>process.exit(error?2:0));
