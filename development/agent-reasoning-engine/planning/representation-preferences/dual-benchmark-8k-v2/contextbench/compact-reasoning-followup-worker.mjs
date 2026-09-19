// Dedicated bounded fresh-followup child. Open questions: COMPACT-REASONING-FOLLOWUP.md.
import {qualifyCompactFollowup} from './qualify-compact-reasoning-followup.mjs';
const controller=new AbortController();process.on('SIGTERM',()=>controller.abort());process.on('SIGINT',()=>controller.abort());
let input='';for await(const c of process.stdin){input+=c;if(Buffer.byteLength(input)>1024*1024)process.exit(2);}
let terminal=null,error=null;try{const request=JSON.parse(input).config.args;terminal=await qualifyCompactFollowup({...request,signal:controller.signal});if(!terminal.complete)error='incomplete';}catch(e){terminal=e.result??null;error=String(e.message);}
const output=JSON.stringify({terminal,error});if(Buffer.byteLength(output)>8*1024*1024)process.exit(3);process.stdout.write(output,()=>process.exit(error?2:0));
