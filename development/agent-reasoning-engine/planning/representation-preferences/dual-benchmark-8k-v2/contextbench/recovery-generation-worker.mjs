// Dedicated production child. Open questions: RECOVERY-LAUNCHER.md.
import {runRecoveryCampaign} from './recovery-campaign.mjs';
const controller=new AbortController();
process.on('SIGTERM',()=>controller.abort());process.on('SIGINT',()=>controller.abort());
let input='';for await(const chunk of process.stdin){input+=chunk; if(Buffer.byteLength(input)>1024*1024)process.exit(2);}
let terminal=null,error=null;
try{
 const request=JSON.parse(input);
 terminal=await runRecoveryCampaign({...request,signal:controller.signal});
}catch(e){terminal=e.result??null;error=String(e.message);}
const output=JSON.stringify({terminal,error});
if(Buffer.byteLength(output)>8*1024*1024)process.exit(3);
// Explicit process exit after flush closes all child-owned sockets; remote work is not certified.
process.stdout.write(output,()=>process.exit(error?2:0));
