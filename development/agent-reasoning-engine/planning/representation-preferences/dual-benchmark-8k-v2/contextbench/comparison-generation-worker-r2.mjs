// Dedicated generation child; no evaluator imports. Open questions: COMPARISON-CAPACITY.md.
import {runComparisonCampaign} from './comparison-campaign-runner-r2.mjs';
import {createComparisonGenerationStorage} from './comparison-generation-storage-r2.mjs';
const controller=new AbortController();process.on('SIGTERM',()=>controller.abort());process.on('SIGINT',()=>controller.abort());
let input='';for await(const chunk of process.stdin){input+=chunk;if(Buffer.byteLength(input)>1024*1024)process.exit(2);}
let terminal=null,error=null;
try{
 const envelope=JSON.parse(input),request=envelope.config;
 const storage=createComparisonGenerationStorage(request);
 terminal=await runComparisonCampaign({...request,...storage,signal:controller.signal});
}catch(e){terminal=e.campaign_evidence??e.result??null;error=String(e.message);}
const output=JSON.stringify({terminal,error});if(Buffer.byteLength(output)>8*1024*1024)process.exit(3);
process.stdout.write(output,()=>process.exit(error?2:0));
