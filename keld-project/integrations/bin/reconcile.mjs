import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {createPaymentAdapters} from '../src/payments.mjs';
import {createRepository} from '../src/repository.mjs';
import {reconcileBatch} from '../src/reconcile.mjs';
const [path,...extra]=process.argv.slice(2);
if(!path||extra.length){console.error('Usage: node bin/reconcile.mjs <config.json>');process.exitCode=1;}
else try{
  const config=await loadConfig(path,{requireCurrentQuote:false,role:'worker'});
  const result=await reconcileBatch({repository:createRepository(config.integration.ledger),adapters:createPaymentAdapters(config.integration.payments)});
  console.log(JSON.stringify({ok:result.failed.length===0,mode:'sandbox',...result}));if(result.failed.length)process.exitCode=1;
}catch(error){console.error(JSON.stringify(error instanceof ConfigurationError?{ok:false,error:'configuration-invalid',issues:error.issues}:{ok:false,error:'reconciliation-failed'}));process.exitCode=1;}
