import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {createPaymentAdapters} from '../src/payments.mjs';
import {createRepository} from '../src/repository.mjs';
import {discoverPayment} from '../src/discover-payment.mjs';
import {Rejected} from '../src/errors.mjs';
const [path,orderId,mode='inspect',...extra]=process.argv.slice(2);
if(!path||!orderId||extra.length||!['inspect','recover'].includes(mode)){
  console.error('Usage: node bin/discover-payment.mjs <config.json> <local-order-id> [inspect|recover]');process.exitCode=1;
}else try{
  const {integration}=await loadConfig(path,{requireCurrentQuote:false,role:'worker'});
  const result=await discoverPayment({repository:createRepository(integration.ledger),adapters:createPaymentAdapters(integration.payments),orderId,recover:mode==='recover'});
  const ok=result.outcome==='verified-paid'||result.outcome==='recovered'&&result.status==='paid';
  console.log(JSON.stringify({ok,mode:'sandbox',...result}));if(!ok)process.exitCode=1;
}catch(error){
  console.error(JSON.stringify(error instanceof ConfigurationError?{ok:false,error:'configuration-invalid',issues:error.issues}:{ok:false,error:error instanceof Rejected?error.code:'payment-discovery-failed'}));process.exitCode=1;
}
