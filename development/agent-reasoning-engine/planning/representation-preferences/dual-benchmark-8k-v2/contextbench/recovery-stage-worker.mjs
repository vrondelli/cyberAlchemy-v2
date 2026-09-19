// One bounded local qualification/evaluator subprocess. Open questions: RECOVERY-PRODUCTION.md.
import {qualifyProduction,verifyProductionFreeze} from './recovery-production.mjs';
import {scoreRecoveryCampaign} from './score-recovery-campaign.mjs';
let input='';for await(const chunk of process.stdin){input+=chunk;if(Buffer.byteLength(input)>1024*1024)process.exit(2);}
let terminal=null,error=null;
try{
 const {config:{operation,args}}=JSON.parse(input);
 if(operation==='qualify')terminal=qualifyProduction(args);
 else if(operation==='score'){verifyProductionFreeze(args.manifest_path,args.manifest_sha256);terminal=await scoreRecoveryCampaign(args);verifyProductionFreeze(args.manifest_path,args.manifest_sha256);}
 else throw Error('recovery-stage.operation');
}catch(e){error=String(e.message);}
const output=JSON.stringify({terminal,error});if(Buffer.byteLength(output)>8*1024*1024)process.exit(3);
process.stdout.write(output,()=>process.exit(error?2:0));
