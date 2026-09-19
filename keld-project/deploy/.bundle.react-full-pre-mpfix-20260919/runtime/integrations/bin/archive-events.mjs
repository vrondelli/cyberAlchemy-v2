import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {createRepository} from '../src/repository.mjs';
import {Rejected} from '../src/errors.mjs';
const [path,cutoff,mode='preview',...extra]=process.argv.slice(2);
if(!path||extra.length||!/^\d+$/.test(cutoff??'')||!Number.isSafeInteger(Number(cutoff))||!['preview','apply'].includes(mode)){
  console.error('Usage: node bin/archive-events.mjs <config.json> <received-before-unix-seconds> [preview|apply]');process.exitCode=1;
}else try{
  const {integration}=await loadConfig(path,{requireCurrentQuote:false,role:'worker'});
  const result=await createRepository(integration.ledger)('event-archive',{before:Number(cutoff),dryRun:mode==='preview',now:Math.floor(Date.now()/1000)});
  console.log(JSON.stringify({ok:true,mode:'sandbox',...result}));
}catch(error){console.error(JSON.stringify(error instanceof ConfigurationError?{ok:false,error:'configuration-invalid',issues:error.issues}:{ok:false,error:error instanceof Rejected?error.code:'event-archive-failed'}));process.exitCode=1;}
