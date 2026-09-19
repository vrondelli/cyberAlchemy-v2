// Additive archive launch composition. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
// Candidate-only launch stage. Open questions: CANDIDATE-ONLY-LIVE.md.
// Tokenizer-only child. Open questions: COMPARISON-QUALIFICATION-PROCESS.md.
import {qualifyComparisonRequests} from './ranked-read-request-qualification-r1.mjs';
const controller=new AbortController();
process.on('SIGTERM',()=>controller.abort());process.on('SIGINT',()=>controller.abort());
let input='';for await(const chunk of process.stdin){input+=chunk;if(Buffer.byteLength(input)>1024*1024)process.exit(2);}
let terminal=null,error=null;
try{const {config}=JSON.parse(input);terminal=await qualifyComparisonRequests({...config,signal:controller.signal});if(!terminal.qualified)error='qualification-incomplete';}
catch(e){terminal=e.result??null;error=String(e.message);}
const output=JSON.stringify({terminal,error});if(Buffer.byteLength(output)>8*1024*1024)process.exit(3);
process.stdout.write(output,()=>process.exit(error?2:0));
