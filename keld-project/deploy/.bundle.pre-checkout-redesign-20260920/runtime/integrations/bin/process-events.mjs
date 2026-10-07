import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {createPaymentAdapters} from '../src/payments.mjs';
import {createRepository} from '../src/repository.mjs';
import {processEvents} from '../src/event-worker.mjs';
const [path,...extra]=process.argv.slice(2);
if(!path||extra.length){console.error('Usage: node bin/process-events.mjs <config.json>');process.exitCode=1;}
else try{
  const {integration}=await loadConfig(path,{requireCurrentQuote:false,role:'worker'});
  const result=await processEvents({repository:createRepository(integration.ledger),adapters:createPaymentAdapters(integration.payments)});
  const ok=result.failed.length===0&&result.retried===0&&result.review.length===0;
  console.log(JSON.stringify({ok,mode:'sandbox',...result}));if(!ok)process.exitCode=1;
}catch(error){console.error(JSON.stringify(error instanceof ConfigurationError?{ok:false,error:'configuration-invalid',issues:error.issues}:{ok:false,error:'event-worker-failed'}));process.exitCode=1;}
