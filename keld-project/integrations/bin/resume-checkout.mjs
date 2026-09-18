import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {createPaymentAdapters} from '../src/payments.mjs';
import {createRepository} from '../src/repository.mjs';
import {resumeCheckout} from '../src/resume-checkout.mjs';
import {Rejected} from '../src/errors.mjs';
const [path,orderId,remoteId,...extra]=process.argv.slice(2);
if(!path||!orderId||!remoteId||extra.length){console.error('Usage: node bin/resume-checkout.mjs <config.json> <local-order-id> <provider-order-or-payment-id>');process.exitCode=1;}
else try{
  const {integration}=await loadConfig(path,{requireCurrentQuote:false,role:'worker'});
  console.log(JSON.stringify({ok:true,mode:'sandbox',...await resumeCheckout({repository:createRepository(integration.ledger),adapters:createPaymentAdapters(integration.payments),orderId,remoteId})}));
}catch(error){console.error(JSON.stringify(error instanceof ConfigurationError?{ok:false,error:'configuration-invalid',issues:error.issues}:{ok:false,error:error instanceof Rejected?error.code:'checkout-resume-failed'}));process.exitCode=1;}
